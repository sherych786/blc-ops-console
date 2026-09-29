import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteCompany } from "./actions";

export default async function CompaniesPage() {
  const supabase = await createClient();
  const { data: companies, error } = await supabase
    .from("companies")
    .select("id, name, contact_name, phone, email")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Companies</h1>
        <Link
          href="/office/companies/new"
          className="control bg-[var(--accent)] text-white text-sm font-medium px-4 py-2"
        >
          + New Company
        </Link>
      </div>

      {error && <p className="text-sm text-[var(--red)] mb-4">{error.message}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[var(--grey)] border-b border-[var(--line)]">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {(companies || []).map((c) => (
              <tr key={c.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/office/companies/${c.id}`} className="hover:text-[var(--accent)]">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--grey)]">{c.contact_name || "—"}</td>
                <td className="px-4 py-3 text-[var(--grey)]">{c.phone || "—"}</td>
                <td className="px-4 py-3 text-[var(--grey)]">{c.email || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteCompany}>
                    <input type="hidden" name="id" value={c.id} />
                    <button
                      type="submit"
                      className="text-xs text-[var(--red)] hover:underline"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!companies || companies.length === 0) && !error && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--grey)]">
                  No companies yet — add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
