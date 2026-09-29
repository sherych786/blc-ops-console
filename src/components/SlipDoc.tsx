// Salary slip document — mirrors the prototype's buildSlipHTML().
import { money, num, fmtDateShort } from "@/lib/format";

export type SlipRow = {
  date: string;
  shift: string;
  expenses: { label: string; amount: number }[];
  extraJobs: { label: string; amount: number }[];
  c: { w: number; extraH: number; base: number; extraPay: number; jobsT: number; exp: number; total: number };
};
export type SlipEmp = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  vehicle?: string | null;
  registration?: string | null;
  bank_name?: string | null;
  bank_account?: string | null;
  bank_sort_code?: string | null;
  basis?: string | null;
};
export type Slip = {
  id: string;
  slip_no: string;
  employee_id: string;
  period_from: string;
  period_to: string;
  status: string;
  employee: SlipEmp;
  rows: SlipRow[];
  adjustments: { label: string; amount: number }[];
};

export function slipTotals(m: Pick<Slip, "rows" | "adjustments">) {
  let base = 0,
    extra = 0,
    jobsT = 0,
    exp = 0;
  m.rows.forEach((r) => {
    base += r.c.base;
    extra += r.c.extraPay;
    jobsT += r.c.jobsT;
    exp += r.c.exp;
  });
  const adj = (m.adjustments || []).reduce((s, a) => s + num(a.amount), 0);
  return { base, extra, jobsT, exp, adj, net: base + extra + jobsT + exp + adj };
}

export function SlipDoc({ m }: { m: Slip }) {
  const t = slipTotals(m);
  const e = m.employee;
  const paid = m.status === "Paid";
  const expList = m.rows.flatMap((r) => (r.expenses || []).map((x) => ({ date: r.date, ...x })));
  const jobList = m.rows.flatMap((r) => (r.extraJobs || []).map((x) => ({ date: r.date, ...x })));
  const bank = e.bank_name || e.bank_account;

  return (
    <>
      {paid && <div className="paid-wm">PAID</div>}
      <div className="ih">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="ilogo" src="/blc-logo.png" alt="BLC" />
          <div className="from">Salary slip · Bespoke London Chauffeurs Ltd</div>
        </div>
        <div className="cta">accounts@myblc.co.uk</div>
      </div>
      <div className="inv-body">
        <div className="total-hero">
          <div className="tl">Net pay{paid ? " · PAID" : ""}</div>
          <div className="tv">{money(t.net)}</div>
        </div>
        <div className="parties">
          <div className="party">
            <div className="pl">Employer</div>
            <b>Bespoke London Chauffeurs Ltd</b>
            <address>28 Hedgemans Way, Dagenham<br />London, RM9 6DD, United Kingdom<br />Company No. 145 648 19</address>
          </div>
          <div className="party right">
            <div className="pl">Paid to</div>
            <b>{e.name}</b>
            <address>
              {e.phone && <>{e.phone}<br /></>}
              {e.email && <>{e.email}<br /></>}
              {e.address && <>{e.address}<br /></>}
              {e.vehicle || ""}
              {e.registration ? " · " + e.registration : ""}
              {bank && (
                <>
                  <br />
                  {e.bank_name || ""}
                  {e.bank_account ? " · " + e.bank_account : ""}
                  {e.bank_sort_code ? " · " + e.bank_sort_code : ""}
                </>
              )}
            </address>
          </div>
        </div>
        <div className="meta">
          <div>Slip number<b>{m.slip_no}</b></div>
          <div>Period<b>{fmtDateShort(m.period_from)} – {fmtDateShort(m.period_to)}</b></div>
          <div>Basis<b>{e.basis || "—"}</b></div>
        </div>
        <div className="slip-sec">
          <h4>1 · Daily wages with extra hours</h4>
          <table className="items">
            <thead><tr><th>Date</th><th>Hours</th><th>Base</th><th>Extra hrs</th><th>Wage</th></tr></thead>
            <tbody>
              {m.rows.map((r, i) => (
                <tr key={i}>
                  <td><b>{fmtDateShort(r.date)}</b><div className="r2">{r.shift}</div></td>
                  <td>
                    {r.c.w.toFixed(1)}h
                    {r.c.extraH > 0 && <span style={{ color: "#1b7fbf" }}> (+{r.c.extraH.toFixed(1)} extra)</span>}
                  </td>
                  <td className="money">{money(r.c.base)}</td>
                  <td className="money">{money(r.c.extraPay)}</td>
                  <td className="money">{money(r.c.base + r.c.extraPay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="slip-sec">
          <h4>2 · Expenses (reimbursed)</h4>
          <table className="items">
            <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {expList.length ? (
                expList.map((x, i) => (
                  <tr key={i}><td><b>{fmtDateShort(x.date)}</b></td><td>{x.label}</td><td className="money">{money(x.amount)}</td></tr>
                ))
              ) : (
                <tr><td colSpan={3} style={{ color: "#8a9097" }}>No expenses recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="slip-sec">
          <h4>3 · Extra jobs</h4>
          <table className="items">
            <thead><tr><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
            <tbody>
              {jobList.length ? (
                jobList.map((x, i) => (
                  <tr key={i}><td><b>{fmtDateShort(x.date)}</b></td><td>{x.label}</td><td className="money">{money(x.amount)}</td></tr>
                ))
              ) : (
                <tr><td colSpan={3} style={{ color: "#8a9097" }}>No extra jobs recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="totals">
          <div className="tr"><span>Wages (base + extra hours)</span><span>{money(t.base + t.extra)}</span></div>
          <div className="tr"><span>Expenses reimbursed</span><span>{money(t.exp)}</span></div>
          <div className="tr"><span>Extra jobs</span><span>{money(t.jobsT)}</span></div>
          {(m.adjustments || []).map((a, i) => (
            <div className="tr" key={i}><span>{a.label}</span><span>{money(a.amount)}</span></div>
          ))}
          <div className="tr grand"><span>Net pay</span><span>{money(t.net)}</span></div>
        </div>
      </div>
      <div className="if">
        <span>Phone: 02039181515</span>
        <span>Tel: +44 7535 185893</span>
        <a href="https://www.myblc.co.uk" target="_blank" rel="noopener">www.myblc.co.uk</a>
      </div>
    </>
  );
}

/** Excel rows — prototype slipDownload("xls"). */
export function slipXlsxRows(m: Slip) {
  const t = slipTotals(m);
  const rows: Record<string, unknown>[] = m.rows.map((r) => ({
    Date: r.date,
    Shift: r.shift,
    Hours: +r.c.w.toFixed(1),
    Base: r.c.base,
    "Extra hours": r.c.extraPay,
    "Extra jobs": r.c.jobsT,
    Expenses: r.c.exp,
    "Day total": r.c.total,
  }));
  rows.push({});
  (m.adjustments || []).forEach((a) => rows.push({ Date: a.label, "Day total": num(a.amount) }));
  rows.push({ Date: "Net pay", "Day total": t.net });
  return rows;
}
