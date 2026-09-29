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

const STATUS_COLOR: Record<string, string> = {
  new: "bg-[var(--surface)] text-[var(--grey)]",
  assigned: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  on_the_way: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  arrived: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  in_progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  completed: "bg-green-100 text-[var(--green)] dark:bg-green-900/30",
  cancelled: "bg-red-100 text-[var(--red)] dark:bg-red-900/30",
};

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "New", value: "new" },
  { label: "Assigned", value: "assigned" },
  { label: "Active", value: "_active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

const ACTIVE_STATUSES = ["on_the_way", "arrived", "in_progress"];

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusFilter = "", q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("jobs")
    .select(
      "id, ref, pickup_date, pickup_time, pickup_location, dropoff_location, service_type, company_price, status, companies(name)"
    )
    .order("pickup_date", { ascending: false })
    .limit(200);

  if (statusFilter === "_active") {
    query = query.in("status", ACTIVE_STATUSES);
  } else if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: jobs, error } = await query;

  // Client-side ref/company search (done in the render, keeps page a Server Component)
  const filtered = q
    ? (jobs || []).filter(
        (j) =>
          j.ref?.toLowerCase().includes(q.toLowerCase()) ||
          (j.companies as unknown as { name: string } | null)?.name
            ?.toLowerCase()
            .includes(q.toLowerCase()) ||
          j.pickup_location?.toLowerCase().includes(q.toLowerCase()) ||
          j.dropoff_location?.toLowerCase().includes(q.toLowerCase())
      )
    : (jobs || []);

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

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const isActive = tab.value === statusFilter;
          const href = tab.value
            ? `/jobs?status=${tab.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`
            : `/jobs${q ? `?q=${encodeURIComponent(q)}` : ""}`;
          return (
            <Link
              key={tab.value}
              href={href}
              className={`control px-3 py-1.5 text-xs font-medium border transition-colors ${
                isActive
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--line)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}

        {/* Search */}
        <form className="ml-auto" method="get" action="/jobs">
          {statusFilter && (
            <input type="hidden" name="status" value={statusFilter} />
          )}
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search ref, company, location…"
              className="control border border-[var(--line)] px-3 py-1.5 text-sm bg-[var(--paper)] w-64"
            />
            <button
              type="submit"
              className="control border border-[var(--line)] px-3 py-1.5 text-sm hover:border-[var(--accent)]"
            >
              Search
            </button>
          </div>
        </form>
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
            {filtered.map((j) => (
              <tr
                key={j.id}
                className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)] transition-colors"
              >
                <td className="px-4 py-3 font-medium">
                  <Link
                    href={`/jobs/${j.id}`}
                    className="hover:text-[var(--accent)] block"
                  >
                    {j.ref}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/jobs/${j.id}`} className="block">
                    {j.pickup_date}
                    {j.pickup_time && (
                      <span className="ml-1 text-[var(--grey)]">
                        {j.pickup_time.slice(0, 5)}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/jobs/${j.id}`} className="block">
                    {(j.companies as unknown as { name: string } | null)?.name || "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--grey)]">
                  <Link href={`/jobs/${j.id}`} className="block">
                    {j.pickup_location} → {j.dropoff_location || "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">
                  <Link href={`/jobs/${j.id}`} className="block">
                    {j.service_type?.replace(/_/g, " ")}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/jobs/${j.id}`} className="block">
                    {money(j.company_price)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[j.status] || ""}`}
                  >
                    {STATUS_LABEL[j.status] || j.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !error && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-[var(--grey)]">
                  {q || statusFilter ? "No jobs match these filters." : "No jobs yet — create the first one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
