import { createClient } from "@/lib/supabase/server";
import { EmployeeForm } from "../EmployeeForm";

export default async function NewEmployeePage() {
  const supabase = await createClient();
  const { data: fleet } = await supabase
    .from("fleet")
    .select("id, class, registration")
    .order("class");

  return (
    <div>
      <h1 className="text-lg font-bold mb-4">New Employee</h1>
      <EmployeeForm fleet={fleet || []} />
    </div>
  );
}
