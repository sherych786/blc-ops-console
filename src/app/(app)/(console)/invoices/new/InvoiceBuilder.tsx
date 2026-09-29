"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Company, Issuer } from "@/lib/types";
import { money, num, fmtDateShort } from "@/lib/format";
import { exportPdf, exportXlsx } from "@/lib/export";
import { useToast } from "@/components/Toast";
import { PageHead, MoneyIn } from "@/components/ui";
import { InvoiceDoc, invoiceXlsxRows, type InvoiceMeta, type InvRow, type InvIssuer } from "@/components/InvoiceDoc";
import { saveInvoice, saveIssuer, type InvoiceState } from "../actions";

type PickJob = {
  id: string;
  ref: string;
  company_id: string | null;
  service_type: string;
  pickup_location: string | null;
  dropoff_location: string | null;
  pickup_date: string;
  status: string;
  company_price: number;
  pax_name: string | null;
};
type Extra = { label: string; amount: number };
type CLine = InvoiceState["customLines"][number];

const ISSUER_FIELDS: [string, string, boolean?][] = [
  ["name", "Company name", true],
  ["email", "Email"],
  ["address", "Address"],
  ["vat_no", "VAT No."],
  ["company_no", "Company No."],
  ["bank_name", "Bank name"],
  ["account_holder", "Account holder"],
  ["account_no", "Account no."],
  ["sort_code", "Sort code"],
  ["bic", "BIC"],
  ["iban", "IBAN"],
  ["phone", "Footer phone"],
  ["tel", "Footer tel"],
  ["web", "Website"],
];

