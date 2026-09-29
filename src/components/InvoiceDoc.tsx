// The invoice document — mirrors the prototype's buildInvoiceHTML().
// Pure render: used for the live preview, history exports and PDFs.
import { money } from "@/lib/format";

export type InvRow = { c1: string; c1sub?: string; c2?: string; c2sub?: string; sub?: boolean; net: number };
export type InvIssuer = {
  id?: string;
  name: string;
  address?: string | null;
  vat_no?: string | null;
  company_no?: string | null;
  email?: string | null;
  bank_name?: string | null;
  account_holder?: string | null;
  account_no?: string | null;
  sort_code?: string | null;
  bic?: string | null;
  iban?: string | null;
  phone?: string | null;
  tel?: string | null;
  web?: string | null;
};
export type InvClient = { name: string; contact?: string | null; addr?: string | null; email?: string | null; phone?: string | null };
export type InvoiceMeta = {
  invNo: string;
  company: InvClient;
  issuer: InvIssuer;
  payLink: string;
  withVat: boolean;
  mode: "add" | "inc";
  rows: InvRow[];
  gross: number;
  discType: "pct" | "amt";
  discVal: number;
  discDesc: string;
  discAmt: number;
  subtotal: number;
  vat: number;
  total: number;
  issue: string;
  due: string;
};

const dfmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function InvoiceDoc({ m }: { m: InvoiceMeta }) {
  const is = m.issuer;
  const c = m.company;
  const bank = (
    [
      ["Bank name", is.bank_name],
      ["Account holder", is.account_holder],
      ["Account no.", is.account_no],
      ["Sort code", is.sort_code],
      ["BIC", is.bic],
      ["IBAN", is.iban],
    ] as [string, string | null | undefined][]
  ).filter((x) => x[1]);
  const lines = (s: string | null | undefined) =>
    (s || "").split("\n").map((l, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {l}
      </span>
    ));

  return (
    <>
      <div className="ih">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ilogo" src="/blc-logo.png" alt="BLC" />
          <div className="from">Invoice from {is.name}</div>
        </div>
        <div className="cta">{is.email || ""}</div>
      </div>
      <div className="inv-body">
        <div className="total-hero">
          <div className="tl">{m.withVat ? "Total due (inc VAT)" : "Total due"}</div>
          <div className="tv">{money(m.total)}</div>
        </div>
        <div className="parties">
          <div className="party">
            <div className="pl">From</div>
            <b>{is.name}</b>
            <address>
              {lines(is.address)}
              {is.vat_no && <><br />VAT No. {is.vat_no}</>}
              {is.company_no && <><br />Company No. {is.company_no}</>}
            </address>
          </div>
          <div className="party right">
            <div className="pl">Bill to</div>
            <b>{c.name}</b>
            <address>
              {c.contact && <>{c.contact}<br /></>}
              {c.addr || ""}
              {c.email && <><br />{c.email}</>}
              {c.phone && <><br />{c.phone}</>}
            </address>
          </div>
        </div>
        <div className="meta">
          <div>Invoice number<b>{m.invNo}</b></div>
          <div>Issue date<b>{dfmt(m.issue)}</b></div>
          <div>Due date<b>{dfmt(m.due)}</b></div>
        </div>
        <table className="items">
          <thead><tr><th>Item</th><th>Detail</th><th>Amount</th></tr></thead>
          <tbody>
            {m.rows.map((r, i) => (
              <tr key={i}>
                <td>
                  {r.sub && <span style={{ color: "#8a9097" }}>↳ </span>}
                  <b>{r.c1}</b>
                  {r.c1sub && <div className="r2">{r.c1sub}</div>}
                </td>
                <td>
                  {r.c2 || ""}
                  {r.c2sub && <div className="r2">{r.c2sub}</div>}
                </td>
                <td className="money">{money(r.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <div className="tr"><span>Sub-total{m.withVat && m.mode === "inc" ? " (net)" : ""}</span><span>{money(m.gross)}</span></div>
          {m.discAmt > 0 && (
            <div className="tr disc">
              <span>Discount{m.discDesc ? " (" + m.discDesc + ")" : ""}{m.discType === "pct" ? " " + m.discVal + "%" : ""}</span>
              <span>−{money(m.discAmt)}</span>
            </div>
          )}
          {m.withVat && <div className="tr"><span>VAT (20%)</span><span>{money(m.vat)}</span></div>}
          <div className="tr grand"><span>Total due</span><span>{money(m.total)}</span></div>
        </div>
        {!m.withVat ? (
          <div className="note">This is a non-VAT invoice.</div>
        ) : m.mode === "inc" ? (
          <div className="note">Prices are VAT inclusive. Amounts shown net of VAT.</div>
        ) : null}
        <div className="pay">
          <h4>Payment details</h4>
          {m.payLink && (
            <div style={{ background: "#e9f4fb", border: "1px solid #cde6f6", borderRadius: 8, padding: "10px 12px", marginBottom: 10, fontSize: 12.5 }}>
              <b style={{ color: "#1b7fbf" }}>Pay online:</b>{" "}
              <a href={m.payLink} target="_blank" rel="noopener">{m.payLink}</a>
            </div>
          )}
          <div className="pg">
            {bank.map(([k, v]) => (
              <div key={k}>{k}<b>{v}</b></div>
            ))}
          </div>
        </div>
      </div>
      <div className="if">
        <span>{is.phone ? "Phone: " + is.phone : ""}</span>
        <span>{is.tel ? "Tel: " + is.tel : ""}</span>
        {is.web ? <a href={"https://" + is.web.replace(/^https?:\/\//, "")} target="_blank" rel="noopener">{is.web}</a> : <span />}
      </div>
    </>
  );
}

/** Excel rows — prototype exportInvoiceExcel(). */
export function invoiceXlsxRows(m: InvoiceMeta) {
  const rows: Record<string, unknown>[] = m.rows.map((r) => ({ Item: r.c1, Detail: r.c2 || r.c1sub, Amount: r.net }));
  rows.push({});
  rows.push({ Item: "Sub-total", Amount: m.gross });
  if (m.discAmt) rows.push({ Item: "Discount" + (m.discDesc ? " (" + m.discDesc + ")" : ""), Amount: -m.discAmt });
  if (m.withVat) rows.push({ Item: "VAT (20%)", Amount: m.vat });
  rows.push({ Item: "Total due", Amount: m.total });
  return rows;
}
