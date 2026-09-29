// Small shared building blocks that mirror the prototype's markup.
import { PILL } from "@/lib/types";

export function Pill({ status }: { status: string }) {
  const cls = PILL[status] || (status === "Paid" ? "p-paid" : status === "Unpaid" ? "p-unpaid" : "p-pending");
  return <span className={`pill ${cls}`}>{status}</span>;
}

export function PageHead({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: React.ReactNode;
  title: string;
  sub?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="serif">{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children}
    </div>
  );
}

export function Kpi({ lab, val, sub }: { lab: string; val: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="kpi">
      <div className="strip" />
      <div className="lab">{lab}</div>
      <div className="val">{val}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}

/** `.money-in` wrapper: an input with a "£" prefix. */
export function MoneyIn(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="money-in">
      <input type="number" step="0.01" min="0" {...props} />
    </div>
  );
}

export function EmptyRow({ cols, children }: { cols: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: "center", color: "var(--text-3)", padding: 26 }}>
        {children}
      </td>
    </tr>
  );
}
