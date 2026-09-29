import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { FleetProfile, type FleetPublic } from "@/components/FleetProfile";

export const metadata: Metadata = { title: "Our fleet · Bespoke London Chauffeurs" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Public, shareable fleet profile. Reads through the public_fleet()
 * function — the fleet table itself stays closed to anonymous visitors
 * (the old version queried it directly, which RLS blocked for clients).
 */
export default async function PublicFleetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = UUID.test(id) ? await supabase.rpc("public_fleet", { p_id: id }) : { data: null };

  return (
    <div className="phone-stage">
      {data ? (
        <FleetProfile f={data as FleetPublic} />
      ) : (
        <div className="card public-err" style={{ maxWidth: 520, width: "100%" }}>This vehicle profile is not available.</div>
      )}
    </div>
  );
}
