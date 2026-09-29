"use client";

import { useActionState } from "react";
import { saveEmployee } from "./actions";

const inputCls =
  "control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]";
const labelCls = "text-sm font-medium block mb-1";

type Employee = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_sort_code: string | null;
  vehicle_id: string | null;
  registration: string | null;
  shift_hours: number;
  daily_wage: number;
  extra_hour_rate: number;
  manager: string | null;
  invoice_basis: string | null;
};

export function EmployeeForm({
  employee,
  fleet,
}: {
  employee?: Employee;
  fleet: { id: string; class: string; registration: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(saveEmployee, null);

  return (
    <form action={formAction} className="card p-6 max-w-2xl flex flex-col gap-5">
      {employee && <input type="hidden" name="id" value={employee.id} />}

      {/* Personal details */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--grey)]">Personal</h2>
        <div>
          <label className={labelCls} htmlFor="name">Full name</label>
          <input id="name" name="name" required defaultValue={employee?.name} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="phone">Phone</label>
            <input id="phone" name="phone" defaultValue={employee?.phone ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="email">Email</label>
            <input id="email" name="email" type="email" defaultValue={employee?.email ?? ""} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="address">Address</label>
          <textarea id="address" name="address" rows={2} defaultValue={employee?.address ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="manager">Manager</label>
          <input id="manager" name="manager" defaultValue={employee?.manager ?? ""} className={inputCls} />
        </div>
      </section>

      {/* Bank details */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--grey)]">Bank Details</h2>
        <div>
          <label className={labelCls} htmlFor="bank_name">Bank name</label>
          <input id="bank_name" name="bank_name" defaultValue={employee?.bank_name ?? ""} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="bank_account">Account number</label>
            <input id="bank_account" name="bank_account" defaultValue={employee?.bank_account ?? ""} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="bank_sort_code">Sort code</label>
            <input id="bank_sort_code" name="bank_sort_code" placeholder="00-00-00" defaultValue={employee?.bank_sort_code ?? ""} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Vehicle */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--grey)]">Vehicle</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="vehicle_id">Fleet vehicle</label>
            <select id="vehicle_id" name="vehicle_id" className={inputCls} defaultValue={employee?.vehicle_id ?? ""}>
              <option value="">— none —</option>
              {fleet.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.class}{v.registration ? ` (${v.registration})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="registration">Registration</label>
            <input id="registration" name="registration" defaultValue={employee?.registration ?? ""} className={inputCls} />
          </div>
        </div>
      </section>

      {/* Pay */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--grey)]">Pay</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls} htmlFor="shift_hours">Shift hours</label>
            <input
              id="shift_hours"
              name="shift_hours"
              type="number"
              step="0.5"
              min="0"
              defaultValue={employee?.shift_hours ?? 8}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="daily_wage">Daily wage (£)</label>
            <input
              id="daily_wage"
              name="daily_wage"
              type="number"
              step="0.01"
              min="0"
              defaultValue={employee?.daily_wage ?? 0}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="extra_hour_rate">Extra hour rate (£)</label>
            <input
              id="extra_hour_rate"
              name="extra_hour_rate"
              type="number"
              step="0.01"
              min="0"
              defaultValue={employee?.extra_hour_rate ?? 0}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="invoice_basis">Invoice basis / notes</label>
          <input id="invoice_basis" name="invoice_basis" defaultValue={employee?.invoice_basis ?? ""} className={inputCls} />
        </div>
      </section>

      {state?.error && <p className="text-sm text-[var(--red)]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="control bg-[var(--accent)] text-white font-medium py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : employee ? "Save Changes" : "Create Employee"}
      </button>
    </form>
  );
}
