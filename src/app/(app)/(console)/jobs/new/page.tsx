import { createClient } from "@/lib/supabase/server";
import { JOB_SELECT, toJob } from "@/lib/jobs";
import { todayISO } from "@/lib/format";
import { JobForm } from "./JobForm";

/** New job (and edit, via ?edit=<id>; confirmation via ?done=<id>). */
export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ edit?: string; done?: string }> }) {
  const { edit, done } = await searchParams;
  const supabase = await createClient();
  const [companies, fleet, drivers, editRow, doneRow] = await Promise.all([
    supabase.from("companies").select("id, name, contact_name, email").order("name"),
    supabase.from("fleet").select("id, class").order("created_at"),
    supabase.from("drivers").select("id, name, phone, registration, fleet(class)").order("name"),
    edit ? supabase.from("jobs").select(JOB_SELECT).eq("id", edit).maybeSingle() : Promise.resolve({ data: null }),
    done ? supabase.from("jobs").select(JOB_SELECT).eq("id", done).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const drv = (drivers.data || []).map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    registration: d.registration,
    vehicle: (d.fleet as unknown as { class: string } | null)?.class || "",
  }));

  return (
    <JobForm
      key={(edit || "new") + (done || "")}
      today={todayISO()}
      companies={companies.data || []}
      fleet={(fleet.data || []).map((f) => f.class)}
      drivers={drv}
      editing={editRow.data ? toJob(editRow.data as never) : null}
      done={doneRow.data ? toJob(doneRow.data as never) : null}
      doneCompanyEmail={(companies.data || []).find((c) => c.id === (doneRow.data as { company_id?: string } | null)?.company_id)?.email || ""}
    />
  );
}
