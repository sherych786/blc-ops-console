"use client";

import { useActionState } from "react";
import { createJob } from "../actions";

const inputCls =
  "control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]";
const labelCls = "text-sm font-medium block mb-1";

export function NewJobForm({
  companies,
  drivers,
}: {
  companies: { id: string; name: string }[];
  drivers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createJob, null);

  return (
    <form action={formAction} className="card p-6 max-w-2xl flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="company_id">Company</label>
          <select id="company_id" name="company_id" className={inputCls}>
            <option value="">— none —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="driver_id">Chauffeur</label>
          <select id="driver_id" name="driver_id" className={inputCls}>
            <option value="">— unassigned —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="pickup_date">Pickup date</label>
          <input id="pickup_date" name="pickup_date" type="date" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="pickup_time">Pickup time</label>
          <input id="pickup_time" name="pickup_time" type="time" className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="pickup_location">Pickup location</label>
        <input id="pickup_location" name="pickup_location" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="dropoff_location">Drop-off location</label>
        <input id="dropoff_location" name="dropoff_location" className={inputCls} />
      </div>

      <div>
        <label className={labelCls} htmlFor="service_type">Service type</label>
        <select id="service_type" name="service_type" className={inputCls} defaultValue="one_way">
          <option value="one_way">One-Way</option>
          <option value="airport">Airport</option>
          <option value="hourly">Hourly</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="company_price">Company price (£)</label>
          <input id="company_price" name="company_price" type="number" step="0.01" min="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="chauffeur_price">Chauffeur price (£)</label>
          <input id="chauffeur_price" name="chauffeur_price" type="number" step="0.01" min="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="car_park">Car park (£)</label>
          <input id="car_park" name="car_park" type="number" step="0.01" min="0" className={inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="congestion">Congestion (£)</label>
          <input id="congestion" name="congestion" type="number" step="0.01" min="0" className={inputCls} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="vat" /> VAT applies (20% on company price)
      </label>

      {state?.error && <p className="text-sm text-[var(--red)]">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="control bg-[var(--accent)] text-white font-medium py-2 text-sm disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create Job"}
      </button>
    </form>
  );
}
