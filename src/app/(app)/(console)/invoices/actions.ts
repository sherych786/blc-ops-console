"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceMeta } from "@/components/InvoiceDoc";

/** Everything needed to re-open the builder exactly as it was. */
export type InvoiceState = {
  invMode: "jobs" | "custom";
  companyId: string | null;
  customCo: string;
  manual: { name: string; addr: string; email: string; phone: string };
  jobIds: string[];
  jobExtras: Record<string, { label: string; amount: number }[]>;
  customLines: { c1: string; c1sub: string; c2: string; amount: number; extras: { label: string; amount: number }[] }[];
  lineItems: { label: string; amount: number }[];
  issuerId: string;
};

/**
 * Create (or, when editing, update) an invoice. The invoice number is
 * issued by the database (INV-YYYY-####); editing keeps the original.
 */
export async function saveInvoice(id: string | null, meta: Omit<InvoiceMeta, "invNo">, state: InvoiceState) {
  const supabase = await createClient();
  const row = {
    issuer_id: state.issuerId || null,
    company_id: state.invMode === "jobs" ? state.companyId : state.customCo && state.customCo !== "__manual" ? state.customCo : null,
    mode: state.invMode === "jobs" ? "from_jobs" : "custom",
    vat_mode: meta.withVat ? meta.mode : "none",
    discount_desc: meta.discDesc || null,
    discount_type: meta.discType,
    discount_value: meta.discVal || 0,
    subtotal: Math.round(meta.subtotal * 100) / 100,
    vat: Math.round(meta.vat * 100) / 100,
    total: Math.round(meta.total * 100) / 100,
    payment_link: meta.payLink || null,
    client_name: meta.company.name,
    issue_date: meta.issue,
    due_date: meta.due,
    data: { meta, state },
  };
  const res = id
    ? await supabase.from("invoices").update(row).eq("id", id).select("id, invoice_no").single()
    : await supabase.from("invoices").insert(row).select("id, invoice_no").single();
  if (res.error) return { error: res.error.message };
  revalidatePath("/", "layout");
  return { id: res.data.id as string, invNo: res.data.invoice_no as string };
}

export async function saveIssuer(id: string | null, d: Record<string, string>) {
  const name = (d.name || "").trim();
  if (!name) return { error: "Company name is required." };
  const keys = ["email", "address", "vat_no", "company_no", "bank_name", "account_holder", "account_no", "sort_code", "bic", "iban", "phone", "tel", "web"];
  const row: Record<string, string | null> = { name };
  keys.forEach((k) => (row[k] = (d[k] || "").trim() || null));
  const supabase = await createClient();
  const res = id
    ? await supabase.from("issuers").update(row).eq("id", id).select("id").single()
    : await supabase.from("issuers").insert(row).select("id").single();
  if (res.error) return { error: res.error.message };
  revalidatePath("/", "layout");
  return { id: res.data.id as string };
}
