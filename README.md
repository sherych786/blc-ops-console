# BLC Operations Console

The real, database-backed version of Bespoke London Chauffeurs' in-house
console — replacing the single-page prototype. Deploys to
**app.myblc.co.uk**.

See `CLAUDE.md` for how the project is organized and how to keep working
on it cheaply with Claude Code, and `ROADMAP.md` for what's built vs.
still to do.

## One-time setup

### 1. Create the Supabase project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's ready, open **SQL Editor** → paste the entire contents of
   `supabase/schema.sql` → Run. This creates every table, plus row-level
   security so only logged-in staff can read/write.
3. Go to **Authentication → Users → Add user** and create an account for
   yourself (and anyone else on staff) with an email + password. This is
   how you'll log into the console — there's no public sign-up.
4. Go to **Project Settings → API** and copy:
   - Project URL
   - `anon` `public` key

### 2. Local development (optional, only if you want to preview changes yourself)

```bash
cp .env.local.example .env.local
# paste the Project URL and anon key from step 1 into .env.local
npm install
npm run dev
```

Open http://localhost:3000 and sign in with the staff account you created.

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import this
   GitHub repository.
2. Add the two environment variables from step 1
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under
   **Settings → Environment Variables**.
3. Deploy. Vercel gives you a `*.vercel.app` URL immediately.
4. Go to **Settings → Domains** → add `app.myblc.co.uk`. Vercel shows you
   the DNS record to add (a CNAME, same as the GoDaddy setup you've
   already done for the subdomain) — point it there and Vercel issues the
   SSL certificate automatically.

From then on, every push to the `main` branch on GitHub auto-deploys —
that's the whole release process.
