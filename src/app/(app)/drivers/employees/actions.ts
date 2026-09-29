"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveEmployee(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const id = String(formData.get("id") || "") || null;
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const email = String(formData.get("email") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const bank_name = String(formData.get("bank_name") || "").trim() || null;
  const bank_account = String(formData.get("bank_account") || "").trim() || null;
  const bank_sort_code = String(formData.get("bank_sort_code") || "").trim() || null;
  const vehicle_id = String(formData.get("vehicle_id") || "") || null;
  const registration = String(formData.get("registration") || "").trim() || null;
  const shift_hours = Number(formData.get("shift_hours") || 8);
  const daily_wage = Number(formData.get("daily_wage") || 0);
  const extra_hour_rate = Number(formData.get("extra_hour_rate") || 0);
  const manager = String(formData.get("manager") || "").trim() || null;
  const invoice_basis = String(formData.get("invoice_basis") || "").trim() || null;

  if (!name) return { error: "Employee name is required." };

  const row = {
    name,
    phone,
    email,
    address,
    bank_name,
    bank_account,
    bank_sort_code,
    vehicle_id,
    registration,
    shift_hours,
    daily_wage,
    extra_hour_rate,
    manager,
    invoice_basis,
  };

  const { error } = id
    ? await supabase.from("employees").update(row).eq("id", id)
    : await supabase.from("employees").insert(row);

  if (error) return { error: error.message };

  revalidatePath("/drivers/employees");
  redirect("/drivers/employees");
}

export async function deleteEmployee(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("employees").delete().eq("id", id);
  revalidatePath("/drivers/employees");
}
