@AGENTS.md

# BLC Operations Console — project brief

Read this before making changes. It's written so a future Claude Code
session (or a human) can pick this project up cheaply — in small, targeted
edits — instead of re-reading or regenerating the whole app.

## What this is

The real, production version of Bespoke London Chauffeurs' in-house
Operations Console (jobs, invoicing, driver payroll), replacing the
single-page prototype. It will be deployed to **app.myblc.co.uk**.

Phase 1 only (current scope): one company, BLC's own staff logging in.
Status: at parity with the approved prototype — see `ROADMAP.md`.
No multi-tenancy, no billing, no public signup. That's Phase 2 — see
`docs/PHASE-2-SAAS.md` (not started; do not build toward it yet unless
asked).

## Stack

- **Next.js 16** (App Router, TypeScript; styling is the prototype stylesheet in `globals.css`, not Tailwind classes). Node's proxy
  convention changed in v16 — the middleware file is `src/proxy.ts`
  exporting `proxy()`, not `middleware.ts`/`middleware()`. See
  `node_modules/next/dist/docs/` for anything else that looks off versus
  older Next.js knowledge — this version has real breaking changes.
- **Supabase**: Postgres database + Auth (email/password for staff) +
  Storage (for fleet photos/videos, invoice PDFs, etc. once wired up).
- **Vercel**: hosting, deploys on every push to `main`.

## Where things live

- **Design reference**: the approved prototype
  (claude.ai/artifact/6og1WfE4L5FiheUSpuX6vJ) is the spec for layout,
  wording and behaviour. The audit workbook maps every element to code.
- `src/app/globals.css` — the prototype's stylesheet, ported VERBATIM.
  Components use its class names directly (`.card`, `.btn primary`,
  `.kpi`, `.drv`, `.pill`, `.form-grid`/`.fg`, `.modal`, `.phone` …).
  Tailwind's preflight is deliberately not loaded; don't add Tailwind
  utility classes or hardcoded colours — reuse the classes/tokens.
- `supabase/schema.sql` — base schema (run once). Changes go in
  `supabase/migrations/NNN_*.sql` (idempotent, run once in the SQL
  editor, in order). `002_prototype_parity.sql` must be applied.
- `src/lib/` — `format.ts` (money/dates/refs, ported 1:1), `calc.ts`
  (commission, VAT, hourly calc, shift pay — keep exact), `messages.ts`
  (the two hand-off messages word for word + link builders), `jobs.ts`
  (the one Supabase select for jobs), `export.ts` (xlsx/PDF/PNG in the
  browser), `types.ts` (status vocabulary, row shapes).
- `src/components/` — shared UI: `Sidebar`, `AppBar`, `Toast`
  (`useToast`, `useCopy`), `JobModal`, `PhoneJob`, `PhoneDriver`,
  `FleetProfile` (Ken-Burns carousel), `InvoiceDoc`, `SlipDoc`, `ui.tsx`.
- `src/app/(app)/layout.tsx` — auth gate + appbar.
  `src/app/(app)/(console)/` — every console page (sidebar layout).
  `src/app/(app)/preview/` — the in-console phone previews.
- Public (no login) pages: `src/app/{job,track,driver,fleet}/…`. They
  read/write ONLY through the `public_*` SECURITY DEFINER functions in
  the migration — RLS keeps every table closed to anonymous visitors.
  Job links carry a secret key (`?k=` driver_key / track_key); keep it.
  Allow-listed in `src/lib/supabase/middleware.ts`.

## The pattern every module follows

1. `page.tsx` (Server Component) — fetch with the server Supabase
   client, pass plain data down.
2. `actions.ts` — `"use server"` functions that validate, write, call
   `revalidatePath("/", "layout")` (refreshes sidebar counts too) and
   return `{ error? }` — no redirects.
3. `<Module>Client.tsx` — the prototype's markup; calls the action in
   `startTransition`, then `toast()` with the prototype's wording.

Statuses: `Pending → EnRoute → At Pick Up → POB → Dropped off →
Completed`, plus `Cancelled` (DB check constraint). Refs are issued by
the DB: `BLC-YYYY-####`, `INV-YYYY-####`; slips `SAL-NAME-DDMMMYYYY`.

## Working on this efficiently (keeps token spend low)

- Don't regenerate whole files. Read only the file(s) you're changing,
  edit them, run `npx tsc --noEmit` and `npm run lint` to check.
- One module at a time. Each one is self-contained (its own folder,
  actions, and a page or two) — there's no need to touch unrelated
  modules to add one.
- The schema is already there. Building a new module is UI + queries
  against existing tables, not database design.
- Before adding a table/column, check `supabase/schema.sql` — it's
  probably already there.
- Run `npm run build` before considering a change done; Turbopack catches
  most mistakes fast.

## Environment

`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (the same two are set in Vercel).
Optional: `NEXT_PUBLIC_SITE_HOST` (default `app.myblc.co.uk`) — the host
printed in the chauffeur / tracking / driver / fleet links.
