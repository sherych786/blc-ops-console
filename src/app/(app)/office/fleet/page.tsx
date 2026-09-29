import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteFleet } from "./actions";

export default async function FleetPage() {
  const supabase = await createClient();
  const { data: fleet, error } = await supabase
    .from("fleet")
    .select("id, class, registration, pax, luggage, profile_pic_url")
    .order("class");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Fleet</h1>
        <Link
          href="/office/fleet/new"
          className="control bg-[var(--accent)] text-white text-sm font-medium px-4 py-2"
        >
          + New Vehicle
        </Link>
      </div>

      {error && <p className="text-sm text-[var(--red)] mb-4">{error.message}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(fleet || []).map((f) => (
          <div key={f.id} className="card overflow-hidden">
            <div className="h-36 bg-[var(--surface)] flex items-center justify-center">
              {f.profile_pic_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.profile_pic_url} alt={f.class} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-[var(--grey)]">No photo</span>
              )}
            </div>
            <div className="p-4">
              <div className="font-medium">{f.class}</div>
              <div className="text-xs text-[var(--grey)] mb-2">
                {f.registration || "No registration"} · {f.pax ?? "—"} pax · {f.luggage ?? "—"} luggage
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Link href={`/office/fleet/${f.id}`} className="text-[var(--accent)] hover:underline">
                  Edit
                </Link>
                <Link href={`/fleet/${f.id}`} className="text-[var(--accent)] hover:underline" target="_blank">
                  Share link
                </Link>
                <form action={deleteFleet}>
                  <input type="hidden" name="id" value={f.id} />
                  <button type="submit" className="text-[var(--red)] hover:underline">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(!fleet || fleet.length === 0) && !error && (
          <div className="card p-8 text-center text-[var(--grey)] col-span-full">
            No vehicles yet — add the first one.
          </div>
        )}
      </div>
    </div>
  );
}
