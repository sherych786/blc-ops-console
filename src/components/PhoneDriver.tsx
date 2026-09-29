"use client";

import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { money, num, fmtDateShort, todayISO } from "@/lib/format";
import { shiftCalc } from "@/lib/calc";
import { useToast } from "./Toast";

/** Shape returned by the public_driver() database function. */
export type PublicDriver = {
  id: string;
  name: string;
  basis: string | null;
  shift_hours: number;
  daily_wage: number;
  extra_hour_rate: number;
  recent: { log_date: string; start_time: string | null; end_time: string | null; expenses: number; extra_jobs: number }[];
};

type Row = { label: string; amount: string };
const blank = (): Row[] => [{ label: "", amount: "" }, { label: "", amount: "" }, { label: "", amount: "" }];

/** The prototype's renderDriverPhone(): a BLC driver logs their day. */
export function PhoneDriver({ initial }: { initial: PublicDriver }) {
  const [e, setE] = useState(initial);
  const [date, setDate] = useState(todayISO());
  const [startT, setStartT] = useState("08:00");
  const [endT, setEndT] = useState("18:00");
  const [exp, setExp] = useState<Row[]>(blank);
  const [jobs, setJobs] = useState<Row[]>(blank);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const toast = useToast();

  const rowsUI = (arr: Row[], set: (r: Row[]) => void) => (
    <>
      {arr.map((x, i) => (
        <div className="rowline" key={i}>
          <input
            placeholder="Description e.g. Fuel"
            value={x.label}
            onChange={(ev) => set(arr.map((r, k) => (k === i ? { ...r, label: ev.target.value } : r)))}
          />
          <div className="money-in">
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={x.amount}
              onChange={(ev) => set(arr.map((r, k) => (k === i ? { ...r, amount: ev.target.value } : r)))}
            />
          </div>
        </div>
      ))}
      {arr.length < 10 && (
        <div className="seemore">
          <button type="button" onClick={() => set([...arr, ...Array.from({ length: Math.min(2, 10 - arr.length) }, () => ({ label: "", amount: "" }))])}>
            See more ({Math.min(2, 10 - arr.length)})
          </button>
        </div>
      )}
    </>
  );

  function submit() {
    const clean = (a: Row[]) => a.filter((x) => x.label.trim()).map((x) => ({ label: x.label.trim(), amount: num(x.amount) }));
    const expenses = clean(exp);
    const extraJobs = clean(jobs);
    const total = shiftCalc({ start: startT, end: endT, expenses, extraJobs }, e).total;
    start(async () => {
      const { data, error } = await createClient().rpc("public_submit_shift", {
        p_id: e.id,
        p_date: date,
        p_start: startT,
        p_end: endT,
        p_note: note,
        p_expenses: expenses,
        p_jobs: extraJobs,
      });
      if (error) {
        toast(error.message);
        return;
      }
      setE(data as PublicDriver);
      setExp(blank());
      setJobs(blank());
      setNote("");
      toast("Submitted, " + money(total) + " logged");
    });
  }

  return (
    <>
      <div className="ph-top">
        <div className="ph-status">{e.basis || "Weekly"}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="plogo" src="/blc-logo.png" alt="BLC" />
        <div className="co">{e.name}</div>
        <div className="cref">
          Shift {num(e.shift_hours)}h · {money(e.daily_wage)}/day · {money(e.extra_hour_rate)}/extra hr
        </div>
      </div>
      <div className="ph-body ph-form">
        <div className="fg"><label>Date</label><input type="date" value={date} onChange={(x) => setDate(x.target.value)} /></div>
        <div className="fg" style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><label>Shift start</label><input type="time" value={startT} onChange={(x) => setStartT(x.target.value)} /></div>
          <div style={{ flex: 1 }}><label>Shift end</label><input type="time" value={endT} onChange={(x) => setEndT(x.target.value)} /></div>
        </div>
        <div className="fg"><label>Expenses paid from your pocket</label>{rowsUI(exp, setExp)}</div>
        <div className="fg"><label>Extra jobs completed today (with agreed pay)</label>{rowsUI(jobs, setJobs)}</div>
        <div className="fg"><label>Note (optional)</label><textarea placeholder="Anything the office should know" value={note} onChange={(x) => setNote(x.target.value)} /></div>
        <div className="start-wrap">
          <button className="btn-start" onClick={submit} disabled={pending}>{pending ? "Submitting…" : "Submit today's update"}</button>
        </div>
        <div className="log">
          <h4>Your recent submissions</h4>
          {e.recent.length ? (
            e.recent.map((s) => {
              const c = shiftCalc(
                { start: s.start_time || "", end: s.end_time || "", expenses: [{ label: "", amount: s.expenses }], extraJobs: [{ label: "", amount: s.extra_jobs }] },
                e
              );
              return (
                <div className="log-item" key={s.log_date}>
                  <div className="lg-t">
                    {fmtDateShort(s.log_date)}
                    <br />
                    <span style={{ fontWeight: 400, color: "var(--text-3)", fontSize: 11 }}>{s.start_time}–{s.end_time}</span>
                  </div>
                  <div className="lg-time">{money(c.total)}</div>
                </div>
              );
            })
          ) : (
            <div className="log-empty">No submissions yet.</div>
          )}
        </div>
      </div>
    </>
  );
}
