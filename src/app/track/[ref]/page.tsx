import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PhoneJob, type PublicJob } from "@/components/PhoneJob";

export const metadata: Metadata = { title: "Track your journey · Bespoke London Chauffeurs", robots: { index: false } };

/** Company view-only tracking link (no prices, no status buttons). */
export default async function TrackJobPage({
  params,
  searchParams,
}: {
  params: Promise<{ ref: string }>;
  searchParams: Promise<{ k?: string }>;
}) {
  const { ref } = await params;
  const { k = "" } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_job", { p_ref: decodeURIComponent(ref), p_key: k });

  return (
    <div className="phone-stage">
      <div className="phone">
        {data ? (
          <PhoneJob initial={data as PublicJob} linkKey={k} />
        ) : (
          <div className="public-err">This job link is not valid. Please check the link in your booking confirmation.</div>
        )}
      </div>
    </div>
  );
}
