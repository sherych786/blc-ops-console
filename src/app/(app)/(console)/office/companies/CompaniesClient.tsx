"use client";

import { useRef, useState, useTransition } from "react";
import type { Company } from "@/lib/types";
import { initials } from "@/lib/format";
import { useToast } from "@/components/Toast";
import { PageHead } from "@/components/ui";
import { saveCompany, deleteCompany } from "./actions";

export function CompaniesClient({ companies, error }: { companies: Company[]; error?: string }) {
  const [editing, setEditing] = useState<Company | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [pending, start] = useTransition();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  function openForm(c: Company | null) {
    setEditing(c);
    setFormKey((k) => k + 1);
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  }
  function close() {
    setFormOpen(false);
    setEditing(null);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const g = (k: string) => String(f.get(k) || "");
    start(async () => {
      const r = await saveCompany({ id: editing?.id, name: g("name"), contact_name: g("contact"), email: g("email"), phone: g("phone"), address: g("addr") });
      if (r.error) return toast(r.error);
      toast(editing ? "Company updated" : "Company added");
      close();
    });
  }

  return (
    <section>
      <PageHead eyebrow="Office" title="Companies network" sub="Client companies feed the job form and invoices.">
        <button className="btn primary" onClick={() => openForm(null)}>＋ Add company</button>
      </PageHead>
      {error && <p className="err">{error}</p>}
      <div className="card">
        {formOpen && (
          <form key={formKey} ref={formRef} onSubmit={submit}>
            <div className="form-grid">
              <div className="fg"><label>Company name <span className="req">*</span></label><input name="name" required placeholder="Meridian Corporate Travel" defaultValue={editing?.name} autoFocus /></div>
              <div className="fg"><label>Contact person</label><input name="contact" placeholder="Sarah Whitmore" defaultValue={editing?.contact_name || ""} /></div>
              <div className="fg"><label>Email</label><input name="email" type="email" placeholder="bookings@meridiancorp.co.uk" defaultValue={editing?.email || ""} /></div>
              <div className="fg"><label>Phone</label><input name="phone" placeholder="+44 20 7946 0011" defaultValue={editing?.phone || ""} /></div>
              <div className="fg full"><label>Billing address</label><input name="addr" placeholder="14 Cornhill, London EC3V 3ND" defaultValue={editing?.address || ""} /></div>
            </div>
            <div className="form-foot">
              <span className="spacer" />
              <button type="button" className="btn ghost" onClick={close}>Cancel</button>
              <button type="submit" className="btn primary" disabled={pending}>Save company</button>
            </div>
          </form>
        )}
        <div className="drv-grid" style={{ padding: 16 }}>
          {companies.map((c) => (
            <div className="drv" key={c.id}>
              <div className="top">
                <div className="av">{initials(c.name)}</div>
                <div style={{ flex: 1 }}><b>{c.name}</b><span className="rating">{c.contact_name || "—"}</span></div>
              </div>
              <div className="row"><span>Email</span><span>{c.email || "—"}</span></div>
              <div className="row"><span>Phone</span><span>{c.phone || "—"}</span></div>
              <div className="row"><span>Address</span><span style={{ fontWeight: 400 }}>{c.address || "—"}</span></div>
              <div className="row" style={{ borderTop: "1px solid var(--border)", marginTop: 6, paddingTop: 8 }}>
                <span style={{ display: "flex", gap: 6 }}>
                  <button className="btn xs" onClick={() => openForm(c)}>Edit</button>
                  <button
                    className="btn xs danger"
                    onClick={() =>
                      start(async () => {
                        const r = await deleteCompany(c.id);
                        toast(r.error || "Company deleted");
                      })
                    }
                  >
                    Delete
                  </button>
                </span>
              </div>
            </div>
          ))}
          {!companies.length && <div className="inv-empty" style={{ gridColumn: "1/-1" }}>No companies yet. Add the first one.</div>}
        </div>
      </div>
    </section>
  );
}
