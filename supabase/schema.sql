-- BLC Operations Console — Phase 1 database schema
-- Run this once in Supabase (SQL Editor) on a fresh project.
-- Mirrors the data model from the prototype 1:1 so every module can be
-- ported without redesigning the data first.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Staff accounts (every BLC team member who logs into the console)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'staff', -- 'admin' | 'staff'
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Office: Companies, Fleet, Chauffeurs
-- ---------------------------------------------------------------------
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_name text,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists fleet (
  id uuid primary key default gen_random_uuid(),
  class text not null,              -- e.g. "S-Class", "V-Class"
  registration text,
  pax int,
  luggage int,
  description text,
  profile_pic_url text,
  gallery_urls text[] default '{}',
  video_url text,
  created_at timestamptz not null default now()
);

create table if not exists drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  vehicle_id uuid references fleet(id) on delete set null,
  registration text,
  license_no text,
  area text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,                 -- job reference shown to companies/chauffeurs
  company_id uuid references companies(id) on delete set null,
  driver_id uuid references drivers(id) on delete set null,
  pickup_date date not null,
  pickup_time time,
  pickup_location text,
  dropoff_location text,
  service_type text not null default 'one_way', -- one_way | airport | hourly | other
  company_price numeric(10,2) not null default 0,
  chauffeur_price numeric(10,2) not null default 0,
  car_park numeric(10,2) not null default 0,
  congestion numeric(10,2) not null default 0,
  vat boolean not null default false,
  per_hour numeric(10,2),
  min_hours numeric(10,2),
  end_time time,
  status text not null default 'new', -- new | assigned | on_the_way | arrived | in_progress | completed | cancelled
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists jobs_pickup_date_idx on jobs (pickup_date);
create index if not exists jobs_status_idx on jobs (status);

-- Status timeline (chauffeur taps through: on the way / arrived / etc.)
create table if not exists job_status_stamps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  status text not null,
  stamped_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- BLC Drivers (salaried employees on company vehicles) + payroll
-- ---------------------------------------------------------------------
create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  bank_name text,
  bank_account text,
  bank_sort_code text,
  vehicle_id uuid references fleet(id) on delete set null,
  registration text,
  shift_hours numeric(6,2) not null default 8,
  daily_wage numeric(10,2) not null default 0,
  extra_hour_rate numeric(10,2) not null default 0,
  manager text,
  invoice_basis text, -- freeform note on how this employee is invoiced/paid
  created_at timestamptz not null default now()
);

-- Daily update submitted by the employee via their personal link
create table if not exists shift_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  log_date date not null,
  start_time time,
  end_time time,
  note text,
  created_at timestamptz not null default now(),
  unique (employee_id, log_date)
);

create table if not exists shift_expenses (
  id uuid primary key default gen_random_uuid(),
  shift_log_id uuid not null references shift_logs(id) on delete cascade,
  label text not null,
  amount numeric(10,2) not null default 0
);

create table if not exists shift_extra_jobs (
  id uuid primary key default gen_random_uuid(),
  shift_log_id uuid not null references shift_logs(id) on delete cascade,
  description text not null,
  agreed_pay numeric(10,2) not null default 0
);

create table if not exists salary_slips (
  id uuid primary key default gen_random_uuid(),
  slip_no text not null unique,        -- SAL-NAME-DDMMMYYYY
  employee_id uuid not null references employees(id) on delete cascade,
  period_date date not null,
  wage numeric(10,2) not null default 0,
  extra_hours numeric(6,2) not null default 0,
  extra_pay numeric(10,2) not null default 0,
  expenses_total numeric(10,2) not null default 0,
  extra_jobs_total numeric(10,2) not null default 0,
  adjustment numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'unpaid', -- unpaid | paid
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Invoicing
-- ---------------------------------------------------------------------
create table if not exists issuers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  vat_no text,
  company_no text,
  bank_details text,
  footer_contacts text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  issuer_id uuid references issuers(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  mode text not null default 'from_jobs', -- from_jobs | custom
  vat_mode text not null default 'none',  -- none | add | inc
  discount_desc text,
  discount_type text,                     -- pct | amt
  discount_value numeric(10,2) default 0,
  subtotal numeric(10,2) not null default 0,
  vat numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_link text,
  status text not null default 'unpaid', -- unpaid | paid
  created_at timestamptz not null default now()
);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  description text not null,
  service_type text,
  start_time time,
  end_time time,
  net numeric(10,2) not null default 0,
  sort_order int not null default 0
);

create table if not exists invoice_line_extras (
  id uuid primary key default gen_random_uuid(),
  invoice_line_id uuid not null references invoice_lines(id) on delete cascade,
  label text not null,
  amount numeric(10,2) not null default 0
);

-- ---------------------------------------------------------------------
-- Row Level Security — Phase 1 is single-tenant (BLC staff only), so
-- every authenticated (logged-in) user gets full access. When Phase 2
-- (multi-tenant SaaS) happens, every table above gets a tenant_id
-- column and these policies get rewritten to scope by tenant.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select unnest(array[
    'profiles','companies','fleet','drivers','jobs','job_status_stamps',
    'employees','shift_logs','shift_expenses','shift_extra_jobs',
    'salary_slips','issuers','invoices','invoice_lines','invoice_line_extras'
  ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format(
      'drop policy if exists "staff full access" on %I;', t
    );
    execute format(
      'create policy "staff full access" on %I for all using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');',
      t
    );
  end loop;
end $$;

-- Auto-create a profile row whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
