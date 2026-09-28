import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ count: jobsToday }, { data: activeJobs }, { count: totalCompanies }] =
    await Promise.all([
      supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("pickup_date", today),
      supabase
        .from("jobs")
        .select("company_price, chauffeur_price, car_park, congestion, vat")
        .in("status", ["new", "assigned", "on_the_way", "arrived", "in_progress"]),
      supabase.from("companies").select("*", { count: "exact", head: true }),
    ]);

  const pipelineValue = (activeJobs || []).reduce(
    (sum, j) => sum + Number(j.company_price || 0),
    0
  );

  const cards = [
    { label: "Jobs today", value: String(jobsToday ?? 0) },
    { label: "Active jobs", value: String((activeJobs || []).length) },
    { label: "Active pipeline value", value: money(pipelineValue) },
    { label: "Companies on file", value: String(totalCompanies ?? 0) },
  ];

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4">
            <div className="text-xs text-[var(--grey)] mb-1">{c.label}</div>
            <div className="text-2xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>

      <p className="text-sm text-[var(--grey)] mt-8">
        This is the first real, database-backed page. The rest of the
        modules (Office, Invoices, BLC Drivers) follow the same pattern —
        see <code>ROADMAP.md</code> for what&apos;s next.
      </p>
    </div>
  );
}
