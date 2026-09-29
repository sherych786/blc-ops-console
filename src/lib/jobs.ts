// One place that knows how to read jobs from Supabase and shape them
// into the Job type the console components use.
import type { Job } from "./types";

export const JOB_SELECT =
  "id, ref, status, service_type, direction, flight, pickup_location, dropoff_location, pickup_date, pickup_time, " +
  "pax_name, pax_phone, pax_email, pax_count, vehicle, company_id, driver_id, company_price, chauffeur_price, car_park, " +
  "congestion, vat, per_hour, min_hours, end_time, notes, driver_key, track_key, created_at, " +
  "companies(name, contact_name), drivers(name, phone, registration, fleet(class)), job_status_stamps(status, stamped_at)";

type Raw = Record<string, unknown> & {
  companies?: { name: string; contact_name: string | null } | null;
  drivers?: { name: string; phone: string | null; registration: string | null; fleet?: { class: string } | null } | null;
  job_status_stamps?: { status: string; stamped_at: string }[] | null;
};

export function toJob(r: Raw): Job {
  const stamps: Record<string, string> = {};
  (r.job_status_stamps || []).forEach((s) => (stamps[s.status] = s.stamped_at));
  const d = r.drivers;
  return {
    ...(r as unknown as Job),
    company_price: Number(r.company_price || 0),
    chauffeur_price: Number(r.chauffeur_price || 0),
    car_park: Number(r.car_park || 0),
    congestion: Number(r.congestion || 0),
    company: r.companies || null,
    driver: d ? { name: d.name, phone: d.phone, registration: d.registration, vehicle: d.fleet?.class || null } : null,
    stamps,
  };
}

export function toJobs(rows: unknown[] | null): Job[] {
  return (rows || []).map((r) => toJob(r as Raw));
}
