import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { money } from "@/lib/format";
import { deleteEmployee } from "./actions";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, name, phone, registration, shift_hours, daily_wage, manager, fleet(class)")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Employees</h1>
        <Link
          href="/drivers/employees/new"
          className="control bg-[var(--accent)] text-white text-sm font-medium px-4 py-2"
        >
          + New Employee
        </Link>
      </div>

      {error && <p className="text-sm text-[var(--red)] mb-4">{error.message}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--grey)] border-b border-[var(--line)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Registration</th>
              <th className="px-4 py-3">Shift</th>
              <th className="px-4 py-3">Daily Wage</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {(employees || []).map((e) => (
              <tr key={e.id} className="border-b border-[var(--line)] last:border-0 hover:bg-[var(--surface)] transition-colors">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/drivers/employees/${e.id}`} className="hover:text-[var(--accent)]">
                    {e.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--grey)]">{e.phone || "—"}</td>
                <td className="px-4 py-3 text-[var(--grey)]">
                  {(e.fleet as unknown as { class: string } | null)?.class || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--grey)]">{e.registration || "—"}</td>
                <td className="px-4 py-3 text-[var(--grey)]">{e.shift_hours}h</td>
                <td className="px-4 py-3">{money(e.daily_wage)}</td>
                <td className="px-4 py-3 text-[var(--grey)]">{e.manager || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteEmployee}>
                    <input type="hidden" name="id" value={e.id} />
                    <button type="submit" className="text-xs text-[var(--red)] hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!employees || employees.length === 0) && !error && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--grey)]">
                  No employees yet — add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
