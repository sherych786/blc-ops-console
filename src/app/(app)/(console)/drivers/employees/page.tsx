import { createClient } from "@/lib/supabase/server";
import { EmployeesClient } from "./EmployeesClient";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const [emps, fleet] = await Promise.all([
    supabase.from("employees").select("*, fleet(class)").order("name"),
    supabase.from("fleet").select("id, class").order("created_at"),
  ]);
  return <EmployeesClient employees={(emps.data || []) as never} fleet={fleet.data || []} error={emps.error?.message} />;
}
