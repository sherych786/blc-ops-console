"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { money, num, fmtDateShort } from "@/lib/format";
import { exportPdf, exportXlsx } from "@/lib/export";
import { useToast } from "@/components/Toast";
import { Pill, EmptyRow } from "@/components/ui";
import { SlipDoc, slipTotals, slipXlsxRows, type Slip } from "@/components/SlipDoc";
import { setSlipStatus, setSlipAdjustments } from "../actions";

export function SlipsClient({ slips, employees, openNo }: { slips: Slip[]; employees: { id: string; name: string }[]; openNo: string }) {
  const [q, setQ] = useState("");
  const [emp, setEmp] = useState("");
  const [cur, setCur] = useState(openNo);
  const [adj, setAdj] = useState({ label: "", amount: "" });
  const [stage, setStage] = useState<Slip | null>(null);
  const [, start] = useTransition();
  const toast = useToast();
  const docRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const list = slips.filter((m) => (!emp || m.employee_id === emp) && (!q || (m.slip_no + " " + m.employee.name).toLowerCase().includes(q.trim().toLowerCase())));
  const open = slips.find((m) => m.slip_no === cur) || null;

  useEffect(() => {
    if (openNo) setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth" }), 120);
  }, [openNo]);

  async function xls(m: Slip) {
    try {
      await exportXlsx(slipXlsxRows(m), "Salary", m.slip_no + ".xlsx");
      toast("Downloaded: " + m.slip_no + ".xlsx");
    } catch {
      toast("Could not export the slip");
    }
  }
  async function pdf(m: Slip, node?: HTMLElement | null) {
    toast("Building PDF…");
    try {
      if (!node) {
        setStage(m);
        await new Promise((r) => setTimeout(r, 80));
        node = stageRef.current;
      }
      if (node) await exportPdf(node, m.slip_no + ".pdf");
      toast("Downloaded: " + m.slip_no + ".pdf");
    } catch {
      toast("Could not build the PDF");
    }
    setStage(null);
  }

  function saveAdj(m: Slip, next: Slip["adjustments"], msg: string) {
    start(async () => {
      const r = await setSlipAdjustments(m.id, next);
      toast(r.error || msg);
    });
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card-h">
          <h3>Past salary slips</h3>
          <div className="tools">
            <select className="field-mini" value={emp} onChange={(e) => setEmp(e.target.value)}>
              <option value="">All drivers</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <span className="search"><input className="field-mini" placeholder="Search slip or driver" value={q} onChange={(e) => setQ(e.target.value)} /></span>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Slip no.</th><th>Driver</th><th>Period</th><th>Shifts</th><th>Net pay</th><th>Status</th><th /></tr></thead>
            <tbody>
              {list.map((m) => {
                const paid = m.status === "Paid";
                const openIt = () => {
                  setCur(m.slip_no);
                  setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
                };
                return (
                  <tr key={m.id}>
                    <td><button className="ref" onClick={openIt}>{m.slip_no}</button></td>
                    <td>{m.employee.name}</td>
                    <td className="mono">{fmtDateShort(m.period_from)} – {fmtDateShort(m.period_to)}</td>
                    <td className="mono">{m.rows.length}</td>
                    <td className="money">{money(slipTotals(m).net)}</td>
                    <td><Pill status={m.status} /></td>
                    <td>
                      <div className="rowacts">
                        <button
                          className="btn xs"
                          onClick={() =>
                            start(async () => {
                              const next = paid ? "Unpaid" : "Paid";
                              const r = await setSlipStatus(m.id, next);
                              toast(r.error || "Marked " + next);
                            })
                          }
                        >
                          {paid ? "Mark unpaid" : "Mark paid"}
                        </button>
                        <button className="btn xs" onClick={() => pdf(m)}>PDF</button>
                        <button className="btn xs" onClick={() => xls(m)}>Excel</button>
                        <button className="btn xs" onClick={openIt}>Open</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!list.length && <EmptyRow cols={7}>No salary slips yet. Generate one from Jobs review.</EmptyRow>}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div ref={outRef}>
          <div className="card-h" style={{ border: 0, padding: "0 0 12px" }}>
            <h3>Salary slip preview</h3>
            <div className="tools">
              <button className="btn sm" onClick={() => xls(open)}>Export Excel</button>
              <button className="btn sm primary" onClick={() => pdf(open, docRef.current)}>Export PDF</button>
            </div>
          </div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-h"><h3 style={{ fontSize: 13 }}>Manual adjustment</h3></div>
            <div className="lineitem-add">
              <input placeholder="Description e.g. Bonus / Deduction" value={adj.label} onChange={(e) => setAdj({ ...adj, label: e.target.value })} />
              <div className="money-in">
                <input type="number" step="0.01" placeholder="Use minus to deduct" value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} />
              </div>
              <button
                className="btn sm"
                type="button"
                onClick={() => {
                  if (!adj.label.trim()) return toast("Enter a description");
                  saveAdj(open, [...(open.adjustments || []), { label: adj.label.trim(), amount: num(adj.amount) }], "Adjustment added");
                  setAdj({ label: "", amount: "" });
                }}
              >
                ＋ Add adjustment
              </button>
            </div>
            <div>
              {(open.adjustments || []).map((a, i) => (
                <div className="entry-item" key={i} style={{ margin: "0 14px 8px" }}>
                  <span>{a.label}</span>
                  <span className="ei-amt">{money(a.amount)}</span>
                  <button className="ei-x" aria-label="Remove" onClick={() => saveAdj(open, open.adjustments.filter((_, k) => k !== i), "Adjustment removed")}>✕</button>
                </div>
              ))}
            </div>
          </div>
          <div className="inv-wrap">
            <div className="inv" ref={docRef}><SlipDoc m={open} /></div>
          </div>
          <p className="hint" style={{ marginTop: 8 }}>Export PDF or Excel to save the slip.</p>
        </div>
      )}
      {stage && (
        <div id="exportStage">
          <div className="inv" style={{ width: 800 }} ref={stageRef}><SlipDoc m={stage} /></div>
        </div>
      )}
    </div>
  );
}
