"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { jobRef } from "@/lib/format";

export async function createJob(_prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const companyId = String(formData.get("company_id") || "") || null;
  const driverId = String(formData.get("driver_id") || "") || null;
  const pickupDate = String(formData.get("pickup_date") || "");
  const pickupTime = String(formData.get("pickup_time") || "") || null;
  const pickupLocation = String(formData.get("pickup_location") || "");
  const dropoffLocation = String(formData.get("dropoff_location") || "");
  const serviceType = String(formData.get("service_type") || "one_way");
  const companyPrice = Number(formData.get("company_price") || 0);
  const chauffeurPrice = Number(formData.get("chauffeur_price") || 0);
  const carPark = Number(formData.get("car_park") || 0);
  const congestion = Number(formData.get("congestion") || 0);
  const vat = formData.get("vat") === "on";

  if (!pickupDate || !pickupLocation) {
    return { error: "Pickup date and pickup location are required." };
  }

  const { error } = await supabase.from("jobs").insert({
    ref: jobRef(),
    company_id: companyId,
    driver_id: driverId,
    pickup_date: pickupDate,
    pickup_time: pickupTime,
    pickup_location: pickupLocation,
    dropoff_location: dropoffLocation,
    service_type: serviceType,
    company_price: companyPrice,
    chauffeur_price: chauffeurPrice,
    car_park: carPark,
    congestion: congestion,
    vat,
    status: "new",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/jobs");
  redirect("/jobs");
}
