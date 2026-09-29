import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmployeeForm } from "../EmployeeForm";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: employee }, { data: fleet }] = await Promise.all([
    supabase
      .from("employees")
      .select(
        "id, name, phone, email, address, bank_name, bank_account, bank_sort_code, vehicle_id, registration, shift_hours, daily_wage, extra_hour_rate, manager, invoice_basis"
      )
      .eq("id", id)
      .single(),
    supabase.from("fleet").select("id, class, registration").order("class"),
  ]);

  if (!employee) notFound();

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/drivers/employees"
          className="text-sm text-[var(--grey)] hover:text-[var(--accent)] transition-colors"
        >
          ← Employees
        </Link>
        <span className="text-[var(--line)]">/</span>
        <h1 className="text-lg font-bold">{employee.name}</h1>
      </div>
      <EmployeeForm employee={employee} fleet={fleet || []} />
    </div>
  );
}
