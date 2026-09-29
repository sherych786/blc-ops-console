import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DriverForm } from "../DriverForm";

export default async function EditDriverPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: driver }, { data: fleet }] = await Promise.all([
    supabase.from("drivers").select("*").eq("id", id).single(),
    supabase.from("fleet").select("id, class").order("class"),
  ]);

  if (!driver) notFound();

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">Edit Chauffeur</h1>
      <DriverForm driver={driver} fleet={fleet || []} />
    </div>
  );
}
