"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { money, fmtDateShort } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { Kpi, EmptyRow } from "@/components/ui";
import { generateSlip } from "../actions";

export type ShiftRow = {
  id: string;
  date: string;
  start: string;
  end: string;
  note: string | null;
  c: { w: number; extraH: number; base: number; extraPay: number; jobsT: number; exp: number; total: number };
};

export function ShiftsClient({
  employees,
  empId,
  from,
  to,
  rows,
}: {
  employees: { id: string; name: string }[];
  empId: string;
  from: string;
  to: string;
  rows: ShiftRow[];
}) {
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [pending, start] = useTransition();

  function go(next: { emp?: string; from?: string; to?: string }) {
    const v = { emp: empId, from, to, ...next };
    const p = new URLSearchParams();
    (Object.keys(v) as (keyof typeof v)[]).forEach((k) => v[k] && p.set(k, v[k]!));
    router.replace(`${path}?${p}`, { scroll: false });
  }

  let hrs = 0, wage = 0, exp = 0, pay = 0;
  rows.forEach((r) => {
    hrs += r.c.w;
    wage += r.c.base + r.c.extraPay;
    exp += r.c.exp;
    pay += r.c.total;
  });

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-h">
        <h3>Driver</h3>
        <div className="tools">
          <select className="field-mini" value={empId} onChange={(e) => go({ emp: e.target.value })}>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <span className="daterange">
            From<input type="date" className="field-mini" value={from} onChange={(e) => go({ from: e.target.value })} />
            To<input type="date" className="field-mini" value={to} onChange={(e) => go({ to: e.target.value })} />
          </span>
          <button className="btn xs ghost" onClick={() => go({ from: "", to: "" })}>Clear</button>
          <button
            className="btn sm primary"
            disabled={pending || !empId}
            onClick={() =>
              start(async () => {
                const r = await generateSlip(empId, from, to);
                if (r.error) return toast(r.error);
                toast("Salary slip " + r.slipNo + " generated");
                router.push(`/drivers/salary-slips?open=${encodeURIComponent(r.slipNo!)}`);
              })
            }
          >
            Generate salary slip
          </button>
        </div>
      </div>
      <div className="kpis five" style={{ margin: 16, marginBottom: 0 }}>
        <Kpi lab="Shifts" val={rows.length} sub="In range" />
        <Kpi lab="Hours worked" val={hrs.toFixed(1)} sub="Total logged" />
        <Kpi lab="Wages" val={money(wage)} sub="Base plus extra hours" />
        <Kpi lab="Expenses" val={money(exp)} sub="To reimburse" />
        <Kpi lab="Total payable" val={money(pay)} sub="Wages + jobs + expenses" />
      </div>
      <div className="tbl-wrap" style={{ paddingTop: 8 }}>
        <table>
          <thead>
            <tr><th>Date</th><th>Shift</th><th>Hours</th><th>Base</th><th>Extra hrs</th><th>Extra jobs</th><th>Expenses</th><th>Day total</th></tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} title={s.note || undefined}>
                <td className="mono">{fmtDateShort(s.date)}</td>
                <td className="mono">{s.start}–{s.end}</td>
                <td className="mono">
                  {s.c.w.toFixed(1)}h{s.c.extraH > 0 && <span style={{ color: "var(--accent)" }}> (+{s.c.extraH.toFixed(1)})</span>}
                </td>
                <td className="money">{money(s.c.base)}</td>
                <td className="money">{money(s.c.extraPay)}</td>
                <td className="money">{money(s.c.jobsT)}</td>
                <td className="money">{money(s.c.exp)}</td>
                <td className="comm">{money(s.c.total)}</td>
              </tr>
            ))}
            {!rows.length && <EmptyRow cols={8}>{employees.length ? "No shifts logged in this range." : "Add an employee first."}</EmptyRow>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
