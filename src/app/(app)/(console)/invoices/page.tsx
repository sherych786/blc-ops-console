import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/ui";
import { InvoiceHistory } from "./InvoiceHistory";

export default async function InvoiceHistoryPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, invoice_no, client_name, issue_date, total, data")
    .order("created_at", { ascending: false })
    .limit(1000);
  return (
    <section>
      <PageHead eyebrow="Invoices" title="Invoice history" sub="Every invoice you have generated. Download again or reopen to edit." />
      {error && <p className="err">{error.message}</p>}
      <InvoiceHistory invoices={(data || []) as never} />
    </section>
  );
}
