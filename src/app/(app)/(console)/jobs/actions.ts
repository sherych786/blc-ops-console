"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { num } from "@/lib/format";
import { JOB_TYPES, DIRECTIONS } from "@/lib/types";

export type JobInput = {
  id?: string | null;
  service_type: string;
  direction: string;
  flight: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  pax_name: string;
  pax_phone: string;
  pax_email: string;
  pax_count: string;
  vehicle: string;
  company_id: string;
  driver_id: string;
  per_hour: string;
  min_hours: string;
  end_time: string;
  company_price: string;
  chauffeur_price: string;
  car_park: string;
  congestion: string;
  vat: boolean;
  notes: string;
};

const clean = (s: string | null | undefined) => (s || "").trim() || null;

/** Create or update a job (prototype: #jobForm submit). */
export async function saveJob(d: JobInput): Promise<{ error?: string; id?: string; ref?: string }> {
  if (!(JOB_TYPES as readonly string[]).includes(d.service_type)) return { error: "Choose a service type." };
  if (!d.driver_id) return { error: "Search and select a chauffeur" };
  if (!d.pickup_location || !d.dropoff_location || !d.pickup_date || !d.pickup_time || !d.pax_name)
    return { error: "Fill in every field marked *" };

  const air = d.service_type.startsWith("Airport");
  const hr = d.service_type.startsWith("Hourly");
  const row = {
    service_type: d.service_type,
    direction: air ? (DIRECTIONS as readonly string[]).includes(d.direction) ? d.direction : DIRECTIONS[0] : null,
    flight: air ? clean(d.flight?.toUpperCase()) : null,
    pickup_location: d.pickup_location.trim(),
    dropoff_location: d.dropoff_location.trim(),
    pickup_date: d.pickup_date,
    pickup_time: d.pickup_time,
    pax_name: d.pax_name.trim(),
    pax_phone: clean(d.pax_phone),
    pax_email: clean(d.pax_email),
    pax_count: clean(d.pax_count),
    vehicle: clean(d.vehicle),
    company_id: d.company_id || null,
    driver_id: d.driver_id,
    per_hour: hr ? num(d.per_hour) || null : null,
    min_hours: hr ? num(d.min_hours) || null : null,
    end_time: hr ? clean(d.end_time) : null,
    company_price: num(d.company_price),
    chauffeur_price: num(d.chauffeur_price),
    car_park: num(d.car_park),
    congestion: num(d.congestion),
    vat: !!d.vat,
    notes: clean(d.notes),
    updated_at: new Date().toISOString(),
  };

  const supabase = await createClient();
  const res = d.id
    ? await supabase.from("jobs").update(row).eq("id", d.id).select("id, ref").single()
    : await supabase.from("jobs").insert({ ...row, status: "Pending" }).select("id, ref").single();
  if (res.error) return { error: res.error.message };

  revalidatePath("/", "layout");
  return { id: res.data.id, ref: res.data.ref };
}

/** Cancel (prototype data-cancel) — status → Cancelled. */
export async function cancelJob(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").update({ status: "Cancelled", updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

/**
 * Restore (prototype data-restore): back to Completed if it was
 * completed, else EnRoute if it had started, else Pending.
 */
export async function restoreJob(id: string) {
  const supabase = await createClient();
  const { data: stamps } = await supabase.from("job_status_stamps").select("status").eq("job_id", id);
  const keys = (stamps || []).map((s) => s.status);
  const status = keys.includes("Completed") ? "Completed" : keys.length ? "EnRoute" : "Pending";
  const { error } = await supabase.from("jobs").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

/**
 * Permanently delete a job.
 * job_status_stamps cascade-deletes automatically (ON DELETE CASCADE).
 * Any linked invoice has its job_id set to null (ON DELETE SET NULL).
 */
export async function deleteJob(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

/** Preview "↺ Reset flow": clears a job's stamps back to Pending. */
export async function resetJobFlow(id: string) {
  const supabase = await createClient();
  await supabase.from("job_status_stamps").delete().eq("job_id", id);
  const { error } = await supabase.from("jobs").update({ status: "Pending", updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}
