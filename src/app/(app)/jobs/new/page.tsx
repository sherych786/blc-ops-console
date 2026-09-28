import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "./NewJobForm";

export default async function NewJobPage() {
  const supabase = await createClient();
  const [{ data: companies }, { data: drivers }] = await Promise.all([
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("drivers").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">New Job</h1>
      <NewJobForm companies={companies || []} drivers={drivers || []} />
    </div>
  );
}
