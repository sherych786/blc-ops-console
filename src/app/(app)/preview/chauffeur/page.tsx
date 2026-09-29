import { createClient } from "@/lib/supabase/server";
import { PhoneJob, type PublicJob } from "@/components/PhoneJob";
import { PreviewPicker } from "../PreviewPicker";

/** Prototype "Chauffeur link" view: the real job link inside a phone frame. */
export default async function ChauffeurPreview({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const supabase = await createClient();
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, ref, pickup_location, dropoff_location, driver_key")
    .order("pickup_date", { ascending: false })
    .limit(100);
  const list = jobs || [];
  const cur = list.find((j) => j.ref === ref) || list[0];
  const { data } = cur ? await supabase.rpc("public_job", { p_ref: cur.ref, p_key: cur.driver_key }) : { data: null };

  return (
    <div className="phone-stage">
      <PreviewPicker
        label="Previewing job"
        param="ref"
        value={cur?.ref || ""}
        options={list.map((j) => ({
          value: j.ref,
          label: `${j.ref}, ${(j.pickup_location || "").split(",")[0]} to ${(j.dropoff_location || "").split(",")[0]}`,
        }))}
        resetJobId={cur?.id}
      />
      <div className="phone">
        {data ? (
          <PhoneJob key={cur!.ref + JSON.stringify((data as PublicJob).stamps)} initial={data as PublicJob} linkKey={cur!.driver_key} />
        ) : (
          <div className="public-err">No jobs yet. Create one to preview the chauffeur link.</div>
        )}
      </div>
      <div className="phone-note">What the chauffeur opens from the shared link. Every tap timestamps the job and updates the console in real time.</div>
    </div>
  );
}
