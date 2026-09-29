"use client";

import { useState, useSyncExternalStore } from "react";
import { STATUSES, type Job } from "@/lib/types";
import { money, fmtDate, initials, time5 } from "@/lib/format";
import { commission } from "@/lib/calc";
import { Pill, EmptyRow } from "@/components/ui";
import { JobModal } from "@/components/JobModal";

export type Metric = { label: string; val: string; sub: string };
const DEFAULT = ["jobsToday", "live", "completed", "upcoming"];
const KEY = "blcDashCards";

// Per-browser card choice (same localStorage key as the prototype),
// read via useSyncExternalStore so server and client render agree.
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener("blc-dash", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("blc-dash", cb);
  };
};
const readSaved = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function DashboardClient({ metrics, jobs }: { metrics: Record<string, Metric>; jobs: Job[] }) {
  const saved = useSyncExternalStore(subscribe, readSaved, () => null);
  let cards = DEFAULT;
  try {
    const a = JSON.parse(saved || "null");
    if (Array.isArray(a) && a.length === 4 && a.every((k) => k in metrics)) cards = a;
  } catch {}
  const [flt, setFlt] = useState("");
  const [open, setOpen] = useState<Job | null>(null);

  function pick(i: number, key: string) {
    const next = cards.slice();
    next[i] = key;
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    window.dispatchEvent(new Event("blc-dash"));
  }

  const rows = jobs.filter((j) => !flt || j.status === flt);

  return (
    <>
      <div className="kpis">
        {cards.map((key, i) => {
          const m = metrics[key] || metrics.jobsToday;
          return (
            <div className="kpi" key={i}>
              <div className="strip" />
              <select className="metric-sel" title="Choose metric" value={key} onChange={(e) => pick(i, e.target.value)}>
                {Object.entries(metrics).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <div className="lab">{m.label}</div>
              <div className="val">{m.val}</div>
              <div className="sub">{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="card-h">
          <h3>Job board</h3>
          <div className="tools">
            <select className="field-mini" value={flt} onChange={(e) => setFlt(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Ref</th><th>Type</th><th>Route</th><th>Pick-up</th><th>Chauffeur</th><th>Commission</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((j) => {
                const air = j.service_type.startsWith("Airport");
                const d = j.driver;
                return (
                  <tr key={j.id} className={j.status === "Cancelled" ? "cancelled" : ""}>
                    <td><button className="ref" onClick={() => setOpen(j)}>{j.ref}</button></td>
                    <td>
                      <span className={`typechip${air ? " air" : ""}`}>
                        {air ? "Airport" : j.service_type.startsWith("One") ? "One-way" : "Hourly"}
                      </span>
                    </td>
                    <td>
                      <div className="route">
                        {j.pickup_location} <span style={{ color: "var(--text-3)" }}>to</span> {j.dropoff_location}
                        <small>{j.pax_name}{j.pax_count ? ", " + j.pax_count : ""}</small>
                      </div>
                    </td>
                    <td className="mono">
                      {time5(j.pickup_time)}
                      <br />
                      <span style={{ color: "var(--text-3)", fontSize: 11 }}>{fmtDate(j.pickup_date).split(",")[0]}</span>
                    </td>
                    <td>
                      <div className="who">
                        <div className="av">{initials(d?.name || "—")}</div>
                        <div>
                          <b style={{ fontSize: 12.5 }}>{(d?.name || "—").split(" ")[0]}</b>
                          <br />
                          <span style={{ color: "var(--text-3)", fontSize: 11 }}>{(d?.vehicle || "").split(" ").slice(0, 2).join(" ")}</span>
                        </div>
                      </div>
                    </td>
                    <td className="comm">{j.status === "Cancelled" ? "—" : money(commission(j))}</td>
                    <td><Pill status={j.status} /></td>
                  </tr>
                );
              })}
              {!rows.length && <EmptyRow cols={7}>No jobs match this filter.</EmptyRow>}
            </tbody>
          </table>
        </div>
      </div>
      {open && <JobModal job={open} onClose={() => setOpen(null)} />}
    </>
  );
}
