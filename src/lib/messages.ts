// The two hand-off messages — reproduced word for word (including the
// space-aligned label column) from the prototype's msgChauffeur() and
// msgCompany().
import { money, num, fmtDate, firstName, time5 } from "./format";
import { chaufTotal } from "./calc";
import type { Job } from "./types";

export const SITE_HOST = (process.env.NEXT_PUBLIC_SITE_HOST || "app.myblc.co.uk").replace(/^https?:\/\//, "");

/** Chauffeur's action link (can tap statuses). */
export const jobURL = (j: Pick<Job, "ref" | "driver_key">) => `${SITE_HOST}/job/${j.ref}?k=${j.driver_key}`;
/** Company's view-only tracking link. */
export const trackURL = (j: Pick<Job, "ref" | "track_key">) => `${SITE_HOST}/track/${j.ref}?k=${j.track_key}`;
export const fleetURL = (id: string) => `${SITE_HOST}/fleet/${id}`;
export const driverURL = (id: string) => `${SITE_HOST}/driver/${id}`;
/** Turn a displayed link into something an <a href> can open. */
export const href = (u: string) => (u.startsWith("http") ? u : "https://" + u);

export function msgChauffeur(j: Job): string {
  const air = j.service_type.startsWith("Airport");
  const lines = [`Fare:        ${money(j.chauffeur_price)}`];
  if (num(j.car_park)) lines.push(`Car park:    ${money(j.car_park)}`);
  if (num(j.congestion)) lines.push(`Congestion:  ${money(j.congestion)}`);
  lines.push(`Total:       ${money(chaufTotal(j))}`);
  const dir = j.direction || "";
  return `Hi ${firstName(j.driver?.name)},

Here is your job sheet. Please confirm receipt.

Ref:       ${j.ref}
Date:      ${fmtDate(j.pickup_date)}
Pick-up:   ${time5(j.pickup_time)}
From:      ${j.pickup_location || ""}
To:        ${j.dropoff_location || ""}${air && j.flight ? `\nFlight:    ${j.flight} (${dir.startsWith("Arr") ? "arrival" : "departure"})` : ""}

Passenger: ${j.pax_name || ""}${j.pax_count ? ` (${j.pax_count})` : ""}${j.pax_phone ? `\nContact:   ${j.pax_phone}` : ""}
Vehicle:   ${j.vehicle || ""}${j.notes ? `\nNotes:     ${j.notes}` : ""}

Payment breakdown:
${lines.join("\n")}

Live job sheet, tap Start Trip and keep the status updated:
${jobURL(j)}

Thank you.`;
}

export function msgCompany(j: Job): string {
  const d = j.driver;
  const greet = j.company?.contact_name ? firstName(j.company.contact_name) : "there";
  const price = num(j.company_price);
  let pblock: string;
  if (j.vat) {
    const vat = price * 0.2;
    pblock = `Subtotal:    ${money(price)}\nVAT (20%):   ${money(vat)}\nTotal due:   ${money(price + vat)}  (inclusive of VAT)`;
  } else pblock = `Total due:   ${money(price)}`;
  return `Hi ${greet},

Your booking is confirmed. Full details below.

Ref:       ${j.ref}
Date:      ${fmtDate(j.pickup_date)}, ${time5(j.pickup_time)}
Route:     ${j.pickup_location || ""} to ${j.dropoff_location || ""}${j.flight ? `\nFlight:    ${j.flight}` : ""}
Passenger: ${j.pax_name || ""}${j.pax_count ? ` (${j.pax_count})` : ""}

Your chauffeur:
${d?.name || "—"}, ${d?.phone || ""}
${d?.vehicle || j.vehicle || ""}, Reg ${d?.registration || ""}

Price:
${pblock}

Check the journey details and follow the live status throughout the journey (view only):
${trackURL(j)}

Kind regards,
Bespoke London Chauffeurs`;
}
