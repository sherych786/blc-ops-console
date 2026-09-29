"use client";

import { useActionState } from "react";
import { saveCompany } from "./actions";

const inputCls =
  "control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]";
const labelCls = "text-sm font-medium block mb-1";

type Company = {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export function CompanyForm({ company }: { company?: Company }) {
  const [state, formAction, pending] = useActionState(saveCompany, null);

  return (
    <form action={formAction} className="card p-6 max-w-xl flex flex-col gap-4">
      {company && <input type="hidden" name="id" value={company.id} />}

      <div>
        <label className={labelCls} htmlFor="name">Company name</label>
        <input id="name" name="name" required defaultValue={company?.name} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="contact_name">Contact name</label>
        <input id="contact_name" name="contact_name" defaultValue={company?.contact_name ?? ""} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={company?.phone ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={company?.email ?? ""} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="address">Address</label>
        <input id="address" name="address" defaultValue={company?.address ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={company?.notes ?? ""} className={inputCls} />
      </div>

      {state?.error && <p className="text-sm text-[var(--red)]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="control bg-[var(--accent)] text-white font-medium py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : company ? "Save Changes" : "Create Company"}
      </button>
    </form>
  );
}
