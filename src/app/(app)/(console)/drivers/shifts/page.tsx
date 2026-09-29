import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { num, time5 } from "@/lib/format";
import { shiftCalc } from "@/lib/calc";
import { PageHead } from "@/components/ui";
import { ShiftsClient, type ShiftRow } from "./ShiftsClient";

type SP = { emp?: string; from?: string; to?: string };

/** BLC Drivers → Jobs review (prototype renderShifts()). */
export default async function ShiftsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: emps } = await supabase.from("employees").select("id, name, shift_hours, daily_wage, extra_hour_rate").order("name");
  const list = emps || [];
  const emp = list.find((e) => e.id === sp.emp) || list[0];

  let rows: ShiftRow[] = [];
  if (emp) {
    let q = supabase
      .from("shift_logs")
      .select("id, log_date, start_time, end_time, note, shift_expenses(label, amount), shift_extra_jobs(description, agreed_pay)")
      .eq("employee_id", emp.id)
      .order("log_date", { ascending: false });
    if (sp.from) q = q.gte("log_date", sp.from);
    if (sp.to) q = q.lte("log_date", sp.to);
    const { data } = await q;
    rows = (data || []).map((s) => {
      const start = time5(s.start_time);
      const end = time5(s.end_time);
      const expenses = (s.shift_expenses || []).map((x) => ({ label: x.label, amount: num(x.amount) }));
      const extraJobs = (s.shift_extra_jobs || []).map((x) => ({ label: x.description, amount: num(x.agreed_pay) }));
      return { id: s.id, date: s.log_date, start, end, note: s.note, c: shiftCalc({ start, end, expenses, extraJobs }, emp) };
    });
  }

  return (
    <section>
      <PageHead eyebrow="BLC Drivers" title="Jobs review" sub="Select a driver to see their logged shifts, expenses and pay for any date range.">
        <Link className="btn primary" href="/drivers/salary-slips">Salary slips →</Link>
      </PageHead>
      <ShiftsClient employees={list.map((e) => ({ id: e.id, name: e.name }))} empId={emp?.id || ""} from={sp.from || ""} to={sp.to || ""} rows={rows} />
    </section>
  );
}
