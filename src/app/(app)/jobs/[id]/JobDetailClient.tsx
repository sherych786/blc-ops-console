"use client";

import { useActionState } from "react";
import { updateJob, updateJobStatus } from "../actions";

const inputCls =
  "control w-full border border-[var(--line)] px-3 py-2 text-sm bg-[var(--paper)]";
const labelCls = "text-sm font-medium block mb-1";

const STATUS_ORDER = [
  "new",
  "assigned",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
] as const;

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  on_the_way: "On the way",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-[var(--surface)] text-[var(--grey)]",
  assigned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  on_the_way: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  arrived: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  in_progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-green-100 text-[var(--green)] dark:bg-green-900/30",
  cancelled: "bg-red-100 text-[var(--red)] dark:bg-red-900/30",
};

type Job = {
  id: string;
  ref: string;
  status: string;
  company_id: string | null;
  driver_id: string | null;
  pickup_date: string;
  pickup_time: string | null;
  pickup_location: string | null;
  dropoff_location: string | null;
  service_type: string;
  company_price: number;
  chauffeur_price: number;
  car_park: number;
  congestion: number;
  vat: boolean;
  per_hour: number | null;
  min_hours: number | null;
  end_time: string | null;
  notes: string | null;
};

type StatusStamp = {
  id: string;
  status: string;
  stamped_at: string;
};

export function JobDetailClient({
  job,
  companies,
  drivers,
  stamps,
}: {
  job: Job;
  companies: { id: string; name: string }[];
  drivers: { id: string; name: string }[];
  stamps: StatusStamp[];
}) {
  const [state, formAction, pending] = useActionState(updateJob, null);

  // Next statuses available from the current one
  const currentIdx = STATUS_ORDER.indexOf(job.status as typeof STATUS_ORDER[number]);
  const nextStatuses = STATUS_ORDER.filter(
    (s, i) => i > currentIdx && s !== "cancelled"
  );
  const canCancel = job.status !== "completed" && job.status !== "cancelled";

  const isHourly = job.service_type === "hourly";

  return (
    <div className="flex flex-col gap-6">
      {/* Status bar */}
      <div className="card p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--grey)]">Current status:</span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLOR[job.status] || ""}`}
          >
            {STATUS_LABEL[job.status] || job.status}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {nextStatuses.map((s) => (
            <form key={s} action={updateJobStatus}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="status" value={s} />
              <button
                type="submit"
                className="control border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                → {STATUS_LABEL[s]}
              </button>
            </form>
          ))}
          {canCancel && (
            <form action={updateJobStatus}>
              <input type="hidden" name="id" value={job.id} />
              <input type="hidden" name="status" value="cancelled" />
              <button
                type="submit"
                className="control border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-[var(--red)] hover:border-[var(--red)] transition-colors"
              >
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Edit form */}
      <form action={formAction} className="card p-6 flex flex-col gap-4">
        <input type="hidden" name="id" value={job.id} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="company_id">Company</label>
            <select
              id="company_id"
              name="company_id"
              className={inputCls}
              defaultValue={job.company_id ?? ""}
            >
              <option value="">— none —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls} htmlFor="driver_id">Chauffeur</label>
            <select
              id="driver_id"
              name="driver_id"
              className={inputCls}
              defaultValue={job.driver_id ?? ""}
            >
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
            <input
              id="pickup_date"
              name="pickup_date"
              type="date"
              required
              defaultValue={job.pickup_date}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="pickup_time">Pickup time</label>
            <input
              id="pickup_time"
              name="pickup_time"
              type="time"
              defaultValue={job.pickup_time ?? ""}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls} htmlFor="pickup_location">Pickup location</label>
          <input
            id="pickup_location"
            name="pickup_location"
            required
            defaultValue={job.pickup_location ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="dropoff_location">Drop-off location</label>
          <input
            id="dropoff_location"
            name="dropoff_location"
            defaultValue={job.dropoff_location ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls} htmlFor="service_type">Service type</label>
          <select
            id="service_type"
            name="service_type"
            className={inputCls}
            defaultValue={job.service_type}
          >
            <option value="one_way">One-Way</option>
            <option value="airport">Airport</option>
            <option value="hourly">Hourly</option>
            <option value="other">Other</option>
          </select>
        </div>

        {isHourly && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--surface)] rounded-[var(--radius-card)]">
            <div>
              <label className={labelCls} htmlFor="per_hour">Rate per hour (£)</label>
              <input
                id="per_hour"
                name="per_hour"
                type="number"
                step="0.01"
                min="0"
                defaultValue={job.per_hour ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="min_hours">Min hours</label>
              <input
                id="min_hours"
                name="min_hours"
                type="number"
                step="0.5"
                min="0"
                defaultValue={job.min_hours ?? ""}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="end_time">End time</label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                defaultValue={job.end_time ?? ""}
                className={inputCls}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls} htmlFor="company_price">Company price (£)</label>
            <input
              id="company_price"
              name="company_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={job.company_price}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="chauffeur_price">Chauffeur price (£)</label>
            <input
              id="chauffeur_price"
              name="chauffeur_price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={job.chauffeur_price}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="car_park">Car park (£)</label>
            <input
              id="car_park"
              name="car_park"
              type="number"
              step="0.01"
              min="0"
              defaultValue={job.car_park}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="congestion">Congestion (£)</label>
            <input
              id="congestion"
              name="congestion"
              type="number"
              step="0.01"
              min="0"
              defaultValue={job.congestion}
              className={inputCls}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="vat" defaultChecked={job.vat} /> VAT applies (20% on company price)
        </label>

        <div>
          <label className={labelCls} htmlFor="notes">Notes</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            defaultValue={job.notes ?? ""}
            className={inputCls}
          />
        </div>

        {state?.error && <p className="text-sm text-[var(--red)]">{state.error}</p>}
        {state?.success && (
          <p className="text-sm text-[var(--green)]">Changes saved.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="control bg-[var(--accent)] text-white font-medium py-2 text-sm disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* Status history */}
      {stamps.length > 0 && (
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-3">Status History</h2>
          <ol className="flex flex-col gap-2">
            {stamps.map((s) => (
              <li key={s.id} className="flex items-center gap-3 text-sm">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[s.status] || "bg-[var(--surface)] text-[var(--grey)]"}`}
                >
                  {STATUS_LABEL[s.status] || s.status}
                </span>
                <span className="text-[var(--grey)] text-xs">
                  {new Date(s.stamped_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
