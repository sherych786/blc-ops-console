"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { num, name4, ddmmmyyyy, todayISO, time5 } from "@/lib/format";
import { shiftCalc } from "@/lib/calc";
import { slipTotals, type Slip, type SlipRow } from "@/components/SlipDoc";

const t = (s: unknown) => String(s ?? "").trim() || null;

// ---------------------------------------------------------------- employees
export async function saveEmployee(d: Record<string, string>, id?: string | null) {
  const name = (d.name || "").trim();
  if (!name || !d.phone?.trim()) return { error: "Full name and mobile are required." };
  const row = {
    name,
    phone: t(d.phone),
    email: t(d.email),
    address: t(d.address),
    bank_name: t(d.bank_name),
    bank_account: t(d.bank_account),
    bank_sort_code: t(d.bank_sort_code),
    vehicle_id: d.vehicle_id || null,
    registration: t(d.registration?.toUpperCase()),
    shift_hours: num(d.shift_hours) || 10,
    daily_wage: num(d.daily_wage),
    extra_hour_rate: num(d.extra_hour_rate),
    manager: t(d.manager),
    invoice_basis: t(d.invoice_basis) || "Weekly",
  };
  const supabase = await createClient();
  const res = id
    ? await supabase.from("employees").update(row).eq("id", id).select("id").single()
    : await supabase.from("employees").insert(row).select("id").single();
  if (res.error) return { error: res.error.message };
  revalidatePath("/", "layout");
  return { id: res.data.id as string };
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("employees").delete().eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

// ------------------------------------------------------------- salary slips
/**
 * genSlip(): builds a slip from every shift the employee logged in the
 * range. The shifts and pay rates are snapshotted onto the slip so a
 * later wage change never rewrites a slip that was already sent.
 */
export async function generateSlip(empId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data: e } = await supabase
    .from("employees")
    .select("*, fleet(class)")
    .eq("id", empId)
    .maybeSingle();
  if (!e) return { error: "Choose a driver" };

  let q = supabase
    .from("shift_logs")
    .select("log_date, start_time, end_time, shift_expenses(label, amount), shift_extra_jobs(description, agreed_pay)")
    .eq("employee_id", empId)
    .order("log_date", { ascending: false });
  if (from) q = q.gte("log_date", from);
  if (to) q = q.lte("log_date", to);
  const { data: shifts, error } = await q;
  if (error) return { error: error.message };
  if (!shifts?.length) return { error: "No shifts in range to bill" };

  const rows: SlipRow[] = shifts.map((s) => {
    const expenses = (s.shift_expenses || []).map((x) => ({ label: x.label, amount: num(x.amount) }));
    const extraJobs = (s.shift_extra_jobs || []).map((x) => ({ label: x.description, amount: num(x.agreed_pay) }));
    const start = time5(s.start_time);
    const end = time5(s.end_time);
    return { date: s.log_date, shift: start + "–" + end, expenses, extraJobs, c: shiftCalc({ start, end, expenses, extraJobs }, e) };
  });

  // SAL-NAME-DDMMMYYYY, with -2, -3 … if that number already exists.
  const base = "SAL-" + name4(e.name) + "-" + ddmmmyyyy(todayISO());
  const { data: taken } = await supabase.from("salary_slips").select("slip_no").like("slip_no", base + "%");
  const used = new Set((taken || []).map((x) => x.slip_no));
  let slipNo = base;
  if (used.has(slipNo)) {
    let k = 2;
    while (used.has(base + "-" + k)) k++;
    slipNo = base + "-" + k;
  }

  const employee = {
    name: e.name,
    phone: e.phone,
    email: e.email,
    address: e.address,
    vehicle: (e.fleet as { class: string } | null)?.class || null,
    registration: e.registration,
    bank_name: e.bank_name,
    bank_account: e.bank_account,
    bank_sort_code: e.bank_sort_code,
    basis: e.invoice_basis,
  };
  const tt = slipTotals({ rows, adjustments: [] });
  const { error: insErr } = await supabase.from("salary_slips").insert({
    slip_no: slipNo,
    employee_id: empId,
    period_date: rows[0].date,
    period_from: from || rows[rows.length - 1].date,
    period_to: to || rows[0].date,
    employee,
    rows,
    adjustments: [],
    wage: tt.base,
    extra_pay: tt.extra,
    extra_hours: rows.reduce((s, r) => s + r.c.extraH, 0),
    expenses_total: tt.exp,
    extra_jobs_total: tt.jobsT,
    adjustment: 0,
    total: tt.net,
    status: "Unpaid",
  });
  if (insErr) return { error: insErr.message };
  revalidatePath("/", "layout");
  return { slipNo };
}

async function writeSlip(id: string, patch: Partial<Pick<Slip, "status" | "adjustments">>) {
  const supabase = await createClient();
  const { data: s } = await supabase.from("salary_slips").select("rows, adjustments").eq("id", id).single();
  if (!s) return { error: "Slip not found" };
  const adjustments = patch.adjustments ?? s.adjustments;
  const tt = slipTotals({ rows: s.rows, adjustments });
  const { error } = await supabase
    .from("salary_slips")
    .update({ ...patch, adjustment: tt.adj, total: tt.net })
    .eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

export async function setSlipStatus(id: string, status: "Paid" | "Unpaid") {
  return writeSlip(id, { status });
}

export async function setSlipAdjustments(id: string, adjustments: { label: string; amount: number }[]) {
  return writeSlip(id, { adjustments });
}
