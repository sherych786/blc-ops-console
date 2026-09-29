"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { STEPS } from "@/lib/types";
import { money, num, fmtDate, firstName, hhmm } from "@/lib/format";
import { useToast, useCopy } from "./Toast";

/** Shape returned by the public_job() database function. */
export type PublicJob = {
  mode: "driver" | "track";
  expired?: boolean;
  ref: string;
  status: string;
  service_type: string;
  direction: string | null;
  flight: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_date: string;
  pickup_time: string | null;
  pax_name: string | null;
  pax_count: string | null;
  pax_phone: string | null;
  vehicle: string | null;
  notes: string | null;
  driver: { name: string; phone: string | null; registration: string | null } | null;
  stamps: Record<string, string>;
  chauffeur_price?: number;
  car_park?: number;
  congestion?: number;
};

/**
 * The prototype's renderPhone(): what the chauffeur (mode "driver") or
 * the client company (mode "track", view-only, no prices) opens from
 * the shared link. Renders the inside of a `.phone`.
 */
export function PhoneJob({ initial, linkKey }: { initial: PublicJob; linkKey: string }) {
  const [j, setJ] = useState(initial);
  const [pending, start] = useTransition();
  const toast = useToast();
  const copy = useCopy();
  const air = j.service_type.startsWith("Airport");
  const hourly = j.service_type.startsWith("Hourly");
  const drive = j.mode === "driver";

  // View-only tracking link: refresh the status every 20s.
  useEffect(() => {
    if (initial.mode !== "track") return;
    const id = setInterval(async () => {
      const { data } = await createClient().rpc("public_job", { p_ref: initial.ref, p_key: linkKey });
      if (data) setJ(data as PublicJob);
    }, 20000);
    return () => clearInterval(id);
  }, [initial.mode, initial.ref, linkKey]);

  if (j.expired) {
    return <div className="public-err">This job link has expired. Contact the office if you need the details again.</div>;
  }

  function stamp(key: string) {
    if (j.stamps[key] || pending) return;
    start(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("public_job_stamp", { p_ref: j.ref, p_key: linkKey, p_status: key });
      if (error) {
        toast(error.message);
        return;
      }
      const next = data as PublicJob;
      setJ(next);
      const t = hhmm(next.stamps[key]);
      if (key === "EnRoute" && Object.keys(j.stamps).length === 0) toast("Trip started, office notified");
      else toast(key === "Completed" ? "Job completed, office notified" : STEPS.find((s) => s.key === key)!.label + " logged at " + t);
    });
  }

  // Completed → thank-you screen with invoicing instructions (driver only).
  if (drive && j.status === "Completed" && j.stamps["Completed"]) {
    return (
      <div className="thanks">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="tk-logo" src="/blc-logo.png" alt="BLC" />
        <div className="serif">Job completed</div>
        <p>Thank you, {firstName(j.driver?.name)}. The office has been notified and your job sheet is closed.</p>
        <div className="invoice-card">
          <h4>To get paid, send your invoice</h4>
          <address>
            <b>Bespoke London Chauffeurs Ltd</b>
            <br />28 Hedgemans Way, Dagenham
            <br />London, RM9 6DD
            <br />United Kingdom
          </address>
          <div className="emails">
            <div className="copyfield">
              <span className="cf-l">Invoices</span>
              <span className="cf-t">accounts@myblc.co.uk</span>
              <button className="btn sm" onClick={() => copy("accounts@myblc.co.uk", "Email")}>Copy</button>
            </div>
            <div className="copyfield">
              <span className="cf-l">Ref</span>
              <span className="cf-t">{j.ref}</span>
              <button className="btn sm" onClick={() => copy(j.ref, "Ref")}>Copy</button>
            </div>
          </div>
          <p style={{ fontSize: 11.5, marginTop: 12, color: "var(--text-3)" }}>
            Quote the job ref on your invoice so accounts can match it. Payment runs weekly.
          </p>
        </div>
      </div>
    );
  }

  const started = Object.keys(j.stamps).length > 0;
  const nextIdx = STEPS.findIndex((s) => !j.stamps[s.key]);
  const logItems = STEPS.filter((s) => j.stamps[s.key]);

  const rows = (
    <>
      <div className="jrow">
        <div className="jic">{air ? "✈" : hourly ? "◷" : "→"}</div>
        <div><div className="jl">{air ? j.direction : hourly ? "Hourly, as directed" : "One-way transfer"}</div><div className="jv">{j.service_type}</div></div>
      </div>
      <div className="jrow">
        <div className="jic">📍</div>
        <div><div className="jl">Pick-up</div><div className="jv">{j.pickup_location}<small>{fmtDate(j.pickup_date)}, {j.pickup_time}</small></div></div>
      </div>
      <div className="jrow">
        <div className="jic">🏁</div>
        <div><div className="jl">Drop-off</div><div className="jv">{j.dropoff_location}</div></div>
      </div>
      {air && j.flight && (
        <div className="jrow">
          <div className="jic">🛬</div>
          <div><div className="jl">Flight</div><div className="jv mono">{j.flight}</div></div>
        </div>
      )}
      <div className="jrow">
        <div className="jic">👤</div>
        <div><div className="jl">Passenger</div><div className="jv">{j.pax_name}<small>{j.pax_count || ""}{j.pax_phone ? " · " + j.pax_phone : ""}</small></div></div>
      </div>
      <div className="jrow">
        <div className="jic">🚘</div>
        <div>
          <div className="jl">{drive ? "Vehicle" : "Your chauffeur"}</div>
          <div className="jv">
            {drive ? j.vehicle : j.driver?.name || "To be confirmed"}
            {!drive && <small>{j.vehicle}{j.driver?.registration ? ", Reg " + j.driver.registration : ""}</small>}
          </div>
        </div>
      </div>
      {j.notes && drive && (
        <div className="jrow">
          <div className="jic">✎</div>
          <div><div className="jl">Notes</div><div className="jv" style={{ fontWeight: 400, fontSize: 13 }}>{j.notes}</div></div>
        </div>
      )}
      {drive && (
        <div className="fare-mini">
          <div className="fr"><span>Fare</span><span>{money(j.chauffeur_price)}</span></div>
          {num(j.car_park) > 0 && <div className="fr"><span>Car park</span><span>{money(j.car_park)}</span></div>}
          {num(j.congestion) > 0 && <div className="fr"><span>Congestion</span><span>{money(j.congestion)}</span></div>}
          <div className="fr tot"><span>Total</span><span>{money(num(j.chauffeur_price) + num(j.car_park) + num(j.congestion))}</span></div>
        </div>
      )}
    </>
  );

  const log = (
    <div className="log">
      <h4>Status log</h4>
      {logItems.length ? (
        logItems.map((s) => (
          <div className="log-item" key={s.key}>
            <div className="lg-dot"><i /></div>
            <div className="lg-t">{s.label}</div>
            <div className="lg-time">{hhmm(j.stamps[s.key])}</div>
          </div>
        ))
      ) : (
        <div className="log-empty">No updates yet.</div>
      )}
    </div>
  );

  let body: React.ReactNode;
  if (j.status === "Cancelled") {
    body = <>{rows}<div className="log-empty" style={{ padding: "20px 0" }}>This job has been cancelled by the office.</div></>;
  } else if (!drive) {
    body = <>{rows}<div style={{ marginTop: 14 }}><div className="strip-hint">Live status, updated by your chauffeur</div></div>{log}</>;
  } else if (!started) {
    body = (
      <>
        {rows}
        <div className="start-wrap">
          <button className="btn-start" onClick={() => stamp("EnRoute")} disabled={pending}>▶ Start trip</button>
        </div>
      </>
    );
  } else {
    body = (
      <>
        {rows}
        <div style={{ marginTop: 14 }}>
          <div className="strip-hint">Tap each stage as it happens, the office sees it live</div>
          <div className="status-strip">
            {STEPS.map((s, i) => {
              const done = !!j.stamps[s.key];
              return (
                <button
                  key={s.key}
                  className={`st${done ? " done" : ""}${i === nextIdx ? " next" : ""}`}
                  disabled={done || pending}
                  onClick={() => stamp(s.key)}
                >
                  <span className="st-ic">{done ? "✓" : s.ic}</span>
                  <b>{s.label}</b>
                  <small>{hhmm(j.stamps[s.key])}</small>
                </button>
              );
            })}
          </div>
        </div>
        {log}
      </>
    );
  }

  return (
    <>
      <div className="ph-top">
        <div className="ph-status">{j.status}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="plogo" src="/blc-logo.png" alt="BLC" />
        <div className="co">Bespoke London Chauffeurs</div>
        <div className="cref">{j.ref}</div>
      </div>
      <div className="ph-body">{body}</div>
    </>
  );
}
