import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteDriver } from "./actions";

export default async function ChauffeursPage() {
  const supabase = await createClient();
  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("id, name, phone, area, registration, fleet(class)")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Chauffeurs</h1>
        <Link
          href="/office/chauffeurs/new"
          className="control bg-[var(--accent)] text-white text-sm font-medium px-4 py-2"
        >
          + New Chauffeur
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
              <th className="px-4 py-3">Area</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody>
            {(drivers || []).map((d) => (
              <tr key={d.id} className="border-b border-[var(--line)] last:border-0">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/office/chauffeurs/${d.id}`} className="hover:text-[var(--accent)]">
                    {d.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[var(--grey)]">{d.phone || "—"}</td>
                <td className="px-4 py-3 text-[var(--grey)]">
                  {(d.fleet as unknown as { class: string } | null)?.class || "—"}
                </td>
                <td className="px-4 py-3 text-[var(--grey)]">{d.registration || "—"}</td>
                <td className="px-4 py-3 text-[var(--grey)]">{d.area || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteDriver}>
                    <input type="hidden" name="id" value={d.id} />
                    <button type="submit" className="text-xs text-[var(--red)] hover:underline">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!drivers || drivers.length === 0) && !error && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--grey)]">
                  No chauffeurs yet — add the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
