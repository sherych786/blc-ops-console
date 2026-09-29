import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FleetForm } from "../FleetForm";

export default async function EditFleetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: fleet } = await supabase.from("fleet").select("*").eq("id", id).single();

  if (!fleet) notFound();

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">Edit Vehicle</h1>
      <FleetForm fleet={fleet} />
    </div>
  );
}
