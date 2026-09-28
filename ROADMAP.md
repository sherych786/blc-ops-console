# Roadmap — Phase 1 (in-house app.myblc.co.uk)

Status: foundation is live — auth, database schema, layout, and one fully
working reference module (Jobs). Everything below is the remaining work,
roughly in the order it's most useful to build.

## 0. Done

- [x] Next.js 16 + Tailwind + Supabase project scaffolded, builds clean
- [x] Full database schema (`supabase/schema.sql`) covering every module
- [x] Staff login (Supabase Auth) + protected layout + sidebar nav
- [x] Dashboard with live KPI cards (jobs today, active pipeline value, etc.)
- [x] **Jobs Overview** — list page (live from Supabase) + New Job form
      (create, persists to the database)

## 1. Jobs module — finish it

- [ ] Job detail page (click a row → view/edit, matching the prototype's
      popup: hide-chauffeur-pricing toggle, status timeline)
- [ ] Status updates (assigned → on the way → arrived → in progress →
      completed), writing to `job_status_stamps`
- [ ] Hourly pricing calculator on the New Job form (per-hour rate +
      minimum hours + start/end time → auto price), same logic as the
      prototype's `computeHourly()`
- [ ] Filters/search on the Jobs Overview list (date range, company,
      driver, status) — mirrors the prototype's Jobs Overview filters
- [ ] Export (Excel/CSV) of the filtered list
- [ ] Message templates ("message chauffeur" / "message company") —
      decide the channel (WhatsApp deep link? email via Resend?) with
      the user before building
- [ ] Public, view-only tracking link per job (a `/track/[ref]` page —
      already allowed through in `src/lib/supabase/middleware.ts`)

## 2. Office

- [ ] Companies — list/create/edit/delete (`office/companies`)
- [ ] Fleet — list/create/edit/delete, with photo/video upload to
      Supabase Storage, the gallery carousel from the prototype, pax/
      luggage fields, shareable public fleet profile page
- [ ] Chauffeurs — list/create/edit/delete, linked to a fleet vehicle,
      with their own shareable status-update link (`/driver/[id]`)

## 3. Invoices

- [ ] Issuers (the "Invoice From" company profiles) — CRUD
- [ ] Generate invoice "from jobs" (pick a company + date range, pull
      unbilled jobs, add per-job extra-expense lines)
- [ ] Generate invoice "custom" (manual line items, service-type-aware
      fields, per-line extras)
- [ ] VAT modes (none / add 20% / prices already VAT-inclusive)
- [ ] Optional discount (description, % or £, shown in dark red on the
      invoice — matches the prototype)
- [ ] Invoice PDF export + invoice history list
- [ ] Payment link field

## 4. BLC Drivers (payroll)

- [ ] Employees — CRUD (contact, bank details, vehicle, shift length,
      daily wage, extra-hour rate, manager, invoice basis)
- [ ] Daily update — public link per employee (`/driver/[id]/update`)
      submitting start/end time, expenses, extra jobs (expandable rows,
      up to 10, matching the prototype)
- [ ] Shift review — filter by employee + date range
- [ ] Salary slip generation — wage + extra-hour pay + expenses + extra
      jobs + manual adjustment, numbered `SAL-NAME-DDMMMYYYY`
- [ ] Paid/Unpaid toggle with the green "PAID" watermark on the slip
- [ ] Salary Slips history page

## 5. Polish / production-readiness

- [ ] Self-host PT Sans via `next/font/local` for exact brand typography
      (currently using the system font stack so builds never depend on
      reaching Google Fonts — see `src/app/layout.tsx`)
- [ ] Add the BLC logo (the prototype already has a processed transparent
      PNG — reuse it) to the sidebar header and invoice/salary-slip PDFs
- [ ] Roles: restrict who can see chauffeur pricing / payroll data
      (`profiles.role`, already in the schema) if not everyone on staff
      should see everything
- [ ] Basic activity log (who created/edited a job or invoice) if useful
- [ ] Error/empty states pass on every list page
- [ ] Mobile check on the public driver/tracking links specifically —
      those are opened on phones in the field

## Explicitly out of scope for Phase 1

Multi-tenancy, billing/Stripe, per-tenant branding, self-serve signup —
all Phase 2. Don't add a `tenant_id` column or tenant-scoping logic yet;
it changes the RLS policies and query shape everywhere, and doing it
speculatively now just adds complexity Phase 1 doesn't need.
