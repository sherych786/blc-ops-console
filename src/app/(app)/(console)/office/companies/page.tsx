import { createClient } from "@/lib/supabase/server";
import { CompaniesClient } from "./CompaniesClient";

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("companies").select("id, name, contact_name, email, phone, address").order("name");
  return <CompaniesClient companies={data || []} error={error?.message} />;
}
