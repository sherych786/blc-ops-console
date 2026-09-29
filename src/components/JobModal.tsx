"use client";

import { useEffect, useRef, useState } from "react";
import { STEPS, type Job } from "@/lib/types";
import { money, num, fmtDateShort, time5, hhmm } from "@/lib/format";
import { chaufTotal, vatDue, commission } from "@/lib/calc";
import { exportPdf, exportPng } from "@/lib/export";
import { useToast } from "./Toast";
import { Pill } from "./ui";

/** The prototype's openJob() summary popup. */
export function JobModal({ job: j, onClose }: { job: Job; onClose: () => void }) {
  const [hideCP, setHideCP] = useState(false);
  const [exporting, setExporting] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const air = j.service_type.startsWith("Airport");

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [onClose]);

  async function doExport(kind: "png" | "pdf") {
    if (!card.current) return;
    setExporting(true);
    toast("Building " + kind.toUpperCase() + "…");
    // let React paint the .exporting (brand strip) state first
    await new Promise((r) => setTimeout(r, 60));
    try {
      const bg = getComputedStyle(document.body).backgroundColor;
      if (kind === "png") await exportPng(card.current, j.ref + "-summary.png", bg);
      else await exportPdf(card.current, j.ref + "-summary.pdf", bg);
      toast("Downloaded: " + j.ref + "-summary." + kind);
    } catch {
      toast("Could not build the summary");
    } finally {
      setExporting(false);
    }
  }

  const timeline = STEPS.filter((s) => j.stamps[s.key]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={card} className={`modal${hideCP ? " hide-cp" : ""}${exporting ? " exporting" : ""}`}>
        <div className="mo-h">
          <span className="ref" style={{ fontSize: 15 }}>{j.ref}</span>
          <Pill status={j.status} />
          <button className="x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="mo-actions" data-html2canvas-ignore>
          <label className="chk">
            <input type="checkbox" checked={hideCP} onChange={(e) => setHideCP(e.target.checked)} /> Hide chauffeur pricing
          </label>
          <span className="spacer" />
          <button className="btn sm" onClick={() => doExport("png")}>Export PNG</button>
          <button className="btn sm primary" onClick={() => doExport("pdf")}>Export PDF</button>
        </div>
        <div className="mo-b">
          <div className="mo-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/blc-logo.png" alt="BLC" />
            <div>Bespoke London Chauffeurs · Job completion summary</div>
          </div>
          <div className="li"><span className="lk">Service</span><span className="lv">{j.service_type}</span></div>
          <div className="li">
            <span className="lk">{air ? "Direction" : "Booked"}</span>
            <span className="lv">{air ? j.direction : fmtDateShort(j.pickup_date)}</span>
          </div>
          <div className="li full"><span className="lk">Route</span><span className="lv">{j.pickup_location} → {j.dropoff_location}</span></div>
          {air && j.flight && (
            <div className="li"><span className="lk">Flight</span><span className="lv mono">{j.flight}</span></div>
          )}
          <div className="li"><span className="lk">Date and time</span><span className="lv">{fmtDateShort(j.pickup_date)}, {time5(j.pickup_time)}</span></div>
          <div className="li">
            <span className="lk">Passenger</span>
            <span className="lv">
              {j.pax_name}
              <small style={{ display: "block", fontWeight: 400, color: "var(--text-2)" }}>{j.pax_count || ""}</small>
            </span>
          </div>
          <div className="li">
            <span className="lk">Passenger contact</span>
            <span className="lv" style={{ fontSize: 13 }}>
              {j.pax_phone || "—"}
              {j.pax_email && (
                <>
                  <br />
                  <span style={{ fontWeight: 400, color: "var(--text-2)" }}>{j.pax_email}</span>
                </>
              )}
            </span>
          </div>
          <div className="li"><span className="lk">Company</span><span className="lv">{j.company?.name || "Direct client"}</span></div>
          <div className="li"><span className="lk">Vehicle</span><span className="lv">{j.vehicle}</span></div>
          <div className="li full">
            <span className="lk">Chauffeur</span>
            <span className="lv">
              {j.driver?.name || "—"} · {j.driver?.phone || ""}
              <small style={{ display: "block", fontWeight: 400, color: "var(--text-2)" }}>
                {j.driver?.vehicle || ""}, Reg {j.driver?.registration || ""}
              </small>
            </span>
          </div>
          <div className="mo-price">
            <div className="pr"><span>Company price (original)</span><span>{money(j.company_price)}</span></div>
            <div className="pr chauf-only"><span>Chauffeur fare</span><span>{money(j.chauffeur_price)}</span></div>
            {num(j.car_park) > 0 && <div className="pr chauf-only"><span>Car park</span><span>{money(j.car_park)}</span></div>}
            {num(j.congestion) > 0 && <div className="pr chauf-only"><span>Congestion charge</span><span>{money(j.congestion)}</span></div>}
            <div className="pr tot chauf-only"><span>Chauffeur total</span><span>{money(chaufTotal(j))}</span></div>
            {j.vat && <div className="pr chauf-only"><span>VAT (20%)</span><span>{money(vatDue(j))}</span></div>}
            <div className="pr comm chauf-only"><span>BLC commission</span><span>{money(commission(j))}</span></div>
          </div>
          <div className="mo-time">
            <h4>Status timeline</h4>
            {timeline.length ? (
              timeline.map((s) => (
                <div className="ti" key={s.key}>
                  <i />
                  <span>{s.label}</span>
                  <span className="tt">{hhmm(j.stamps[s.key])}</span>
                </div>
              ))
            ) : (
              <div className="log-empty">No status updates yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
