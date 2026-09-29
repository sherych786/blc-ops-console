import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PhoneJob, type PublicJob } from "@/components/PhoneJob";

export const metadata: Metadata = { title: "Job sheet · Bespoke London Chauffeurs", robots: { index: false } };

/** Chauffeur's live job sheet (the prototype's "Chauffeur link" view). */
export default async function ChauffeurJobPage({
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
          <div className="public-err">This job link is not valid. Please check the link the office sent you.</div>
        )}
      </div>
    </div>
  );
}
