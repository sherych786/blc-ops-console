"use client";

import { useRef, useState, useTransition } from "react";
import type { Driver } from "@/lib/types";
import { initials } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { PageHead } from "@/components/ui";
import { saveDriver, deleteDriver, setOnDuty } from "./actions";

export function ChauffeursClient({ drivers, fleet, error }: { drivers: Driver[]; fleet: { id: string; class: string }[]; error?: string }) {
  const [editing, setEditing] = useState<Driver | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [pending, start] = useTransition();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  function openForm(d: Driver | null) {
    setEditing(d);
    setFormKey((k) => k + 1);
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  }
  const close = () => {
    setFormOpen(false);
    setEditing(null);
  };

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) || "");
    start(async () => {
      const r = await saveDriver({ id: editing?.id, name: g("name"), phone: g("phone"), vehicle_id: g("veh"), registration: g("reg"), license_no: g("lic"), area: g("area") });
      if (r.error) return toast(r.error);
      toast(editing ? "Chauffeur updated" : "Chauffeur added");
      close();
    });
  }

  return (
    <section>
      <PageHead eyebrow="Office" title="Chauffeur profiles" sub="Each profile picks a fleet type and carries its own vehicle registration.">
        <button className="btn primary" onClick={() => openForm(null)}>＋ New profile</button>
      </PageHead>
      {error && <p className="err">{error}</p>}
      {formOpen && (
        <form key={formKey} ref={formRef} className="card" style={{ marginBottom: 18 }} onSubmit={submit}>
          <div className="card-h"><h3>{editing ? "Edit chauffeur profile" : "New chauffeur profile"}</h3></div>
          <div className="form-grid">
            <div className="fg"><label>Full name <span className="req">*</span></label><input name="name" required placeholder="James Whitfield" defaultValue={editing?.name} autoFocus /></div>
            <div className="fg"><label>Mobile <span className="req">*</span></label><input name="phone" required placeholder="+44 7700 900312" defaultValue={editing?.phone || ""} /></div>
            <div className="fg">
              <label>Fleet type <span className="req">*</span></label>
              <select name="veh" required defaultValue={editing?.vehicle_id || fleet[0]?.id || ""}>
                {fleet.map((f) => <option key={f.id} value={f.id}>{f.class}</option>)}
              </select>
            </div>
            <div className="fg"><label>Vehicle registration <span className="req">*</span></label><input name="reg" required placeholder="LK71 XYZ" defaultValue={editing?.registration || ""} /></div>
            <div className="fg"><label>Licence / PCO no.</label><input name="lic" placeholder="PCO-448120" defaultValue={editing?.license_no || ""} /></div>
            <div className="fg"><label>Base area</label><input name="area" placeholder="West London" defaultValue={editing?.area || ""} /></div>
          </div>
          <div className="form-foot">
            <span className="sheet-note"><b>◆</b> Chauffeurs appear in the job form&apos;s search as soon as they are saved.</span>
            <span className="spacer" />
            <button type="button" className="btn ghost" onClick={close}>Cancel</button>
            <button type="submit" className="btn primary" disabled={pending}>Save profile</button>
          </div>
        </form>
      )}
      <div className="drv-grid">
        {drivers.map((d) => (
          <div className="drv" key={d.id}>
            <div className="top">
              <div className="av">{initials(d.name)}</div>
              <div style={{ flex: 1 }}><b>{d.name}</b><span className="rating">★ {d.rating || "—"}{d.area ? ", " + d.area : ""}</span></div>
              <button
                className={`avail click ${d.on_duty ? "on" : "off"}`}
                title="Tap to switch on / off duty"
                onClick={() =>
                  start(async () => {
                    const r = await setOnDuty(d.id, !d.on_duty);
                    toast(r.error || `${d.name.split(" ")[0]} is ${d.on_duty ? "off duty" : "on duty"}`);
                  })
                }
              >
                {d.on_duty ? "On duty" : "Off"}
              </button>
            </div>
            <div className="row"><span>Mobile</span><span>{d.phone}</span></div>
            <div className="row"><span>Fleet type</span><span>{d.fleet?.class || "—"}</span></div>
            <div className="row"><span>Reg</span><span>{d.registration || "—"}</span></div>
            <div className="row"><span>Licence</span><span>{d.license_no || "—"}</span></div>
            <div className="row" style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 8 }}>
              <span style={{ display: "flex", gap: 6 }}>
                <button className="btn xs" onClick={() => openForm(d)}>Edit</button>
                <button
                  className="btn xs danger"
                  onClick={() =>
                    start(async () => {
                      const r = await deleteDriver(d.id);
                      toast(r.error || "Chauffeur deleted");
                    })
                  }
                >
                  Delete
                </button>
              </span>
            </div>
          </div>
        ))}
        {!drivers.length && <div className="card inv-empty" style={{ gridColumn: "1/-1" }}>No chauffeurs yet. Add a fleet type first, then the first profile.</div>}
      </div>
    </section>
  );
}
