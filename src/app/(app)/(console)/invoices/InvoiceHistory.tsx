"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { money, fmtDateShort } from "@/lib/format";
import { exportPdf, exportXlsx } from "@/lib/export";
import { useToast } from "@/components/Toast";
import { EmptyRow } from "@/components/ui";
import { InvoiceDoc, invoiceXlsxRows, type InvoiceMeta } from "@/components/InvoiceDoc";

type Inv = { id: string; invoice_no: string; client_name: string | null; issue_date: string; total: number; data: { meta?: InvoiceMeta } };

export function InvoiceHistory({ invoices }: { invoices: Inv[] }) {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<InvoiceMeta | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const list = invoices.filter((m) => !q || (m.invoice_no + " " + (m.client_name || "")).toLowerCase().includes(q.trim().toLowerCase()));
  const metaOf = (m: Inv): InvoiceMeta | null => (m.data?.meta ? { ...m.data.meta, invNo: m.invoice_no } : null);

  async function pdf(m: Inv) {
    const meta = metaOf(m);
    if (!meta) return toast("This invoice has no saved document");
    setStage(meta);
    toast("Building PDF…");
    await new Promise((r) => setTimeout(r, 80));
    try {
      if (stageRef.current) await exportPdf(stageRef.current, m.invoice_no + ".pdf");
      toast("Downloaded: " + m.invoice_no + ".pdf");
    } catch {
      toast("Could not build the PDF");
    }
    setStage(null);
  }

  async function xls(m: Inv) {
    const meta = metaOf(m);
    if (!meta) return toast("This invoice has no saved document");
    try {
      await exportXlsx(invoiceXlsxRows(meta), "Invoice", m.invoice_no + ".xlsx");
      toast("Downloaded: " + m.invoice_no + ".xlsx");
    } catch {
      toast("Could not export the invoice");
    }
  }

  return (
    <div className="card">
      <div className="card-h">
        <h3>Past invoices</h3>
        <div className="tools">
          <span className="search"><input className="field-mini" placeholder="Search number or company" value={q} onChange={(e) => setQ(e.target.value)} /></span>
        </div>
      </div>
      <div className="tbl-wrap">
        <table>
          <thead><tr><th>Invoice no.</th><th>Company</th><th>Issued</th><th>Lines</th><th>Total</th><th /></tr></thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id}>
                <td><span className="ref">{m.invoice_no}</span></td>
                <td>{m.client_name}</td>
                <td className="mono">{fmtDateShort(m.issue_date)}</td>
                <td className="mono">{m.data?.meta?.rows?.length ?? 0}</td>
                <td className="money">{money(m.total)}</td>
                <td>
                  <div className="rowacts">
                    <button className="btn xs" onClick={() => pdf(m)}>PDF</button>
                    <button className="btn xs" onClick={() => xls(m)}>Excel</button>
                    <Link className="btn xs" href={`/invoices/new?edit=${m.id}`}>Edit</Link>
                  </div>
                </td>
              </tr>
            ))}
            {!list.length && <EmptyRow cols={6}>No invoices yet.</EmptyRow>}
          </tbody>
        </table>
      </div>
      {stage && (
        <div id="exportStage">
          <div className="inv" style={{ width: 800 }} ref={stageRef}><InvoiceDoc m={stage} /></div>
        </div>
      )}
    </div>
  );
}
