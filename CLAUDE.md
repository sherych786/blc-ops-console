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
No multi-tenancy, no billing, no public signup. That's Phase 2 — see
`docs/PHASE-2-SAAS.md` (not started; do not build toward it yet unless
asked).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4). Node's proxy
  convention changed in v16 — the middleware file is `src/proxy.ts`
  exporting `proxy()`, not `middleware.ts`/`middleware()`. See
  `node_modules/next/dist/docs/` for anything else that looks off versus
  older Next.js knowledge — this version has real breaking changes.
- **Supabase**: Postgres database + Auth (email/password for staff) +
  Storage (for fleet photos/videos, invoice PDFs, etc. once wired up).
- **Vercel**: hosting, deploys on every push to `main`.

## Where things live

- `supabase/schema.sql` — the entire database schema, one file, meant to
  be run once in the Supabase SQL editor. It already includes every table
  the prototype needs (companies, fleet, drivers, jobs, employees,
  shift_logs, salary_slips, invoices, issuers, etc.) so future work is
  adding *pages*, not redesigning the data model. If a column is missing,
  add an `alter table` migration rather than editing this file's history.
- `src/lib/supabase/{client,server}.ts` — Supabase client factories.
  Use `server.ts`'s `createClient()` in Server Components/Actions,
  `client.ts`'s in Client Components. Never expose the service-role key
  to the browser — only `NEXT_PUBLIC_SUPABASE_ANON_KEY` is public.
- `src/app/(app)/` — everything behind login (the console itself).
  `src/app/(app)/layout.tsx` checks auth and renders the sidebar.
- `src/app/login/` — the sign-in page (public).
- `src/components/Sidebar.tsx` — the nav; add a link here when you add a
  module.
- `src/app/globals.css` — brand tokens (colors, radii) as CSS variables,
  light/dark aware. Reuse `.card`/`.control` classes and the `--accent`,
  `--ink`, `--grey`, `--red`, `--green`, `--line`, `--surface` variables
  rather than hardcoding hex colors in new components.

## The pattern every module follows (see `jobs/` as the reference)

1. `page.tsx` (Server Component) — fetch data with the server Supabase
   client, render it.
2. `actions.ts` — `"use server"` functions that validate input and write
   to Supabase, then `revalidatePath`/`redirect`.
3. A small Client Component for the form (`useActionState` +
   `formAction`), kept in its own file so the page itself stays a Server
   Component.

Copy `src/app/(app)/jobs/` as the template for Office (Companies, Fleet,
Chauffeurs), Invoices, and BLC Drivers (Employees, Daily Updates, Salary
Slips) — those are currently stub pages (`src/components/ComingSoon.tsx`)
waiting to be built this way. `ROADMAP.md` has the checklist and notes
on what each one needs to port from the prototype (specific UI details
like the searchable chauffeur combo, hourly pricing calc, discount line,
PAID watermark, etc. — the prototype is the design reference for exact
behaviour; ask the user for it if it's not attached to the session).

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

Copy `.env.local.example` to `.env.local` and fill in the Supabase
project URL + anon key for local dev. The same two variables are set in
Vercel's project settings for the deployed app.
