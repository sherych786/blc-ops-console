import { createClient } from "@/lib/supabase/server";
import { ChauffeursClient } from "./ChauffeursClient";

export default async function ChauffeursPage() {
  const supabase = await createClient();
  const [drivers, fleet] = await Promise.all([
    supabase.from("drivers").select("id, name, phone, vehicle_id, registration, license_no, area, rating, on_duty, fleet(class)").order("name"),
    supabase.from("fleet").select("id, class").order("created_at"),
  ]);
  return (
    <ChauffeursClient
      drivers={(drivers.data || []) as never}
      fleet={fleet.data || []}
      error={drivers.error?.message}
    />
  );
}
