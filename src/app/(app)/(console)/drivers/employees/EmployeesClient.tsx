"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { Employee } from "@/lib/types";
import { initials, money, num } from "@/lib/format";
import { driverURL, href } from "@/lib/messages";
import { useToast, useCopy } from "@/components/Toast";
import { PageHead, MoneyIn } from "@/components/ui";
import { saveEmployee, deleteEmployee } from "../actions";

export function EmployeesClient({ employees, fleet, error }: { employees: Employee[]; fleet: { id: string; class: string }[]; error?: string }) {
  const [editing, setEditing] = useState<Employee | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);
  const [pending, start] = useTransition();
  const toast = useToast();
  const copy = useCopy();
  const formRef = useRef<HTMLFormElement>(null);

  function openForm(e: Employee | null) {
    setEditing(e);
    setDone(null);
    setFormKey((k) => k + 1);
    setFormOpen(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
  }
  const close = () => {
    setFormOpen(false);
    setEditing(null);
  };

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const d: Record<string, string> = {};
    f.forEach((v, k) => (d[k] = String(v)));
    const wasEditing = editing;
    start(async () => {
      const r = await saveEmployee(d, wasEditing?.id);
      if (r.error) return toast(r.error);
      close();
      if (wasEditing) toast("Employee updated");
      else {
        toast("Employee added, daily link generated");
        setDone({ id: r.id!, name: d.name });
      }
    });
  }

  const e = editing;
  return (
    <section>
      <PageHead
        eyebrow="BLC Drivers"
        title="Employees"
        sub="Salaried drivers on our own vehicles. Set the shift, wage and manager, then share a link so they log their day."
      >
        <button className="btn primary" onClick={() => openForm(null)}>＋ New employee</button>
      </PageHead>
      {error && <p className="err">{error}</p>}
      {formOpen && (
        <form key={formKey} ref={formRef} className="card" style={{ marginBottom: 18 }} onSubmit={submit}>
          <div className="card-h"><h3>{e ? "Edit employee profile" : "New employee profile"}</h3></div>
          <div className="form-grid">
            <div className="subhead">Personal and contact</div>
            <div className="fg"><label>Full name <span className="req">*</span></label><input name="name" required placeholder="Marcus Bell" defaultValue={e?.name} autoFocus /></div>
            <div className="fg"><label>Mobile <span className="req">*</span></label><input name="phone" required placeholder="+44 7700 901234" defaultValue={e?.phone || ""} /></div>
            <div className="fg"><label>Email</label><input name="email" type="email" placeholder="marcus.bell@myblc.co.uk" defaultValue={e?.email || ""} /></div>
            <div className="fg"><label>Home address</label><input name="address" placeholder="22 Beckton Road, London E16 1QG" defaultValue={e?.address || ""} /></div>
            <div className="subhead">Bank details (for salary slip)</div>
            <div className="fg"><label>Bank name</label><input name="bank_name" placeholder="Barclays" defaultValue={e?.bank_name || ""} /></div>
            <div className="fg"><label>Account number</label><input name="bank_account" placeholder="41028837" defaultValue={e?.bank_account || ""} /></div>
            <div className="fg"><label>Sort code</label><input name="bank_sort_code" placeholder="20-45-77" defaultValue={e?.bank_sort_code || ""} /></div>
            <div className="subhead">Vehicle and pay</div>
            <div className="fg">
              <label>Assigned vehicle</label>
              <select name="vehicle_id" defaultValue={e?.vehicle_id || fleet[0]?.id || ""}>
                {fleet.map((f) => <option key={f.id} value={f.id}>{f.class}</option>)}
                <option value="">— none —</option>
              </select>
            </div>
            <div className="fg"><label>Vehicle registration</label><input name="registration" placeholder="LN72 BLC" defaultValue={e?.registration || ""} /></div>
            <div className="fg"><label>Shift length (hours) <span className="req">*</span></label><input name="shift_hours" type="number" step="0.5" min="1" required defaultValue={e ? num(e.shift_hours) : 10} /></div>
            <div className="fg"><label>Daily wage <span className="req">*</span></label><MoneyIn name="daily_wage" required defaultValue={e ? num(e.daily_wage) : 200} /></div>
            <div className="fg"><label>Extra hour rate <span className="req">*</span></label><MoneyIn name="extra_hour_rate" required defaultValue={e ? num(e.extra_hour_rate) : 20} /></div>
            <div className="fg"><label>Responsible manager</label><input name="manager" placeholder="Operations manager" defaultValue={e?.manager || ""} /></div>
            <div className="fg">
              <label>Pay / invoice basis</label>
              <select name="invoice_basis" defaultValue={e?.invoice_basis || "Weekly"}>
                <option>Weekly</option>
                <option>Bi-Weekly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>
          <div className="form-foot">
            <span className="sheet-note"><b>◆</b> Creates the profile and a daily-update link to share with the driver.</span>
            <span className="spacer" />
            <button type="button" className="btn ghost" onClick={close}>Cancel</button>
            <button type="submit" className="btn primary" disabled={pending}>Save and generate link</button>
          </div>
        </form>
      )}
      {done && (
        <div className="linkrow">
          <div className="lk-ic">🔗</div>
          <div>
            <small>Daily update link for {done.name}</small>
            <div className="url">{driverURL(done.id)}</div>
          </div>
          <button className="btn sm" onClick={() => copy(href(driverURL(done.id)), "Link")}>Copy</button>
          <Link className="btn sm primary" href={`/preview/driver?emp=${done.id}`}>Open</Link>
        </div>
      )}
      <div className="drv-grid">
        {employees.map((x) => (
          <div className="drv" key={x.id}>
            <div className="top">
              <div className="av">{initials(x.name)}</div>
              <div style={{ flex: 1 }}><b>{x.name}</b><span className="rating">{x.invoice_basis || "Weekly"} pay</span></div>
            </div>
            <div className="row"><span>Mobile</span><span>{x.phone || "—"}</span></div>
            <div className="row"><span>Vehicle</span><span>{x.fleet?.class || "—"}{x.registration ? " · " + x.registration : ""}</span></div>
            <div className="row"><span>Shift</span><span>{num(x.shift_hours)}h · {money(x.daily_wage)}/day</span></div>
            <div className="row"><span>Extra hour</span><span>{money(x.extra_hour_rate)}</span></div>
            <div className="row"><span>Manager</span><span>{x.manager || "—"}</span></div>
            <div className="row" style={{ borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
              <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button className="btn xs" onClick={() => copy(href(driverURL(x.id)), "Link")}>Link</button>
                <button className="btn xs" onClick={() => openForm(x)}>Edit</button>
                <button
                  className="btn xs danger"
                  onClick={() =>
                    start(async () => {
                      const r = await deleteEmployee(x.id);
                      toast(r.error || "Employee deleted");
                    })
                  }
                >
                  Delete
                </button>
              </span>
            </div>
          </div>
        ))}
        {!employees.length && <div className="card inv-empty" style={{ gridColumn: "1/-1" }}>No employees yet. Add the first one.</div>}
      </div>
    </section>
  );
}
