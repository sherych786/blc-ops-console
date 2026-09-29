"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveFleet(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "") || null;
  const fleetClass = String(formData.get("class") || "").trim();
  const registration = String(formData.get("registration") || "").trim();
  const pax = formData.get("pax") ? Number(formData.get("pax")) : null;
  const luggage = formData.get("luggage") ? Number(formData.get("luggage")) : null;
  const description = String(formData.get("description") || "").trim();
  const profile_pic_url = String(formData.get("profile_pic_url") || "").trim() || null;
  const video_url = String(formData.get("video_url") || "").trim() || null;
  const galleryRaw = String(formData.get("gallery_urls") || "[]");

  let gallery_urls: string[] = [];
  try {
    gallery_urls = JSON.parse(galleryRaw);
  } catch {
    gallery_urls = [];
  }

  if (!fleetClass) {
    return { error: "Vehicle class is required." };
  }

  const row = {
    class: fleetClass,
    registration,
    pax,
    luggage,
    description,
    profile_pic_url,
    video_url,
    gallery_urls,
  };

  const { error } = id
    ? await supabase.from("fleet").update(row).eq("id", id)
    : await supabase.from("fleet").insert(row);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/office/fleet");
  redirect("/office/fleet");
}

export async function deleteFleet(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("fleet").delete().eq("id", id);
  revalidatePath("/office/fleet");
}
