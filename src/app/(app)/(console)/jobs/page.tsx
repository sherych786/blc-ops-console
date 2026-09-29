import { createClient } from "@/lib/supabase/server";
import { JOB_SELECT, toJobs } from "@/lib/jobs";
import { hhmm } from "@/lib/format";
import { PageHead } from "@/components/ui";
import { JobsOverviewClient } from "./JobsOverviewClient";

type SP = { co?: string; from?: string; to?: string; q?: string };

export default async function JobsOverviewPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const supabase = await createClient();

  let q = supabase.from("jobs").select(JOB_SELECT).order("pickup_date", { ascending: false }).order("pickup_time", { ascending: false }).limit(2000);
  if (sp.co) q = q.eq("company_id", sp.co);
  if (sp.from) q = q.gte("pickup_date", sp.from);
  if (sp.to) q = q.lte("pickup_date", sp.to);

  const [jobs, companies, last] = await Promise.all([
    q,
    supabase.from("companies").select("id, name").order("name"),
    supabase.from("jobs").select("updated_at").order("updated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <section>
      <PageHead
        eyebrow="Reporting"
        title="Jobs overview"
        sub="Every job with revenue, chauffeur cost, VAT and BLC commission. Filter by company or date range, edit or cancel a job, and export."
      >
        <span className="sheet-note">
          <b>●</b> Live database, last update {last.data?.updated_at ? hhmm(last.data.updated_at) : "—"}
        </span>
      </PageHead>
      {jobs.error && <p className="err">{jobs.error.message}</p>}
      <JobsOverviewClient jobs={toJobs(jobs.data)} companies={companies.data || []} filters={sp} />
    </section>
  );
}
