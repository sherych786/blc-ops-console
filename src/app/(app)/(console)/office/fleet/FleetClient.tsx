"use client";

import { useRef, useState, useTransition } from "react";
import type { FleetRow } from "@/lib/types";
import { uploadFleetMedia } from "@/lib/uploadFleetMedia";
import { useToast } from "@/components/Toast";
import { PageHead } from "@/components/ui";
import { FleetProfile } from "@/components/FleetProfile";
import { saveFleet, deleteFleet } from "./actions";

export function FleetClient({ fleet, error }: { fleet: FleetRow[]; error?: string }) {
  const [editing, setEditing] = useState<FleetRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [share, setShare] = useState<FleetRow | null>(null);
  const [names, setNames] = useState({ pic: "No file", imgs: "No files", video: "No file" });
  const [busy, setBusy] = useState(false);
  const [, start] = useTransition();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  function openForm(f: FleetRow | null) {
    setEditing(f);
    setNames({
      pic: f?.profile_pic_url ? "Current image kept" : "No file",
      imgs: f?.gallery_urls?.length ? f.gallery_urls.length + " image(s) kept" : "No files",
      video: f?.video_url ? "Current video kept" : "No file",
    });
    setFormKey((k) => k + 1);
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  }
  const close = () => {
    setFormOpen(false);
    setEditing(null);
  };

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const g = (k: string) => String(f.get(k) || "");
    const picFile = (form.elements.namedItem("pic") as HTMLInputElement).files?.[0];
    const imgFiles = Array.from((form.elements.namedItem("imgs") as HTMLInputElement).files || []);
    const vidFile = (form.elements.namedItem("video") as HTMLInputElement).files?.[0];
    setBusy(true);
    try {
      if (picFile || imgFiles.length || vidFile) toast("Uploading media…");
      const pic = picFile ? await uploadFleetMedia(picFile) : editing?.profile_pic_url || null;
      const imgs = imgFiles.length ? await Promise.all(imgFiles.map(uploadFleetMedia)) : editing?.gallery_urls || [];
      const video = vidFile ? await uploadFleetMedia(vidFile) : editing?.video_url || null;
      const r = await saveFleet({
        id: editing?.id,
        class: g("cls"),
        notes: g("notes"),
        pax: g("pax"),
        luggage: g("lug"),
        description: g("desc"),
        profile_pic_url: pic,
        gallery_urls: imgs,
        video_url: video,
      });
      if (r.error) toast(r.error);
      else {
        toast(editing ? "Vehicle type updated" : "Vehicle type added to fleet");
        close();
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section>
      <PageHead eyebrow="Office" title="Fleet" sub="Vehicle types only. Registration numbers are added on each chauffeur profile.">
        <button className="btn primary" onClick={() => openForm(null)}>＋ Add vehicle type</button>
      </PageHead>
      {error && <p className="err">{error}</p>}
      <div className="card">
        {formOpen && (
          <form key={formKey} ref={formRef} onSubmit={submit}>
            <div className="card-h"><h3>{editing ? "Edit vehicle type" : "New vehicle type"}</h3></div>
            <div className="form-grid">
              <div className="fg"><label>Vehicle type <span className="req">*</span></label><input name="cls" required placeholder="Mercedes S-Class" defaultValue={editing?.class} autoFocus /></div>
              <div className="fg"><label>Short label</label><input name="notes" placeholder="Executive saloon" defaultValue={editing?.notes || ""} /></div>
              <div className="fg"><label>No of Pax</label><input name="pax" placeholder="3" defaultValue={editing?.pax || ""} /></div>
              <div className="fg"><label>Luggage capacity</label><input name="lug" placeholder="2 large, 1 small" defaultValue={editing?.luggage || ""} /></div>
              <div className="fg full"><label>Short description</label><textarea name="desc" placeholder="What makes this vehicle a good choice…" defaultValue={editing?.description || ""} /></div>
              <div className="fg">
                <label>Profile picture</label>
                <div className="filepick">
                  <label className="fp-btn" htmlFor="flPic">Choose image</label>
                  <input id="flPic" name="pic" type="file" accept="image/*" hidden onChange={(e) => setNames((n) => ({ ...n, pic: e.target.files?.[0]?.name || "No file" }))} />
                  <span className="fp-name">{names.pic}</span>
                </div>
              </div>
              <div className="fg">
                <label>Gallery images (rotate every 3s)</label>
                <div className="filepick">
                  <label className="fp-btn" htmlFor="flImgs">Choose images</label>
                  <input id="flImgs" name="imgs" type="file" accept="image/*" multiple hidden onChange={(e) => setNames((n) => ({ ...n, imgs: e.target.files?.length ? e.target.files.length + " file(s)" : "No files" }))} />
                  <span className="fp-name">{names.imgs}</span>
                </div>
              </div>
              <div className="fg full">
                <label>Short video</label>
                <div className="filepick">
                  <label className="fp-btn" htmlFor="flVideo">Choose video</label>
                  <input id="flVideo" name="video" type="file" accept="video/*" hidden onChange={(e) => setNames((n) => ({ ...n, video: e.target.files?.[0]?.name || "No file" }))} />
                  <span className="fp-name">{names.video}</span>
                </div>
              </div>
            </div>
            <div className="form-foot">
              <span className="sheet-note"><b>◆</b> Media is stored securely and shown on the shareable fleet page.</span>
              <span className="spacer" />
              <button type="button" className="btn ghost" onClick={close}>Cancel</button>
              <button type="submit" className="btn primary" disabled={busy}>{busy ? "Saving…" : "Save vehicle type"}</button>
            </div>
          </form>
        )}
        <div className="drv-grid" style={{ padding: 16 }}>
          {fleet.map((f) => {
            const thumb = f.profile_pic_url || f.gallery_urls?.[0];
            return (
              <div className="drv" key={f.id}>
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="fleet-thumb" src={thumb} alt={f.class} />
                ) : (
                  <div className="fleet-empty" style={{ marginBottom: 10 }}>No image yet</div>
                )}
                <div className="top" style={{ marginBottom: 8 }}>
                  <div style={{ flex: 1 }}><b>{f.class}</b><span className="rating">{f.notes || ""}</span></div>
                </div>
                <div className="row"><span>No of Pax</span><span>{f.pax || "—"}</span></div>
                <div className="row"><span>Luggage</span><span>{f.luggage || "—"}</span></div>
                <div className="row" style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 8 }}>
                  <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button className="btn xs" onClick={() => openForm(f)}>Edit</button>
                    <button className="btn xs" onClick={() => setShare(f)}>Share</button>
                    <button
                      className="btn xs danger"
                      onClick={() =>
                        start(async () => {
                          const r = await deleteFleet(f.id);
                          toast(r.error || "Vehicle type deleted");
                        })
                      }
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </div>
            );
          })}
          {!fleet.length && <div className="inv-empty" style={{ gridColumn: "1/-1" }}>No vehicle types yet. Add the first one.</div>}
        </div>
      </div>
      {share && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setShare(null)}>
          <FleetProfile f={share} onClose={() => setShare(null)} />
        </div>
      )}
    </section>
  );
}
