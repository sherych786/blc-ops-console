"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const t = (s: unknown) => String(s ?? "").trim() || null;

export async function saveDriver(d: {
  id?: string | null;
  name: string;
  phone: string;
  vehicle_id: string;
  registration: string;
  license_no: string;
  area: string;
}) {
  const name = (d.name || "").trim();
  if (!name || !d.phone?.trim() || !d.vehicle_id || !d.registration?.trim())
    return { error: "Name, mobile, fleet type and registration are required." };
  const row = {
    name,
    phone: t(d.phone),
    vehicle_id: d.vehicle_id,
    registration: d.registration.trim().toUpperCase(),
    license_no: t(d.license_no),
    area: t(d.area),
  };
  const supabase = await createClient();
  const { error } = d.id ? await supabase.from("drivers").update(row).eq("id", d.id) : await supabase.from("drivers").insert(row);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

export async function setOnDuty(id: string, on: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("drivers").update({ on_duty: on }).eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

export async function deleteDriver(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("drivers").delete().eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}
