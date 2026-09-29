"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveCompany(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const contact_name = String(formData.get("contact_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!name) {
    return { error: "Company name is required." };
  }

  const row = { name, contact_name, phone, email, address, notes };

  const { error } = id
    ? await supabase.from("companies").update(row).eq("id", id)
    : await supabase.from("companies").insert(row);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/office/companies");
  redirect("/office/companies");
}

export async function deleteCompany(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await supabase.from("companies").delete().eq("id", id);
  revalidatePath("/office/companies");
}
