import { createClient } from "@/lib/supabase/server";
import { DriverForm } from "../DriverForm";

export default async function NewDriverPage() {
  const supabase = await createClient();
  const { data: fleet } = await supabase.from("fleet").select("id, class").order("class");

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">New Chauffeur</h1>
      <DriverForm fleet={fleet || []} />
    </div>
  );
}
