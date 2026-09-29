"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DIRECTIONS, type Job } from "@/lib/types";
import { money, num, time5 } from "@/lib/format";
import { computeHourly } from "@/lib/calc";
import { msgChauffeur, msgCompany, jobURL, href } from "@/lib/messages";
import { useToast, useCopy } from "@/components/Toast";
import { MoneyIn } from "@/components/ui";
import { JobModal } from "@/components/JobModal";
import { saveJob } from "../actions";

type Drv = { id: string; name: string; phone: string | null; registration: string | null; vehicle: string };
type Co = { id: string; name: string };

const TYPES = [
  { v: "Airport Transfer", ic: "✈", b: "Airport transfer", s: "Arrival or departure" },
  { v: "One-Way Transfer", ic: "→", b: "One-way transfer", s: "Point to point" },
  { v: "Hourly / As Directed", ic: "◷", b: "Hourly", s: "As directed" },
];

export function JobForm({
  today,
  companies,
  fleet,
  drivers,
  editing,
  done,
  doneCompanyEmail,
}: {
  today: string;
  companies: Co[];
  fleet: string[];
  drivers: Drv[];
  editing: Job | null;
  done: Job | null;
  doneCompanyEmail: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const e = editing;

  // Live-calculated fields are controlled; the rest are read on submit.
  const [type, setType] = useState(e?.service_type || "Airport Transfer");
  const [time, setTime] = useState(time5(e?.pickup_time) || "14:30");
  const [perHour, setPerHour] = useState(e?.per_hour ? String(e.per_hour) : "");
  const [minHours, setMinHours] = useState(e?.min_hours ? String(e.min_hours) : "");
  const [endTime, setEndTime] = useState(time5(e?.end_time));
  const [cp, setCp] = useState(e ? String(e.company_price) : "");
  const [chf, setChf] = useState(e ? String(e.chauffeur_price) : "");
  const [park, setPark] = useState(e?.car_park ? String(e.car_park) : "");
  const [cong, setCong] = useState(e?.congestion ? String(e.congestion) : "");
  const [vat, setVat] = useState(e?.vat || false);
  const [driverId, setDriverId] = useState(e?.driver_id || "");
  const [driverQ, setDriverQ] = useState(e?.driver?.name || "");
  const [listOpen, setListOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const air = type.startsWith("Airport");
  const hr = type.startsWith("Hourly");
  const hourly = hr ? computeHourly(num(perHour), num(minHours), time, endTime) : null;

  // computeHourly() auto-writes the company price, then syncPrice() reruns.
  function recalc(next: { perHour?: string; minHours?: string; time?: string; endTime?: string }) {
    if (!hr) return;
    const r = computeHourly(num(next.perHour ?? perHour), num(next.minHours ?? minHours), next.time ?? time, next.endTime ?? endTime);
    if (r.price != null) setCp(r.price.toFixed(2));
  }

  const ct = num(chf) + num(park) + num(cong);
  const vatAmt = vat ? num(cp) * 0.2 : 0;

  const matches = useMemo(() => {
    const q = driverQ.trim().toLowerCase();
    return drivers.filter((d) => d.name.toLowerCase().includes(q) || d.vehicle.toLowerCase().includes(q));
  }, [driverQ, drivers]);

  function resetAll() {
    setType("Airport Transfer");
    setTime("14:30");
    setPerHour("");
    setMinHours("");
    setEndTime("");
    setCp("");
    setChf("");
    setPark("");
    setCong("");
    setVat(false);
    setDriverId("");
    setDriverQ("");
    setFormKey((k) => k + 1);
  }

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!driverId) {
      toast("Search and select a chauffeur");
      return;
    }
    const f = new FormData(ev.currentTarget);
    const g = (k: string) => String(f.get(k) || "");
    start(async () => {
      const r = await saveJob({
        id: e?.id || null,
        service_type: type,
        direction: g("direction"),
        flight: g("flight"),
        pickup_location: g("from"),
        dropoff_location: g("to"),
        pickup_date: g("date"),
        pickup_time: time,
        pax_name: g("pax"),
        pax_phone: g("paxPhone"),
        pax_email: g("paxEmail"),
        pax_count: g("count"),
        vehicle: g("vehicle"),
        company_id: g("company"),
        driver_id: driverId,
        per_hour: perHour,
        min_hours: minHours,
        end_time: endTime,
        company_price: cp,
        chauffeur_price: chf,
        car_park: park,
        congestion: cong,
        vat,
        notes: g("notes"),
      });
      if (r.error) {
        toast(r.error);
        return;
      }
      toast(`Job ${r.ref} saved, links are live`);
      resetAll();
      router.push(`/jobs/new?done=${r.id}`, { scroll: false });
      setTimeout(() => document.getElementById("jobDone")?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    });
  }

  const copy = useCopy();
  const chauffeurMsg = done ? msgChauffeur(done) : "";
  const companyMsg = done ? msgCompany(done) : "";
  const driverPhone = (done?.driver?.phone || "").replace(/[^\d]/g, "");

  return (
    <section>
      <div className="page-head">
        <div>
          <div className="eyebrow">{e ? "Editing " + e.ref : "Job creation"}</div>
          <h1 className="serif">{e ? "Edit job" : "Create a job"}</h1>
          <p>Fill the sheet, assign a chauffeur, then generate the two hand-off messages and a live link.</p>
        </div>
      </div>

      <form key={formKey} ref={formRef} className="card" style={{ marginBottom: 18 }} onSubmit={submit} onReset={resetAll}>
        {e && (
          <div className="edit-banner">
            <span>✎ Editing <b>{e.ref}</b></span>
            <Link href="/jobs" className="btn xs ghost" style={{ marginLeft: "auto" }}>Cancel edit</Link>
          </div>
        )}
        <div className="form-grid">
          <div className="subhead">Service</div>
          <div className="fg full">
            <label>Service type <span className="req">*</span></label>
            <div className="radio-row">
              {TYPES.map((t) => (
                <label key={t.v} className={`radio-card${type === t.v ? " sel" : ""}`}>
                  <input
                    type="radio"
                    name="jtype"
                    value={t.v}
                    checked={type === t.v}
                    onChange={() => {
                      setType(t.v);
                      if (t.v.startsWith("Hourly")) {
                        const r = computeHourly(num(perHour), num(minHours), time, endTime);
                        if (r.price != null) setCp(r.price.toFixed(2));
                      }
                    }}
                  />
                  <span className="rc-ic">{t.ic}</span>
                  <span><b>{t.b}</b><small>{t.s}</small></span>
                </label>
              ))}
            </div>
          </div>
          <div className="fg" hidden={!air}>
            <label>Direction <span className="req">*</span></label>
            <select name="direction" defaultValue={e?.direction || DIRECTIONS[0]}>
              {DIRECTIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="fg" hidden={!air}>
            <label>Flight number</label>
            <input name="flight" placeholder="e.g. BA286" defaultValue={e?.flight || ""} />
            <span className="hint">We track landing time from this.</span>
          </div>
          <div className="fg"><label>Pick-up <span className="req">*</span></label><input name="from" placeholder="Heathrow Terminal 5" required defaultValue={e?.pickup_location || ""} /></div>
          <div className="fg"><label>Drop-off <span className="req">*</span></label><input name="to" placeholder="The Connaught, Mayfair" required defaultValue={e?.dropoff_location || ""} /></div>
          <div className="fg"><label>Date <span className="req">*</span></label><input name="date" type="date" required defaultValue={e?.pickup_date || today} /></div>
          <div className="fg">
            <label>Pick-up time <span className="req">*</span></label>
            <input type="time" required value={time} onChange={(x) => { setTime(x.target.value); recalc({ time: x.target.value }); }} />
          </div>

          <div className="subhead">Passenger contact details</div>
          <div className="fg"><label>Passenger name <span className="req">*</span></label><input name="pax" placeholder="Mr A. Rossi" required defaultValue={e?.pax_name || ""} /></div>
          <div className="fg"><label>Passenger mobile</label><input name="paxPhone" placeholder="+44 7920 114488" defaultValue={e?.pax_phone || ""} /></div>
          <div className="fg"><label>Passenger email</label><input name="paxEmail" type="email" placeholder="a.rossi@company.com" defaultValue={e?.pax_email || ""} /></div>
          <div className="fg"><label>Passengers and luggage</label><input name="count" placeholder="1 pax, 2 bags" defaultValue={e?.pax_count || ""} /></div>

          <div className="subhead">Assignment</div>
          <div className="fg">
            <label>Vehicle class</label>
            <select name="vehicle" defaultValue={e?.vehicle || fleet[0] || ""}>
              {fleet.map((f) => <option key={f} value={f}>{f}</option>)}
              {e?.vehicle && !fleet.includes(e.vehicle) && <option value={e.vehicle}>{e.vehicle}</option>}
            </select>
          </div>
          <div className="fg">
            <label>Company / contract</label>
            <select name="company" defaultValue={e ? e.company_id || "" : companies[0]?.id || ""}>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="">Direct client (no company)</option>
            </select>
            <span className="hint">Never shown in the chauffeur message.</span>
          </div>
          <div className="fg full">
            <label>Assign chauffeur <span className="req">*</span></label>
            <div className="combo">
              <input
                placeholder="Search chauffeur by name…"
                autoComplete="off"
                value={driverQ}
                onChange={(x) => { setDriverQ(x.target.value); setDriverId(""); setListOpen(true); }}
                onFocus={() => setListOpen(true)}
                onBlur={() => setTimeout(() => setListOpen(false), 150)}
              />
              {listOpen && (
                <div className="combo-list">
                  {matches.length ? (
                    matches.map((d) => (
                      <div
                        key={d.id}
                        className={`ci${d.id === driverId ? " hi" : ""}`}
                        onMouseDown={(x) => { x.preventDefault(); setDriverId(d.id); setDriverQ(d.name); setListOpen(false); }}
                      >
                        {d.name} <small>· {d.vehicle} ({d.registration || ""})</small>
                      </div>
                    ))
                  ) : (
                    <div className="ci-empty">No chauffeur matches</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="subhead">Pricing</div>
          <div className="fg" hidden={!hr}>
            <label>Per hour rate <span className="req">*</span></label>
            <MoneyIn placeholder="55.00" value={perHour} onChange={(x) => { setPerHour(x.target.value); recalc({ perHour: x.target.value }); }} />
          </div>
          <div className="fg" hidden={!hr}>
            <label>Minimum hours charge</label>
            <input type="number" step="0.5" min="0" placeholder="3" value={minHours} onChange={(x) => { setMinHours(x.target.value); recalc({ minHours: x.target.value }); }} />
          </div>
          <div className="fg" hidden={!hr}>
            <label>Estimated end time</label>
            <input type="time" value={endTime} onChange={(x) => { setEndTime(x.target.value); recalc({ endTime: x.target.value }); }} />
          </div>
          <div className="fg full" hidden={!hr}>
            <span className="sheet-note"><b>◷</b> <span>{hourly?.text}</span></span>
          </div>
          <div className="fg">
            <label>Company price (original) <span className="req">*</span></label>
            <MoneyIn placeholder="175.00" required value={cp} onChange={(x) => setCp(x.target.value)} />
            <span className="hint">Charged to the company. Goes on the invoice. Auto-filled for hourly jobs.</span>
          </div>
          <div className="fg">
            <label>Chauffeur fare <span className="req">*</span></label>
            <MoneyIn placeholder="120.00" required value={chf} onChange={(x) => setChf(x.target.value)} />
            <span className="hint">Base fare paid to the chauffeur.</span>
          </div>
          <div className="fg"><label>Car park (optional)</label><MoneyIn placeholder="0.00" value={park} onChange={(x) => setPark(x.target.value)} /></div>
          <div className="fg"><label>Congestion charge (optional)</label><MoneyIn placeholder="0.00" value={cong} onChange={(x) => setCong(x.target.value)} /></div>
          <div className="fg full">
            <label className="chk"><input type="checkbox" checked={vat} onChange={(x) => setVat(x.target.checked)} /> This job is charged with 20% VAT</label>
          </div>
          <div className="pricebox">
            <div>Chauffeur total<b>{money(ct)}</b></div>
            <div>VAT (20%)<b>{money(vatAmt)}</b></div>
            <div className="accent">BLC commission<b>{money(num(cp) - ct - vatAmt)}</b></div>
            <div>Company message total<b>{vat ? money(num(cp) * 1.2) + " inc VAT" : money(num(cp))}</b></div>
          </div>
          <div className="fg full"><label>Notes for chauffeur</label><textarea name="notes" placeholder="Meet and greet at arrivals with name board." defaultValue={e?.notes || ""} /></div>
        </div>
        <div className="form-foot">
          <span className="sheet-note"><b>◆</b> On save, the job is stored and both links go live.</span>
          <span className="spacer" />
          <button type="reset" className="btn ghost">Clear</button>
          <button type="submit" className="btn primary" disabled={pending}>
            {pending ? "Saving…" : e ? "Save changes" : "Create job and generate messages"}
          </button>
        </div>
      </form>

      {done && (
        <div id="jobDone">
          <div className="banner">
            <div className="bi">✓</div>
            <div>
              <b>Job <button className="ref" style={{ fontSize: 14 }} onClick={() => setModal(true)}>{done.ref}</button> saved.</b> Links are live, messages ready to send.
            </div>
          </div>
          <div className="linkrow">
            <div className="lk-ic">🔗</div>
            <div>
              <small>Chauffeur link (action), expires 7 days after completion</small>
              <div className="url">{jobURL(done)}</div>
            </div>
            <button className="btn sm" onClick={() => copy(href(jobURL(done)), "Link")}>Copy</button>
            <Link className="btn sm primary" href={`/preview/chauffeur?ref=${encodeURIComponent(done.ref)}`}>Preview</Link>
          </div>
          <div className="done-panel">
            <div className="msg-box">
              <div className="mh"><span className="tag chauf">Chauffeur</span><b>Job details, no company name</b></div>
              <pre>{chauffeurMsg}</pre>
              <div className="mf">
                <button className="btn sm" onClick={() => copy(chauffeurMsg, "Message")}>Copy message</button>
                <a className="btn sm ghost" target="_blank" rel="noopener" href={`https://wa.me/${driverPhone}?text=${encodeURIComponent(chauffeurMsg)}`}>Send via WhatsApp</a>
              </div>
            </div>
            <div className="msg-box">
              <div className="mh"><span className="tag comp">Company</span><b>Re-share, view-only tracking link</b></div>
              <pre>{companyMsg}</pre>
              <div className="mf">
                <button className="btn sm" onClick={() => copy(companyMsg, "Message")}>Copy message</button>
                <a className="btn sm ghost" href={`mailto:${doneCompanyEmail}?subject=${encodeURIComponent("Booking confirmed " + done.ref)}&body=${encodeURIComponent(companyMsg)}`}>Send via email</a>
              </div>
            </div>
          </div>
          {modal && <JobModal job={done} onClose={() => setModal(false)} />}
        </div>
      )}
    </section>
  );
}
