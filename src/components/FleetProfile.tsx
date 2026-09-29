"use client";

import { useEffect, useState } from "react";
import { fleetURL, href } from "@/lib/messages";
import { useCopy } from "./Toast";

export type FleetPublic = {
  id: string;
  class: string;
  notes?: string | null;
  pax: string | null;
  luggage: string | null;
  description: string | null;
  profile_pic_url: string | null;
  gallery_urls: string[] | null;
  video_url: string | null;
};

/** Cross-fade + slow Ken-Burns zoom, advancing every 3s (prototype openFleet()). */
export function FleetCarousel({ imgs }: { imgs: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (imgs.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % imgs.length), 3000);
    return () => clearInterval(t);
  }, [imgs.length]);
  if (!imgs.length) return <div className="fleet-empty">No images uploaded yet</div>;
  return (
    <div className="fleet-carousel">
      {imgs.map((s, k) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={s + k} src={s} alt="" className={k === i ? "on" : ""} />
      ))}
    </div>
  );
}

const lk: React.CSSProperties = { fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--text-3)", fontWeight: 700 };

/** The fleet profile card — office "Share" modal and the public /fleet page. */
export function FleetProfile({ f, onClose }: { f: FleetPublic; onClose?: () => void }) {
  const copy = useCopy();
  const imgs = f.gallery_urls && f.gallery_urls.length ? f.gallery_urls : f.profile_pic_url ? [f.profile_pic_url] : [];
  return (
    <div className="modal" style={{ maxWidth: 520 }}>
      <div className="mo-h">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/blc-logo.png" style={{ height: 26 }} alt="BLC" />
        <span style={{ fontWeight: 700 }}>{f.class}</span>
        {onClose && <button className="x" onClick={onClose} aria-label="Close">✕</button>}
      </div>
      <div style={{ padding: 18 }}>
        <FleetCarousel imgs={imgs} />
        {f.video_url && <video className="fleet-video" src={f.video_url} controls muted />}
        <div style={{ display: "flex", gap: 20, marginTop: 14 }}>
          <div><div style={lk}>No of Pax</div><div style={{ fontWeight: 700, fontSize: 15 }}>{f.pax || "—"}</div></div>
          <div><div style={lk}>Luggage</div><div style={{ fontWeight: 700, fontSize: 15 }}>{f.luggage || "—"}</div></div>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", margin: "12px 0 0" }}>{f.description || ""}</p>
        <div className="copyfield" style={{ marginTop: 16 }}>
          <span className="cf-l">Link</span>
          <span className="cf-t">{fleetURL(f.id)}</span>
          <button className="btn sm" onClick={() => copy(href(fleetURL(f.id)), "Link")}>Copy</button>
        </div>
      </div>
    </div>
  );
}
