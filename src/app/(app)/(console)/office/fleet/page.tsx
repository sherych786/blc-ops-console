import { createClient } from "@/lib/supabase/server";
import { FleetClient } from "./FleetClient";

export default async function FleetPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fleet")
    .select("id, class, notes, pax, luggage, description, profile_pic_url, gallery_urls, video_url")
    .order("created_at");
  return <FleetClient fleet={data || []} error={error?.message} />;
}
