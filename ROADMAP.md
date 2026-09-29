# Roadmap — Phase 1 (in-house app.myblc.co.uk)

Status: **feature parity with the approved prototype**
(claude.ai/artifact/6og1WfE4L5FiheUSpuX6vJ), worked through against the
"BLC Ops Console — Pixel Audit" workbook tab by tab. Requires
`supabase/migrations/002_prototype_parity.sql` to be run once.

## Done

### Foundation
- [x] Next.js 16 + Supabase, staff login, protected layout
- [x] Design system ported verbatim from the prototype (`globals.css`):
      tokens, light/dark (+ manual toggle, remembered per browser), card
      hover lift + shadow, pills, tabular numerals, toasts, Ken-Burns
- [x] PT Sans self-hosted (`@fontsource/pt-sans`), BLC logo (`public/blc-logo.png`)
- [x] Appbar (logo, Operations / Chauffeur link / Driver update switch,
      theme, sign out) + sidebar with icons, accordion groups that open
      on the active page, live count badges

### Jobs
- [x] Dashboard: 4 KPI cards, each with the 12-metric picker (saved per
      browser), job board with status filter, click ref → job summary
- [x] New job / edit: radio-card service types, airport direction +
      flight, hourly calculator (min hours, past-midnight), passenger
      fields, vehicle class, searchable chauffeur combo, live price box,
      edit banner, confirmation panel with both hand-off messages
      (word-for-word), copy / WhatsApp / email
- [x] Jobs overview: company + date + search filters, 5 live KPIs,
      bulk select, Excel export (prototype column set), edit, cancel /
      restore (restore-to-right-status logic)
- [x] Job summary modal: hide chauffeur pricing, PNG / PDF export,
      status timeline, Esc / backdrop / ✕ close
- [x] Sequential refs `BLC-YYYY-####`; prototype status vocabulary

### Public links (no login; secret key in the URL)
- [x] `/job/<ref>?k=` chauffeur sheet: Start trip → 5-step one-way
      stepper → status log → thank-you + invoicing card. Never shows
      company price or commission. Expires 7 days after completion.
- [x] `/track/<ref>?k=` company view: live status, chauffeur, no prices
- [x] `/driver/<id>` daily update: 3→10 expandable rows, day total
- [x] `/fleet/<id>` fleet profile with Ken-Burns carousel (was blocked
      by RLS for real visitors before — now works)

### Office
- [x] Companies, Fleet, Chauffeurs as card grids with inline forms,
      avatars, hover lift. Fleet: short label, free-text pax/luggage,
      media upload, Share modal. Chauffeurs: rating, on-duty badge (tap
      to toggle), registration uppercased

### Invoices
- [x] From jobs (per-job extra charges) and Custom (type-aware line
      builder, per-line expenses, manual client)
- [x] Extra charges, VAT add / VAT-inclusive, discount (% or £, red),
      payment link, issuer profiles (seeded with BLC's details)
- [x] `INV-YYYY-####`, invoice document, PDF / Excel, history, re-open
      and regenerate under the same number

### BLC Drivers
- [x] Employees card grid + daily-update link (copy / open)
- [x] Jobs review: driver + date range, 5 KPIs, shift table
- [x] Salary slips `SAL-NAME-DDMMMYYYY(-n)`, 3-section slip, manual
      adjustments, Mark paid / unpaid with PAID watermark, PDF / Excel

## Still open / decisions for the team
- [ ] **Completion email**: the prototype's toast said "email sent to
      info@myblc.co.uk" on completion; nothing sends email yet (the
      console updates live instead). Needs an email service (e.g. Resend).
- [ ] **Chauffeur details in the company message** (name, mobile, reg) —
      kept as in the prototype; confirm the ops team is happy sharing
      the chauffeur's direct mobile with clients.
- [ ] **Chauffeur rating** is displayed but has no edit field (the
      prototype had none either) — decide whether to track it.
- [ ] **Invoice paid/unpaid** status (column exists; the prototype had no UI).
- [ ] Roles: restrict chauffeur pricing / payroll by `profiles.role`
- [ ] Activity log (who created / edited what)
- [ ] Delete confirmations (both the prototype and this app delete in one click)

## Explicitly out of scope for Phase 1

Multi-tenancy, billing/Stripe, per-tenant branding, self-serve signup —
all Phase 2. Don't add a `tenant_id` column or tenant-scoping logic yet.
