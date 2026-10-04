"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import type { Job } from "@/lib/types";
import { money, num, time5, hhmm } from "@/lib/format";
import { chaufTotal, vatDue, commission, isActive } from "@/lib/calc";
import { exportXlsx } from "@/lib/export";
import { useToast } from "@/components/Toast";
import { Pill, Kpi, EmptyRow } from "@/components/ui";
import { JobModal } from "@/components/JobModal";
import { cancelJob, restoreJob, deleteJob } from "./actions";

type F = { co?: string; from?: string; to?: string; q?: string };

export function JobsOverviewClient({ jobs, companies, filters }: { jobs: Job[]; companies: { id: string; name: string }[]; filters: F }) {
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [, start] = useTransition();
  const [search, setSearch] = useState(filters.q || "");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Job | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  function setFilter(k: keyof F, v: string) {
    const p = new URLSearchParams();
    const next = { ...filters, q: search, [k]: v };
    (Object.keys(next) as (keyof F)[]).forEach((key) => next[key] && p.set(key, next[key]!));
    router.replace(`${path}?${p.toString()}`, { scroll: false });
  }

  // Search matches job ref or company name (prototype joFiltered()).
  const list = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => !q || (j.ref + " " + (j.company?.name || "Direct client")).toLowerCase().includes(q));
  }, [jobs, search]);
  const act = list.filter(isActive);
  const allSel = list.length > 0 && list.every((j) => sel.has(j.id));

  function toggle(id: string, on: boolean) {
    const s = new Set(sel);
    if (on) s.add(id);
    else s.delete(id);
    setSel(s);
  }
  function toggleAll(on: boolean) {
    const s = new Set(sel);
    list.forEach((j) => (on ? s.add(j.id) : s.delete(j.id)));
    setSel(s);
  }

  function run(fn: () => Promise<{ error?: string }>, msg: string) {
    start(async () => {
      const r = await fn();
      toast(r.error || msg);
    });
  }

  // Same column set as the prototype's exportSheetExcel().
  async function exportRows(rows: Job[], name: string) {
    try {
      await exportXlsx(
        rows.map((j) => ({
          Ref: j.ref,
          Company: j.company?.name || "Direct client",
          Type: j.service_type,
          From: j.pickup_location,
          To: j.dropoff_location,
          Date: j.pickup_date,
          Time: time5(j.pickup_time),
          Passenger: j.pax_name,
          Contact: j.pax_phone,
          Chauffeur: j.driver?.name || "—",
          Status: j.status,
          "Company £": num(j.company_price),
          "Chauffeur fare": num(j.chauffeur_price),
          "Car park": num(j.car_park),
          Congestion: num(j.congestion),
          "Chauffeur total": chaufTotal(j),
          VAT: vatDue(j),
          Commission: j.status === "Cancelled" ? 0 : commission(j),
          "En route": hhmm(j.stamps["EnRoute"]),
          "At pick-up": hhmm(j.stamps["At Pick Up"]),
          POB: hhmm(j.stamps["POB"]),
          "Dropped off": hhmm(j.stamps["Dropped off"]),
          Completed: hhmm(j.stamps["Completed"]),
        })),
        "Jobs",
        name
      );
      toast("Downloaded: " + name);
    } catch {
      toast("Could not export the sheet");
    }
  }

  return (
    <>
      <div className="kpis five">
        <Kpi
          lab="Total jobs"
          val={list.length}
          sub={`${list.filter((j) => j.status === "Completed").length} completed, ${list.filter((j) => j.status === "Cancelled").length} cancelled`}
        />
        <Kpi lab="Total revenue" val={money(act.reduce((s, j) => s + num(j.company_price), 0))} sub="Company prices, excl. cancelled" />
        <Kpi lab="Paid to chauffeurs" val={money(act.reduce((s, j) => s + chaufTotal(j), 0))} sub="Fares plus charges" />
        <Kpi lab="Total VAT (20%)" val={money(act.reduce((s, j) => s + vatDue(j), 0))} sub="On VAT-charged jobs" />
        <Kpi lab="Total BLC commission" val={money(act.reduce((s, j) => s + commission(j), 0))} sub="Revenue − chauffeur − VAT" />
      </div>
      <div className="card">
        <div className="card-h">
          <h3>All jobs</h3>
          <div className="tools">
            <select className="field-mini" value={filters.co || ""} onChange={(e) => setFilter("co", e.target.value)}>
              <option value="">All companies</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <span className="daterange">
              From<input type="date" className="field-mini" value={filters.from || ""} onChange={(e) => setFilter("from", e.target.value)} />
              To<input type="date" className="field-mini" value={filters.to || ""} onChange={(e) => setFilter("to", e.target.value)} />
            </span>
            <span className="search">
              <input className="field-mini" placeholder="Search ref or company" value={search} onChange={(e) => setSearch(e.target.value)} />
            </span>
            <button className="btn xs ghost" onClick={() => { setSearch(""); router.replace(path, { scroll: false }); }}>Clear</button>
            <button
              className="btn sm"
              onClick={() => {
                const rows = jobs.filter((j) => sel.has(j.id));
                if (!rows.length) return toast("Select some jobs first");
                exportRows(rows, "blc-selected-jobs.xlsx");
              }}
            >
              Export selected
            </button>
            <button className="btn sm primary" onClick={() => exportRows(list, "blc-jobs.xlsx")}>Export all (Excel)</button>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 34 }}><input type="checkbox" checked={allSel} onChange={(e) => toggleAll(e.target.checked)} aria-label="Select all" /></th>
                <th>Ref</th><th>Company</th><th>Route</th><th>Chauffeur</th><th>Status</th><th>Revenue</th><th>Chauffeur</th><th>VAT</th><th>Commission</th><th className="col-act" />
              </tr>
            </thead>
            <tbody>
              {list.map((j) => {
                const cx = j.status === "Cancelled";
                return (
                  <tr key={j.id} className={cx ? "cancelled" : ""}>
                    <td><input type="checkbox" checked={sel.has(j.id)} onChange={(e) => toggle(j.id, e.target.checked)} aria-label={"Select " + j.ref} /></td>
                    <td><button className="ref" onClick={() => setOpen(j)}>{j.ref}</button></td>
                    <td style={{ fontSize: 12.5 }}>{j.company?.name || "Direct client"}</td>
                    <td>
                      <div style={{ fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                           title={`${j.pickup_location} → ${j.dropoff_location}`}>
                        {j.pickup_location} → {j.dropoff_location}
                      </div>
                    </td>
                    <td style={{ fontSize: 12.5 }}>{j.driver?.name || "—"}</td>
                    <td><Pill status={j.status} /></td>
                    <td className="money">{money(j.company_price)}</td>
                    <td className="money">{money(chaufTotal(j))}</td>
                    <td className="money">{money(vatDue(j))}</td>
                    <td className="comm">{cx ? "—" : money(commission(j))}</td>
                    <td className="col-act">
                      {confirmDel === j.id ? (
                        <div className="rowacts" style={{ alignItems: "center" }}>
                          <span style={{ fontSize: 11.5, color: "var(--text-2)", whiteSpace: "nowrap" }}>Delete {j.ref}?</span>
                          <button
                            className="btn xs danger"
                            onClick={() => {
                              run(() => deleteJob(j.id), j.ref + " deleted");
                              setConfirmDel(null);
                            }}
                          >
                            Yes, delete
                          </button>
                          <button className="btn xs" onClick={() => setConfirmDel(null)}>No</button>
                        </div>
                      ) : (
                        <div className="rowacts">
                          <Link className="btn xs" href={`/jobs/new?edit=${j.id}`}>Edit</Link>
                          {cx ? (
                            <button className="btn xs" onClick={() => run(() => restoreJob(j.id), j.ref + " restored")}>Restore</button>
                          ) : (
                            <button className="btn xs danger" onClick={() => run(() => cancelJob(j.id), j.ref + " cancelled")}>Cancel</button>
                          )}
                          <button className="btn xs danger" onClick={() => setConfirmDel(j.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!list.length && <EmptyRow cols={11}>No jobs match these filters.</EmptyRow>}
            </tbody>
          </table>
        </div>
      </div>
      {open && <JobModal job={open} onClose={() => setOpen(null)} />}
    </>
  );
}
