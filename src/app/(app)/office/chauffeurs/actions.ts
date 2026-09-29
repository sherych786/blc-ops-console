"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveDriver(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const vehicle_id = String(formData.get("vehicle_id") || "") || null;
  const registration = String(formData.get("registration") || "").trim();
  const license_no = String(formData.get("license_no") || "").trim();
  const area = String(formData.get("area") || "").trim();

  if (!name) {
    return { error: "Chauffeur name is required." };
  }

  const row = { name, phone, email, vehicle_id, registration, license_no, area };

  const { error } = id
    ? await supabase.from("drivers").update(row).eq("id", id)
    : await supabase.from("drivers").insert(row);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/office/chauffeurs");
  redirect("/office/chauffeurs");
}

export async function deleteDriver(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("drivers").delete().eq("id", id);
  revalidatePath("/office/chauffeurs");
}
