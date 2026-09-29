"use client";

import { useActionState, useState } from "react";
import { createJob } from "../actions";

const inputCls =
  "control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]";
const labelCls = "text-sm font-medium block mb-1";

function computeHourly(
  pickupTime: string,
  endTime: string,
  perHour: number,
  minHours: number
): number {
  if (!pickupTime || !endTime || !perHour) return 0;
  const [ph, pm] = pickupTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const startMins = ph * 60 + pm;
  let endMins = eh * 60 + em;
  if (endMins <= startMins) endMins += 24 * 60; // overnight
  const hours = Math.max(minHours || 0, (endMins - startMins) / 60);
  return Math.round(hours * perHour * 100) / 100;
}

export function NewJobForm({
  companies,
  drivers,
}: {
  companies: { id: string; name: string }[];
  drivers: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createJob, null);
  const [serviceType, setServiceType] = useState("one_way");
  const [pickupTime, setPickupTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [perHour, setPerHour] = useState("");
  const [minHours, setMinHours] = useState("");
  const [companyPrice, setCompanyPrice] = useState("");

  const isHourly = serviceType === "hourly";

  // Auto-calculate company price when hourly fields change
  const handleHourlyChange = (
    pt: string,
    et: string,
    ph: string,
    mh: string
  ) => {
    const computed = computeHourly(pt, et, Number(ph), Number(mh));
    if (computed > 0) {
      setCompanyPrice(computed.toFixed(2));
    }
  };

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
          <input
            id="pickup_time"
            name="pickup_time"
            type="time"
            className={inputCls}
            value={pickupTime}
            onChange={(e) => {
              setPickupTime(e.target.value);
              handleHourlyChange(e.target.value, endTime, perHour, minHours);
            }}
          />
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
        <select
          id="service_type"
          name="service_type"
          className={inputCls}
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option value="one_way">One-Way</option>
          <option value="airport">Airport</option>
          <option value="hourly">Hourly</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Hourly calculator — only shown when service_type = hourly */}
      {isHourly && (
        <div className="flex flex-col gap-3 p-4 bg-[var(--surface)] rounded-[var(--radius-card)]">
          <p className="text-xs font-semibold text-[var(--grey)] uppercase tracking-wide">Hourly calculator</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls} htmlFor="per_hour">Rate per hour (£)</label>
              <input
                id="per_hour"
                name="per_hour"
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={perHour}
                onChange={(e) => {
                  setPerHour(e.target.value);
                  handleHourlyChange(pickupTime, endTime, e.target.value, minHours);
                }}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="min_hours">Minimum hours</label>
              <input
                id="min_hours"
                name="min_hours"
                type="number"
                step="0.5"
                min="0"
                className={inputCls}
                value={minHours}
                onChange={(e) => {
                  setMinHours(e.target.value);
                  handleHourlyChange(pickupTime, endTime, perHour, e.target.value);
                }}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="end_time">End time</label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                className={inputCls}
                value={endTime}
                onChange={(e) => {
                  setEndTime(e.target.value);
                  handleHourlyChange(pickupTime, e.target.value, perHour, minHours);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls} htmlFor="company_price">
            Company price (£)
            {isHourly && companyPrice && (
              <span className="ml-2 text-xs text-[var(--accent)] font-normal">
                auto-calculated
              </span>
            )}
          </label>
          <input
            id="company_price"
            name="company_price"
            type="number"
            step="0.01"
            min="0"
            className={inputCls}
            value={companyPrice}
            onChange={(e) => setCompanyPrice(e.target.value)}
          />
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

      <div>
        <label className={labelCls} htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} className={inputCls} />
      </div>

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
