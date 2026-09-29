// Formatting helpers — ported 1:1 from the prototype's script so every
// figure, date and reference reads exactly the same.

const TZ = "Europe/London";

/** "£" + two decimals, no thousands separator (prototype: money()). */
export function money(n: number | string | null | undefined): string {
  return "£" + num(n).toFixed(2);
}

/** parseFloat with 0 fallback (prototype: num()). */
export function num(v: unknown): number {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? 0 : n;
}

/** Today's date (London) as YYYY-MM-DD, optionally offset by days. */
export function todayISO(offset = 0): string {
  const d = new Date(Date.now() + offset * 86400000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** "Tue 29 Sep 2026" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso + "T00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

/** "29 Sep 2026" */
export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso.slice(0, 10) + "T00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

/** A timestamp as London "HH:MM" (used for status stamps). */
export function hhmm(ts: string | null | undefined): string {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

/** DB time "14:30:00" → "14:30". */
export function time5(t: string | null | undefined): string {
  return t ? t.slice(0, 5) : "";
}

export function initials(n: string | null | undefined): string {
  return (n || "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function firstName(n: string | null | undefined): string {
  return (n || "").replace(/^(Mr|Mrs|Ms|Miss|Dr)\.?\s+/i, "").split(" ")[0];
}

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** "29SEP2026" (salary slip numbers). */
export function ddmmmyyyy(iso: string): string {
  const d = new Date(iso + "T00:00");
  return String(d.getDate()).padStart(2, "0") + MON[d.getMonth()] + d.getFullYear();
}
/** First 4 letters of a name, uppercased, padded with X. */
export function name4(n: string | null | undefined): string {
  return ((n || "").replace(/[^A-Za-z]/g, "").toUpperCase() + "XXXX").slice(0, 4);
}

/** "08:30" → 8.5 */
export function parseHM(s: string | null | undefined): number {
  const p = (s || "0:0").split(":");
  return +p[0] + (+p[1] || 0) / 60;
}
