import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  on_the_way: "On the way",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function JobsPage() {
  const supabase = await createClient();
  const { data: jobs, error } = await supabase
    .from("jobs")
    .select(
      "id, ref, pickup_date, pickup_time, pickup_location, dropoff_location, service_type, company_price, status, companies(name)"
    )
    .order("pickup_date", { ascending: false })
    .limit(100);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Jobs Overview</h1>
        <Link
          href="/jobs/new"
          className="control bg-[var(--accent)] text-white text-sm font-medium px-4 py-2"
        >
          + New Job
        </Link>
      </div>

      {error && (
        <p className="text-sm text-[var(--red)] mb-4">{error.message}</p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--grey)] border-b border-[var(--line)]">
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(jobs || []).map((j) => (
              <tr key={j.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">{j.ref}</td>
                <td className="px-4 py-3">{j.pickup_date}</td>
                <td className="px-4 py-3">
                  {(j.companies as unknown as { name: string } | null)?.name || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--grey)]">
                  {j.pickup_location} → {j.dropoff_location}
                </td>
                <td className="px-4 py-3 capitalize">{j.service_type?.replace("_", " ")}</td>
                <td className="px-4 py-3">{money(j.company_price)}</td>
                <td className="px-4 py-3">{STATUS_LABEL[j.status] || j.status}</td>
              </tr>
            ))}
            {(!jobs || jobs.length === 0) && !error && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--grey)]">
                  No jobs yet — create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
