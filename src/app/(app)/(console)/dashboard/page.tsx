import { createClient } from "@/lib/supabase/server";
import { JOB_SELECT, toJobs } from "@/lib/jobs";
import { money, num, todayISO, fmtDate } from "@/lib/format";
import { commission, isActive } from "@/lib/calc";
import { PageHead } from "@/components/ui";
import { DashboardClient, type Metric } from "./DashboardClient";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = todayISO();
  const head = { count: "exact" as const, head: true };
  const c = (s: string) => supabase.from("jobs").select("*", head).eq("status", s);

  const [board, todays, live, upcoming, completed, pending, enroute, atpickup, pob, cancelled, total] = await Promise.all([
    supabase.from("jobs").select(JOB_SELECT).order("pickup_date", { ascending: false }).order("pickup_time", { ascending: false }).limit(100),
    supabase.from("jobs").select("service_type, status, company_price, chauffeur_price, car_park, congestion, vat").eq("pickup_date", today),
    supabase.from("jobs").select("*", head).in("status", ["EnRoute", "At Pick Up", "POB", "Dropped off"]),
    supabase.from("jobs").select("*", head).neq("status", "Cancelled").gte("pickup_date", today).lte("pickup_date", todayISO(3)),
    c("Completed"), c("Pending"), c("EnRoute"), c("At Pick Up"), c("POB"), c("Cancelled"),
    supabase.from("jobs").select("*", head),
  ]);

  const t = todays.data || [];
  const tAct = t.filter(isActive);
  const air = t.filter((j) => j.service_type.startsWith("Airport")).length;

  // Same 12 metrics, labels and sub-lines as the prototype's METRICS map.
  const metrics: Record<string, Metric> = {
    jobsToday: { label: "Jobs today", val: String(t.length), sub: `${air} airport, ${t.length - air} transfers` },
    live: { label: "Live now", val: String(live.count ?? 0), sub: "En route and on board" },
    upcoming: { label: "Next 3 days", val: String(upcoming.count ?? 0), sub: "Booked in the next 3 days" },
    completed: { label: "Completed", val: String(completed.count ?? 0), sub: "Awaiting invoices" },
    pending: { label: "Pending", val: String(pending.count ?? 0), sub: "Not yet started" },
    enroute: { label: "En route", val: String(enroute.count ?? 0), sub: "On the way to pick-up" },
    atpickup: { label: "At pick-up", val: String(atpickup.count ?? 0), sub: "Waiting for passenger" },
    pob: { label: "Passenger on board", val: String(pob.count ?? 0), sub: "In progress" },
    cancelled: { label: "Cancelled", val: String(cancelled.count ?? 0), sub: "Called off" },
    total: { label: "Total jobs", val: String(total.count ?? 0), sub: "All time" },
    commission: { label: "Commission today", val: money(tAct.reduce((s, j) => s + commission(j), 0)), sub: "Net of chauffeur and VAT" },
    revenue: { label: "Revenue today", val: money(tAct.reduce((s, j) => s + num(j.company_price), 0)), sub: "Company prices today" },
  };

  return (
    <section>
      <PageHead
        eyebrow={<>Today, {fmtDate(today)}</>}
        title="Jobs overview"
        sub="Live board for the operations desk. Statuses update the moment a chauffeur taps them."
      >
        <Link className="btn primary" href="/jobs/new">＋ Create job</Link>
      </PageHead>
      {board.error && <p className="err">{board.error.message}</p>}
      <DashboardClient metrics={metrics} jobs={toJobs(board.data)} />
    </section>
  );
}
