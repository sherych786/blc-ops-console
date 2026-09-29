import { createClient } from "@/lib/supabase/server";
import { todayISO } from "@/lib/format";
import { InvoiceBuilder } from "./InvoiceBuilder";

/** Create invoice (and re-open one via ?edit=<id>). */
export default async function CreateInvoicePage({ searchParams }: { searchParams: Promise<{ edit?: string; n?: string }> }) {
  const { edit, n } = await searchParams;
  const supabase = await createClient();
  const [companies, issuers, jobs, editing] = await Promise.all([
    supabase.from("companies").select("id, name, contact_name, email, phone, address").order("name"),
    supabase.from("issuers").select("*").order("created_at"),
    supabase
      .from("jobs")
      .select("id, ref, company_id, service_type, pickup_location, dropoff_location, pickup_date, status, company_price, pax_name")
      .neq("status", "Cancelled")
      .order("pickup_date", { ascending: false })
      .limit(3000),
    edit ? supabase.from("invoices").select("id, invoice_no, data").eq("id", edit).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return (
    <InvoiceBuilder
      key={edit || n || "new"}
      today={todayISO()}
      due={todayISO(7)}
      companies={companies.data || []}
      issuers={issuers.data || []}
      jobs={(jobs.data || []).map((j) => ({ ...j, company_price: Number(j.company_price) }))}
      editing={editing.data || null}
    />
  );
}
