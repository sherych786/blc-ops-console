import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

/** The Operations view: sidebar card + main column (prototype #view-console). */
export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [{ data: auth }, d, i, e, s] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("drivers").select("*", head),
    supabase.from("invoices").select("*", head),
    supabase.from("employees").select("*", head),
    supabase.from("salary_slips").select("*", head),
  ]);
  const counts = { drivers: d.count ?? 0, invoices: i.count ?? 0, employees: e.count ?? 0, slips: s.count ?? 0 };

  return (
    <div className="stage">
      <div className="console">
        <Sidebar counts={counts} email={auth.user?.email || ""} />
        <main className="main">{children}</main>
      </div>
    </div>
  );
}
