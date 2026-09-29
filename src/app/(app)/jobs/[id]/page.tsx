import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JobDetailClient } from "./JobDetailClient";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: job }, { data: companies }, { data: drivers }, { data: stamps }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select(
          "id, ref, status, company_id, driver_id, pickup_date, pickup_time, pickup_location, dropoff_location, service_type, company_price, chauffeur_price, car_park, congestion, vat, per_hour, min_hours, end_time, notes"
        )
        .eq("id", id)
        .single(),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("drivers").select("id, name").order("name"),
      supabase
        .from("job_status_stamps")
        .select("id, status, stamped_at")
        .eq("job_id", id)
        .order("stamped_at", { ascending: false }),
    ]);

  if (!job) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/jobs"
          className="text-sm text-[var(--grey)] hover:text-[var(--accent)] transition-colors"
        >
          ← Jobs
        </Link>
        <span className="text-[var(--line)]">/</span>
        <h1 className="text-lg font-bold">{job.ref}</h1>
      </div>

      <JobDetailClient
        job={job}
        companies={companies || []}
        drivers={drivers || []}
        stamps={stamps || []}
      />
    </div>
  );
}
