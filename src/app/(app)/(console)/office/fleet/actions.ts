"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const t = (s: unknown) => String(s ?? "").trim() || null;

export type FleetInput = {
  id?: string | null;
  class: string;
  notes: string;
  pax: string;
  luggage: string;
  description: string;
  profile_pic_url: string | null;
  gallery_urls: string[];
  video_url: string | null;
};

export async function saveFleet(d: FleetInput) {
  const cls = (d.class || "").trim();
  if (!cls) return { error: "Vehicle type is required." };
  const row = {
    class: cls,
    notes: t(d.notes),
    pax: t(d.pax),
    luggage: t(d.luggage),
    description: t(d.description),
    profile_pic_url: d.profile_pic_url || null,
    gallery_urls: (d.gallery_urls || []).filter(Boolean),
    video_url: d.video_url || null,
  };
  const supabase = await createClient();
  const { error } = d.id ? await supabase.from("fleet").update(row).eq("id", d.id) : await supabase.from("fleet").insert(row);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

export async function deleteFleet(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("fleet").delete().eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}
