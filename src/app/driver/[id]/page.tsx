import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PhoneDriver, type PublicDriver } from "@/components/PhoneDriver";

export const metadata: Metadata = { title: "Daily update · Bespoke London Chauffeurs", robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A BLC driver's personal daily-update link. */
export default async function DriverUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = UUID.test(id) ? await supabase.rpc("public_driver", { p_id: id }) : { data: null };

  return (
    <div className="phone-stage">
      <div className="phone">
        {data ? (
          <PhoneDriver initial={data as PublicDriver} />
        ) : (
          <div className="public-err">This link is not valid. Please ask the office for your personal update link.</div>
        )}
      </div>
    </div>
  );
}
