// Business maths — ported 1:1 from the prototype (chaufTotal, vatDue,
// commission, computeHourly, shiftCalc). Keep these exact: salary
// slips, invoices and the Jobs overview KPIs are all built on them.
import { num, parseHM, money } from "./format";

type Priced = {
  company_price: number | string;
  chauffeur_price: number | string;
  car_park: number | string;
  congestion: number | string;
  vat: boolean;
};

export const chaufTotal = (j: Omit<Priced, "company_price" | "vat">) =>
  num(j.chauffeur_price) + num(j.car_park) + num(j.congestion);
export const vatDue = (j: Pick<Priced, "company_price" | "vat">) => (j.vat ? num(j.company_price) * 0.2 : 0);
export const commission = (j: Priced) => num(j.company_price) - chaufTotal(j) - vatDue(j);
export const isActive = (j: { status: string }) => j.status !== "Cancelled";

/**
 * Hourly job pricing: worked = end − start (wraps past midnight),
 * billed = max(minimum, worked), price = billed × rate.
 */
export function computeHourly(rate: number, minH: number, start: string, end: string) {
  let hrs = 0;
  if (start && end) {
    hrs = parseHM(end) - parseHM(start);
    if (hrs < 0) hrs += 24;
  }
  const billed = Math.max(minH, hrs);
  const price = billed * rate;
  if (rate && (hrs || minH)) {
    const text = `${hrs ? hrs.toFixed(1) + "h worked, " : ""}billed ${billed.toFixed(1)}h × ${money(rate)} = ${money(price)}${
      minH && hrs < minH ? " (minimum " + minH + "h applied)" : ""
    }`;
    return { price, text };
  }
  return { price: null as number | null, text: "Enter rate and times to calculate." };
}

export type ShiftInput = {
  start: string;
  end: string;
  expenses: { label: string; amount: number | string }[];
  extraJobs: { label: string; amount: number | string }[];
};
export type EmpPay = { shift_hours: number | string; daily_wage: number | string; extra_hour_rate: number | string };

/** A BLC driver's day: wage + extra hours + extra jobs + expenses. */
export function shiftCalc(sh: ShiftInput, e: EmpPay) {
  let w = parseHM(sh.end) - parseHM(sh.start);
  if (w < 0) w += 24;
  const extraH = Math.max(0, w - num(e.shift_hours));
  const base = num(e.daily_wage);
  const extraPay = extraH * num(e.extra_hour_rate);
  const jobsT = (sh.extraJobs || []).reduce((s, x) => s + num(x.amount), 0);
  const exp = (sh.expenses || []).reduce((s, x) => s + num(x.amount), 0);
  return { w, extraH, base, extraPay, jobsT, exp, total: base + extraPay + jobsT + exp };
}
