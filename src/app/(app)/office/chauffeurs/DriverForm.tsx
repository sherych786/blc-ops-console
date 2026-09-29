"use client";

import { useActionState } from "react";
import { saveDriver } from "./actions";

const inputCls =
  "control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]";
const labelCls = "text-sm font-medium block mb-1";

type Driver = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  vehicle_id: string | null;
  registration: string | null;
  license_no: string | null;
  area: string | null;
};

export function DriverForm({
  driver,
  fleet,
}: {
  driver?: Driver;
  fleet: { id: string; class: string }[];
}) {
  const [state, formAction, pending] = useActionState(saveDriver, null);

  return (
    <form action={formAction} className="card p-6 max-w-xl flex flex-col gap-4">
      {driver && <input type="hidden" name="id" value={driver.id} />}

      <div>
        <label className={labelCls} htmlFor="name">Chauffeur name</label>
        <input id="name" name="name" required defaultValue={driver?.name} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={driver?.phone ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input id="email" name="email" type="email" defaultValue={driver?.email ?? ""} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="vehicle_id">Vehicle (Fleet)</label>
        <select id="vehicle_id" name="vehicle_id" defaultValue={driver?.vehicle_id ?? ""} className={inputCls}>
          <option value="">— none —</option>
          {fleet.map((f) => (
            <option key={f.id} value={f.id}>{f.class}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="registration">Registration</label>
          <input id="registration" name="registration" defaultValue={driver?.registration ?? ""} className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="license_no">License no.</label>
          <input id="license_no" name="license_no" defaultValue={driver?.license_no ?? ""} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="area">Area</label>
        <input id="area" name="area" defaultValue={driver?.area ?? ""} className={inputCls} />
      </div>

      {state?.error && <p className="text-sm text-[var(--red)]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="control bg-[var(--accent)] text-white font-medium py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Saving…" : driver ? "Save Changes" : "Create Chauffeur"}
      </button>
    </form>
  );
}
