"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const t = (s: unknown) => String(s ?? "").trim() || null;

export async function saveCompany(d: { id?: string | null; name: string; contact_name: string; email: string; phone: string; address: string }) {
  const name = (d.name || "").trim();
  if (!name) return { error: "Company name is required." };
  const row = { name, contact_name: t(d.contact_name), email: t(d.email), phone: t(d.phone), address: t(d.address) };
  const supabase = await createClient();
  const { error } = d.id ? await supabase.from("companies").update(row).eq("id", d.id) : await supabase.from("companies").insert(row);
  revalidatePath("/", "layout");
  return { error: error?.message };
}

export async function deleteCompany(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("companies").delete().eq("id", id);
  revalidatePath("/", "layout");
  return { error: error?.message };
}
