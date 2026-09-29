import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui";
import type { Slip } from "@/components/SlipDoc";
import { SlipsClient } from "./SlipsClient";

export default async function SalarySlipsPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  const { open } = await searchParams;
  const supabase = await createClient();
  const [slips, emps] = await Promise.all([
    supabase
      .from("salary_slips")
      .select("id, slip_no, employee_id, period_from, period_to, status, employee, rows, adjustments")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("employees").select("id, name").order("name"),
  ]);
  return (
    <section>
      <PageHead eyebrow="BLC Drivers" title="Salary slips" sub="Generated slips with the wage and expense breakdown. Adjust manually before you send." />
      {slips.error && <p className="err">{slips.error.message}</p>}
      <SlipsClient slips={(slips.data || []) as Slip[]} employees={emps.data || []} openNo={open || ""} />
    </section>
  );
}