export function InvoiceBuilder({
  today,
  due,
  companies,
  issuers,
  jobs,
  editing,
}: {
  today: string;
  due: string;
  companies: Company[];
  issuers: Issuer[];
  jobs: PickJob[];
  editing: { id: string; invoice_no: string; data: { meta?: InvoiceMeta; state?: InvoiceState } } | null;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const st = editing?.data?.state;
  const em = editing?.data?.meta;

  const [invMode, setInvMode] = useState<"jobs" | "custom">(st?.invMode || "jobs");
  const [withVat, setWithVat] = useState(em ? em.withVat : true);
  const [vatMode, setVatMode] = useState<"add" | "inc">(em?.mode || "add");
  const defaultIssuer = issuers.find((i) => i.is_default)?.id || issuers[0]?.id || "";
  const [issuerId, setIssuerId] = useState(st?.issuerId || defaultIssuer);
  const [payLink, setPayLink] = useState(em?.payLink || "");
  const [discDesc, setDiscDesc] = useState(em?.discDesc || "");
  const [discType, setDiscType] = useState<"pct" | "amt">(em?.discType || "pct");
  const [discVal, setDiscVal] = useState(em?.discVal ? String(em.discVal) : "");

  // Issuer form
  const [issuerForm, setIssuerForm] = useState<null | { id: string | null; vals: Record<string, string> }>(null);

  // From jobs. "__direct" = jobs booked with no company ("Direct client").
  const DIRECT = "__direct";
  const coKey = (id: string | null) => id || DIRECT;
  const jobCount = useMemo(() => {
    const m: Record<string, number> = {};
    jobs.forEach((j) => (m[coKey(j.company_id)] = (m[coKey(j.company_id)] || 0) + 1));
    return m;
  }, [jobs]);
  // Open on a company that actually has jobs (the list used to start on
  // the first company alphabetically and look empty).
  const plural = (n: number) => `${n} job${n === 1 ? "" : "s"}`;
  const firstWithJobs = companies.find((c) => jobCount[c.id])?.id || (jobCount[DIRECT] ? DIRECT : companies[0]?.id || DIRECT);
  const [coId, setCoId] = useState(st ? st.companyId || (st.jobIds?.length ? DIRECT : firstWithJobs) : firstWithJobs);
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set(st?.jobIds || []));
  const [jobExtras, setJobExtras] = useState<Record<string, Extra[]>>(st?.jobExtras || {});
  const [jxDraft, setJxDraft] = useState<Record<string, { label: string; amount: string }>>({});

  // Custom
  const [customCo, setCustomCo] = useState(st?.customCo || companies[0]?.id || "__manual");
  const [manual, setManual] = useState(st?.manual || { name: "", addr: "", email: "", phone: "" });
  const [cl, setCl] = useState({ type: "One-Way Transfer", date: "", from: "", to: "", hours: "", rate: "", start: "", end: "", amount: "" });
  const [clExps, setClExps] = useState<Extra[]>([]);
  const [clExpDraft, setClExpDraft] = useState({ label: "", amount: "" });
  const [customLines, setCustomLines] = useState<CLine[]>(st?.customLines || []);

  // Extra charges (both modes)
  const [lineItems, setLineItems] = useState<Extra[]>(st?.lineItems || []);
  const [liDraft, setLiDraft] = useState({ label: "", amount: "" });

  // Output
  const [savedId, setSavedId] = useState<string | null>(editing?.id || null);
  const [out, setOut] = useState<InvoiceMeta | null>(editing && em ? { ...em, invNo: editing.invoice_no } : null);
  const docRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  const eligible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => coKey(j.company_id) === coId && (!q || j.ref.toLowerCase().includes(q)));
  }, [jobs, coId, search]);
  const chosen = jobs.filter((j) => sel.has(j.id) && coKey(j.company_id) === coId);

  const clAir = cl.type.startsWith("Airport") || cl.type.startsWith("One");
  const clHr = cl.type.startsWith("Hourly");
  const clHint = clHr && num(cl.hours) && num(cl.rate) ? `${num(cl.hours)}h × ${money(cl.rate)} = ${money(num(cl.hours) * num(cl.rate))}` : "";

  function setClField(k: keyof typeof cl, v: string) {
    const next = { ...cl, [k]: v };
    // clFields(): hourly lines auto-fill amount = hours × rate
    if (next.type.startsWith("Hourly") && (k === "hours" || k === "rate") && num(next.hours) && num(next.rate)) {
      next.amount = (num(next.hours) * num(next.rate)).toFixed(2);
    }
    setCl(next);
  }

  function addClExp() {
    if (!clExpDraft.label.trim()) return toast("Enter an expense description");
    setClExps([...clExps, { label: clExpDraft.label.trim(), amount: num(clExpDraft.amount) }]);
    setClExpDraft({ label: "", amount: "" });
  }

  function addCustomLine() {
    const amt = num(cl.amount);
    if (!amt) return toast("Enter an amount");
    const date = cl.date ? fmtDateShort(cl.date) : "";
    let c2 = "";
    if (clHr) {
      const bits: string[] = [];
      if (num(cl.hours)) bits.push(num(cl.hours) + "h" + (num(cl.rate) ? " × " + money(cl.rate) : ""));
      if (cl.start && cl.end) bits.push(cl.start + "–" + cl.end);
      if (date) bits.push(date);
      c2 = bits.join(" · ");
    } else if (clAir) {
      c2 = ((cl.from || "") + " to " + (cl.to || "")).trim();
      if (date) c2 += (c2 ? " · " : "") + date;
    } else c2 = date;
    setCustomLines([...customLines, { c1: cl.type, c1sub: cl.type, c2, amount: amt, extras: clExps.slice() }]);
    setClExps([]);
    setCl({ ...cl, from: "", to: "", hours: "", rate: "", start: "", end: "", amount: "" });
    toast("Invoice line added");
  }

  function addLineItem() {
    if (!liDraft.label.trim()) return toast("Enter a description");
    setLineItems([...lineItems, { label: liDraft.label.trim(), amount: num(liDraft.amount) }]);
    setLiDraft({ label: "", amount: "" });
  }

  function addJobExtra(jobId: string) {
    const d = jxDraft[jobId] || { label: "", amount: "" };
    if (!d.label.trim()) return toast("Enter a description");
    setJobExtras({ ...jobExtras, [jobId]: [...(jobExtras[jobId] || []), { label: d.label.trim(), amount: num(d.amount) }] });
    setJxDraft({ ...jxDraft, [jobId]: { label: "", amount: "" } });
  }

  /** The prototype's genInvoice(), then persisted to the database. */
  function generate() {
    const itemNet = (g: number) => (withVat && vatMode === "inc" ? g / 1.2 : g);
    const iss = issuers.find((x) => x.id === issuerId) || issuers[0];
    if (!iss) return toast("Add an issuer profile first");
    const issuer: InvIssuer = { ...iss };
    const rows: InvRow[] = [];
    let company;
    if (invMode === "jobs") {
      const c = companies.find((x) => x.id === coId);
      company = { name: c?.name || "Direct client", contact: c?.contact_name, addr: c?.address, email: c?.email, phone: c?.phone };
      chosen.forEach((j) => {
        rows.push({ c1: j.ref, c1sub: fmtDateShort(j.pickup_date) + " · " + j.service_type, c2: (j.pickup_location || "") + " to " + (j.dropoff_location || ""), c2sub: j.pax_name || "", net: itemNet(num(j.company_price)) });
        (jobExtras[j.id] || []).forEach((x) => rows.push({ c1: x.label, c2: "Extra on " + j.ref, sub: true, net: itemNet(num(x.amount)) }));
      });
      if (!rows.length && !lineItems.length) return toast("Select at least one job or add a line");
    } else {
      if (customCo === "__manual") {
        if (!manual.name.trim()) return toast("Enter the client name");
        company = { name: manual.name.trim(), contact: "", addr: manual.addr, email: manual.email, phone: manual.phone };
      } else {
        const c = companies.find((x) => x.id === customCo);
        company = { name: c?.name || "Direct client", contact: c?.contact_name, addr: c?.address, email: c?.email, phone: c?.phone };
      }
      customLines.forEach((l) => {
        rows.push({ c1: l.c1, c1sub: l.c1sub, c2: l.c2, net: itemNet(num(l.amount)) });
        (l.extras || []).forEach((x) => rows.push({ c1: x.label, c2: "Additional expense", sub: true, net: itemNet(num(x.amount)) }));
      });
      if (!customLines.length && !lineItems.length) return toast("Add at least one invoice line");
    }
    lineItems.forEach((li) => rows.push({ c1: li.label, c1sub: "", c2: "", c2sub: "", net: itemNet(num(li.amount)) }));
    const gross = rows.reduce((s, r) => s + r.net, 0);
    const dv = num(discVal);
    const discAmt = dv > 0 ? (discType === "pct" ? gross * (dv / 100) : Math.min(dv, gross)) : 0;
    const subtotal = gross - discAmt;
    const vat = withVat ? subtotal * 0.2 : 0;
    const meta: Omit<InvoiceMeta, "invNo"> = {
      company,
      issuer,
      payLink: payLink.trim(),
      withVat,
      mode: vatMode,
      rows,
      gross,
      discType,
      discVal: dv,
      discDesc: discDesc.trim(),
      discAmt,
      subtotal,
      vat,
      total: subtotal + vat,
      issue: em?.issue || today,
      due: em?.due || due,
    };
    const state: InvoiceState = {
      invMode,
      companyId: invMode === "jobs" && coId !== DIRECT ? coId : null,
      customCo,
      manual,
      jobIds: invMode === "jobs" ? chosen.map((j) => j.id) : [],
      jobExtras,
      customLines,
      lineItems,
      issuerId: iss.id,
    };
    start(async () => {
      const r = await saveInvoice(savedId, meta, state);
      if (r.error) return toast(r.error);
      setSavedId(r.id!);
      setOut({ ...meta, invNo: r.invNo! });
      toast("Invoice " + r.invNo + " ready");
      setTimeout(() => outRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    });
  }

  const router = useRouter();
  function newInvoice() {
    router.push(`/invoices/new?n=${Date.now()}`);
  }

  function openIssuer(id: string | null) {
    const is = id ? issuers.find((x) => x.id === id) : null;
    const vals: Record<string, string> = {};
    ISSUER_FIELDS.forEach(([k]) => (vals[k] = is ? String((is as Record<string, unknown>)[k] ?? "") : ""));
    setIssuerForm({ id, vals });
  }

  function submitIssuer(e: React.FormEvent) {
    e.preventDefault();
    if (!issuerForm) return;
    start(async () => {
      const r = await saveIssuer(issuerForm.id, issuerForm.vals);
      if (r.error) return toast(r.error);
      toast(issuerForm.id ? "Issuer updated" : "Issuer added");
      setIssuerId(r.id!);
      setIssuerForm(null);
    });
  }

  const entry = (label: React.ReactNode, amount: number, onDel: () => void, style?: React.CSSProperties, key?: string | number) => (
    <div className="entry-item" style={style} key={key}>
      <span>{label}</span>
      <span className="ei-amt">{money(amount)}</span>
      <button className="ei-x" onClick={onDel} aria-label="Remove">✕</button>
    </div>
  );

  return (
    <section>
      <PageHead
        eyebrow="Invoices"
        title={editing ? "Edit invoice " + editing.invoice_no : "Create invoice"}
        sub="Invoice from completed jobs, or build a fully custom invoice line by line. Add extra charges and choose whether to apply VAT."
      />
      <div className="stack">
        <div className="card">
          <div className="card-h">
            <div className="seg">
              <button className={invMode === "jobs" ? "on" : ""} onClick={() => setInvMode("jobs")}>From jobs</button>
              <button className={invMode === "custom" ? "on" : ""} onClick={() => setInvMode("custom")}>Custom invoice</button>
            </div>
            <div className="tools">
              <label className="chk" style={{ padding: "6px 10px" }}>
                <input type="checkbox" checked={withVat} onChange={(e) => setWithVat(e.target.checked)} /> Tax invoice (20% VAT)
              </label>
              {withVat && (
                <select className="field-mini" value={vatMode} onChange={(e) => setVatMode(e.target.value as "add" | "inc")}>
                  <option value="add">Add 20% on top</option>
                  <option value="inc">Adjust within amount (VAT included)</option>
                </select>
              )}
              <button className="btn sm primary" onClick={generate} disabled={pending}>Generate invoice</button>
            </div>
          </div>
          <div className="form-grid" style={{ paddingBottom: 6 }}>
            <div className="fg">
              <label>Invoice from (issuer)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select style={{ flex: 1 }} value={issuerId} onChange={(e) => setIssuerId(e.target.value)}>
                  {issuers.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
                <button type="button" className="btn sm" onClick={() => openIssuer(null)}>＋ New</button>
                <button type="button" className="btn sm" onClick={() => issuerId && openIssuer(issuerId)}>Edit</button>
              </div>
            </div>
            <div className="fg">
              <label>Payment link (optional)</label>
              <input placeholder="https://pay.myblc.co.uk/inv123" value={payLink} onChange={(e) => setPayLink(e.target.value)} />
              <span className="hint">Shown above the bank details when set.</span>
            </div>
            <div className="fg full">
              <label>Discount (optional, only applied if a value is set)</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input placeholder="Description e.g. Loyalty discount" style={{ flex: 1, minWidth: 160 }} value={discDesc} onChange={(e) => setDiscDesc(e.target.value)} />
                <select className="field-mini" value={discType} onChange={(e) => setDiscType(e.target.value as "pct" | "amt")}>
                  <option value="pct">Percentage %</option>
                  <option value="amt">Amount £</option>
                </select>
                <input type="number" step="0.01" min="0" placeholder="0" style={{ width: 120 }} value={discVal} onChange={(e) => setDiscVal(e.target.value)} />
              </div>
            </div>
          </div>

          {issuerForm && (
            <form style={{ borderTop: "1px solid var(--border)" }} onSubmit={submitIssuer}>
              <div className="form-grid">
                <div className="subhead">{issuerForm.id ? "Edit issuer profile" : "New issuer profile"}</div>
                {ISSUER_FIELDS.map(([k, label, req]) => (
                  <div className={`fg${k === "address" ? " full" : ""}`} key={k}>
                    <label>{label} {req && <span className="req">*</span>}</label>
                    {k === "address" ? (
                      <textarea value={issuerForm.vals[k]} onChange={(e) => setIssuerForm({ ...issuerForm, vals: { ...issuerForm.vals, [k]: e.target.value } })} />
                    ) : (
                      <input required={req} value={issuerForm.vals[k]} onChange={(e) => setIssuerForm({ ...issuerForm, vals: { ...issuerForm.vals, [k]: e.target.value } })} />
                    )}
                  </div>
                ))}
              </div>
              <div className="form-foot">
                <span className="spacer" />
                <button type="button" className="btn ghost" onClick={() => setIssuerForm(null)}>Cancel</button>
                <button type="submit" className="btn primary" disabled={pending}>Save issuer</button>
              </div>
            </form>
          )}

          {invMode === "jobs" ? (
            <div>
              <div className="card-h" style={{ borderTop: 0 }}>
                <h3 style={{ fontSize: 13 }}>Select company and jobs</h3>
                <div className="tools">
                  <select className="field-mini" value={coId} onChange={(e) => { setCoId(e.target.value); setSel(new Set()); }}>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({plural(jobCount[c.id] || 0)})</option>
                    ))}
                    <option value={DIRECT}>Direct client, no company ({plural(jobCount[DIRECT] || 0)})</option>
                  </select>
                  <span className="search"><input className="field-mini" placeholder="Search job ref" value={search} onChange={(e) => setSearch(e.target.value)} /></span>
                </div>
              </div>
              <div className="picklist">
                {eligible.map((j) => (
                  <label className="pick-row" key={j.id}>
                    <input
                      type="checkbox"
                      checked={sel.has(j.id)}
                      onChange={(e) => {
                        const s = new Set(sel);
                        if (e.target.checked) s.add(j.id);
                        else s.delete(j.id);
                        setSel(s);
                      }}
                    />
                    <span className="pr-ref">{j.ref}</span>
                    <span className="pr-rt">
                      {(j.pickup_location || "").split(",")[0]} to {(j.dropoff_location || "").split(",")[0]}
                      <br />
                      <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{fmtDateShort(j.pickup_date)} · {j.status}</span>
                    </span>
                    <span className="pr-amt">{money(j.company_price)}</span>
                  </label>
                ))}
                {!eligible.length && (
                  <div className="inv-empty">
                    {jobs.length
                      ? "No jobs for this company match. Pick another company or clear the search."
                      : "No jobs to invoice yet. Jobs appear here once they are created (cancelled jobs are left out)."}
                  </div>
                )}
              </div>
              {chosen.length > 0 && (
                <div>
                  <div className="card-h" style={{ borderTop: "1px solid var(--border)" }}><h3 style={{ fontSize: 13 }}>Per-job additional charges (＋ Add line)</h3></div>
                  {chosen.map((j) => {
                    const d = jxDraft[j.id] || { label: "", amount: "" };
                    return (
                      <div key={j.id} style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ fontWeight: 700, fontSize: 12.5, color: "var(--accent)", marginBottom: 6 }}>{j.ref}</div>
                        {(jobExtras[j.id] || []).map((x, i) =>
                          entry(x.label, x.amount, () => setJobExtras({ ...jobExtras, [j.id]: jobExtras[j.id].filter((_, k) => k !== i) }), { marginBottom: 6 }, i)
                        )}
                        <div className="rowline">
                          <input placeholder="e.g. Extra 30 min waiting" value={d.label} onChange={(e) => setJxDraft({ ...jxDraft, [j.id]: { ...d, label: e.target.value } })} />
                          <MoneyIn placeholder="0.00" value={d.amount} onChange={(e) => setJxDraft({ ...jxDraft, [j.id]: { ...d, amount: e.target.value } })} />
                        </div>
                        <button className="btn xs" onClick={() => addJobExtra(j.id)}>＋ Add line to {j.ref}</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="form-grid" style={{ paddingBottom: 0 }}>
                <div className="fg">
                  <label>Bill to</label>
                  <select value={customCo} onChange={(e) => setCustomCo(e.target.value)}>
                    {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value="__manual">— New client (enter manually) —</option>
                  </select>
                </div>
                {customCo === "__manual" && (
                  <>
                    <div className="fg"><label>Client name <span className="req">*</span></label><input placeholder="Client name" value={manual.name} onChange={(e) => setManual({ ...manual, name: e.target.value })} /></div>
                    <div className="fg full"><label>Client address</label><input placeholder="Address" value={manual.addr} onChange={(e) => setManual({ ...manual, addr: e.target.value })} /></div>
                    <div className="fg"><label>Client email</label><input placeholder="email@client.com" value={manual.email} onChange={(e) => setManual({ ...manual, email: e.target.value })} /></div>
                    <div className="fg"><label>Client phone</label><input placeholder="+44 …" value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} /></div>
                  </>
                )}
              </div>
              <div className="card-h" style={{ borderTop: "1px solid var(--border)" }}><h3 style={{ fontSize: 13 }}>Add invoice line</h3></div>
              <div className="form-grid" style={{ paddingTop: 12, paddingBottom: 12 }}>
                <div className="fg">
                  <label>Service type</label>
                  <select value={cl.type} onChange={(e) => setClField("type", e.target.value)}>
                    <option>One-Way Transfer</option>
                    <option>Airport Transfer</option>
                    <option>Hourly / As Directed</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="fg"><label>Date</label><input type="date" value={cl.date} onChange={(e) => setClField("date", e.target.value)} /></div>
                <div className="fg" hidden={!clAir}><label>From</label><input placeholder="Pick-up" value={cl.from} onChange={(e) => setClField("from", e.target.value)} /></div>
                <div className="fg" hidden={!clAir}><label>To</label><input placeholder="Drop-off" value={cl.to} onChange={(e) => setClField("to", e.target.value)} /></div>
                <div className="fg" hidden={!clHr}><label>Hours</label><input type="number" step="0.5" placeholder="4" value={cl.hours} onChange={(e) => setClField("hours", e.target.value)} /></div>
                <div className="fg" hidden={!clHr}><label>Per hour rate</label><MoneyIn placeholder="55.00" value={cl.rate} onChange={(e) => setClField("rate", e.target.value)} /></div>
                <div className="fg" hidden={!clHr}><label>Start time (optional)</label><input type="time" value={cl.start} onChange={(e) => setClField("start", e.target.value)} /></div>
                <div className="fg" hidden={!clHr}><label>End time (optional)</label><input type="time" value={cl.end} onChange={(e) => setClField("end", e.target.value)} /></div>
                <div className="fg">
                  <label>Amount <span className="req">*</span></label>
                  <MoneyIn placeholder="0.00" value={cl.amount} onChange={(e) => setClField("amount", e.target.value)} />
                  <span className="hint">{clHint}</span>
                </div>
                <div className="fg full">
                  <label>Additional expense for this job (optional)</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input placeholder="e.g. Car Park" style={{ flex: 1 }} value={clExpDraft.label} onChange={(e) => setClExpDraft({ ...clExpDraft, label: e.target.value })} />
                    <div className="money-in" style={{ width: 110 }}>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={clExpDraft.amount}
                        onChange={(e) => setClExpDraft({ ...clExpDraft, amount: e.target.value })}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addClExp(); } }}
                      />
                    </div>
                    <button type="button" className="btn sm" onClick={addClExp}>Add</button>
                  </div>
                  <div className="entry-list" style={{ marginTop: 8 }}>
                    {clExps.map((x, i) => entry(x.label, x.amount, () => setClExps(clExps.filter((_, k) => k !== i)), undefined, i))}
                  </div>
                </div>
                <div className="fg full"><button type="button" className="btn sm primary" onClick={addCustomLine}>＋ Add Invoice Line</button></div>
              </div>
              <div>
                {customLines.map((l, i) =>
                  entry(
                    <>
                      <b>{l.c1}</b>
                      {l.c2 ? " · " + l.c2 : ""}
                      {l.extras?.length > 0 && (
                        <>
                          <br />
                          <span style={{ color: "var(--text-3)", fontSize: 11.5 }}>{l.extras.map((x) => x.label + " " + money(x.amount)).join(", ")}</span>
                        </>
                      )}
                    </>,
                    l.amount + (l.extras || []).reduce((s, x) => s + num(x.amount), 0),
                    () => setCustomLines(customLines.filter((_, k) => k !== i)),
                    { margin: "0 14px 8px", flexWrap: "wrap" },
                    i
                  )
                )}
              </div>
            </div>
          )}

          <div className="card-h" style={{ borderTop: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: 13 }}>{invMode === "custom" ? "Additional extra charges (optional)" : "Extra charges (extra hours, tip, waiting …)"}</h3>
          </div>
          <div className="lineitem-add">
            <input placeholder="Description e.g. Extra 2 hours" value={liDraft.label} onChange={(e) => setLiDraft({ ...liDraft, label: e.target.value })} />
            <MoneyIn placeholder="0.00" value={liDraft.amount} onChange={(e) => setLiDraft({ ...liDraft, amount: e.target.value })} />
            <button className="btn sm" type="button" onClick={addLineItem}>＋ Add line</button>
          </div>
          <div>{lineItems.map((x, i) => entry(x.label, x.amount, () => setLineItems(lineItems.filter((_, k) => k !== i)), { margin: "0 14px 8px" }, i))}</div>
        </div>

        {out && (
          <div ref={outRef}>
            <div className="card-h" style={{ border: 0, padding: "0 0 12px" }}>
              <h3>Invoice preview</h3>
              <div className="tools">
                <button className="btn sm ghost" onClick={newInvoice}>Start a new invoice</button>
                <button
                  className="btn sm"
                  onClick={async () => {
                    try {
                      await exportXlsx(invoiceXlsxRows(out), "Invoice", out.invNo + ".xlsx");
                      toast("Downloaded: " + out.invNo + ".xlsx");
                    } catch {
                      toast("Could not export the invoice");
                    }
                  }}
                >
                  Export Excel
                </button>
                <button
                  className="btn sm primary"
                  onClick={async () => {
                    if (!docRef.current) return;
                    toast("Building PDF…");
                    try {
                      await exportPdf(docRef.current, out.invNo + ".pdf");
                      toast("Downloaded: " + out.invNo + ".pdf");
                    } catch {
                      toast("Could not build the PDF");
                    }
                  }}
                >
                  Export PDF
                </button>
              </div>
            </div>
            <div className="inv-wrap">
              <div className="inv" ref={docRef}><InvoiceDoc m={out} /></div>
            </div>
            <p className="hint" style={{ marginTop: 8 }}>Saved to Invoice history. Regenerating keeps the same invoice number.</p>
          </div>
        )}
      </div>
    </section>
  );
}
