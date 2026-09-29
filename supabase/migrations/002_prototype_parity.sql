-- =====================================================================
-- BLC Operations Console — migration 002: prototype parity
-- =====================================================================
-- Run ONCE in Supabase → SQL Editor, after schema.sql (and storage.sql).
-- Safe to re-run: every statement is idempotent.
--
-- What it does
--   1. Jobs: adopts the prototype's status + service-type vocabulary
--      (Pending → EnRoute → At Pick Up → POB → Dropped off → Completed,
--      plus Cancelled), adds the passenger / flight / direction / vehicle
--      fields, sequential BLC-YYYY-#### refs, and two secret link keys
--      (one for the chauffeur's action link, one for the company's
--      view-only tracking link).
--   2. Fleet: short label (notes); pax + luggage become free text
--      ("2 large, 1 small").
--   3. Chauffeurs: star rating + on-duty flag.
--   4. Issuers: full "Invoice from" profile, seeded with BLC's details.
--   5. Invoices: sequential INV-YYYY-#### numbers + a JSON snapshot of
--      every line so an invoice can be re-opened and regenerated.
--   6. Salary slips: period from/to, shift snapshot, manual adjustments.
--   7. Public functions for the four links that are opened WITHOUT a
--      login (chauffeur job sheet, company tracking, driver daily
--      update, fleet profile). Row Level Security still blocks every
--      table for anonymous visitors; these functions are the only door,
--      and each one returns just the fields that page needs.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Jobs
-- ---------------------------------------------------------------------
alter table jobs add column if not exists direction  text;
alter table jobs add column if not exists flight     text;
alter table jobs add column if not exists pax_name   text;
alter table jobs add column if not exists pax_phone  text;
alter table jobs add column if not exists pax_email  text;
alter table jobs add column if not exists pax_count  text;
alter table jobs add column if not exists vehicle    text;
alter table jobs add column if not exists driver_key text;
alter table jobs add column if not exists track_key  text;

update jobs set driver_key = encode(gen_random_bytes(6), 'hex') where driver_key is null;
update jobs set track_key  = encode(gen_random_bytes(6), 'hex') where track_key  is null;
alter table jobs alter column driver_key set default encode(gen_random_bytes(6), 'hex');
alter table jobs alter column track_key  set default encode(gen_random_bytes(6), 'hex');
alter table jobs alter column driver_key set not null;
alter table jobs alter column track_key  set not null;

-- Status vocabulary → the prototype's (these labels appear on the
-- chauffeur's phone, in exports and in every status pill).
alter table jobs drop constraint if exists jobs_status_check;
update jobs set status = case status
  when 'new'         then 'Pending'
  when 'assigned'    then 'Pending'
  when 'on_the_way'  then 'EnRoute'
  when 'arrived'     then 'At Pick Up'
  when 'in_progress' then 'POB'
  when 'completed'   then 'Completed'
  when 'cancelled'   then 'Cancelled'
  else status end;
alter table jobs alter column status set default 'Pending';
alter table jobs add constraint jobs_status_check check (status in
  ('Pending','EnRoute','At Pick Up','POB','Dropped off','Completed','Cancelled'));

update job_status_stamps set status = case status
  when 'on_the_way'  then 'EnRoute'
  when 'arrived'     then 'At Pick Up'
  when 'in_progress' then 'POB'
  when 'completed'   then 'Completed'
  else status end;
delete from job_status_stamps s
  where s.status not in ('EnRoute','At Pick Up','POB','Dropped off','Completed');
-- One stamp per step per job (keep the earliest if duplicates exist).
delete from job_status_stamps a using job_status_stamps b
  where a.job_id = b.job_id and a.status = b.status
    and (a.stamped_at, a.id::text) > (b.stamped_at, b.id::text);
create unique index if not exists job_status_stamps_job_status_uq
  on job_status_stamps (job_id, status);

-- Service types → the prototype's three.
update jobs set service_type = case service_type
  when 'airport' then 'Airport Transfer'
  when 'one_way' then 'One-Way Transfer'
  when 'hourly'  then 'Hourly / As Directed'
  when 'other'   then 'One-Way Transfer'
  else service_type end;
alter table jobs alter column service_type set default 'Airport Transfer';

-- Sequential refs: BLC-2026-0001, BLC-2026-0002 … (existing refs are kept).
create sequence if not exists job_ref_seq;
alter table jobs alter column ref set default
  'BLC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('job_ref_seq')::text, 4, '0');
create index if not exists jobs_company_idx on jobs (company_id);

-- ---------------------------------------------------------------------
-- 2. Fleet
-- ---------------------------------------------------------------------
alter table fleet add column if not exists notes text;
alter table fleet alter column pax     type text using pax::text;
alter table fleet alter column luggage type text using luggage::text;

-- ---------------------------------------------------------------------
-- 3. Chauffeurs
-- ---------------------------------------------------------------------
alter table drivers add column if not exists rating  text;
alter table drivers add column if not exists on_duty boolean not null default true;

-- ---------------------------------------------------------------------
-- 4. Issuers ("Invoice from" profiles)
-- ---------------------------------------------------------------------
alter table issuers add column if not exists email          text;
alter table issuers add column if not exists bank_name      text;
alter table issuers add column if not exists account_holder text;
alter table issuers add column if not exists account_no     text;
alter table issuers add column if not exists sort_code      text;
alter table issuers add column if not exists bic            text;
alter table issuers add column if not exists iban           text;
alter table issuers add column if not exists phone          text;
alter table issuers add column if not exists tel            text;
alter table issuers add column if not exists web            text;

-- BLC's own profile (from the prototype). Only inserted if no issuer
-- exists yet — CHECK these details are current before the first invoice.
insert into issuers (name, address, vat_no, company_no, email, bank_name,
  account_holder, account_no, sort_code, bic, iban, phone, tel, web, is_default)
select 'Bespoke London Chauffeurs Ltd',
  E'28 Hedgemans Way, Dagenham\nLondon, RM9 6DD, United Kingdom',
  '466 657 055', '145 648 19', 'contact@myblc.co.uk', 'Lloyds',
  'Bespoke London Chauffeurs Ltd', '23194563', '30-99-50', 'LOYDGB21287',
  'GB07 LOYD 3099 5050 8943 63', '02039181515', '+44 7535 185893',
  'www.myblc.co.uk', true
where not exists (select 1 from issuers);

-- ---------------------------------------------------------------------
-- 5. Invoices
-- ---------------------------------------------------------------------
alter table invoices add column if not exists client_name text;
alter table invoices add column if not exists issue_date  date not null default current_date;
alter table invoices add column if not exists due_date    date;
-- Full snapshot (rows, extras, custom lines, bill-to, issuer) so the
-- document renders identically later and can be re-opened for editing.
alter table invoices add column if not exists data jsonb not null default '{}'::jsonb;

create sequence if not exists invoice_no_seq;
alter table invoices alter column invoice_no set default
  'INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_no_seq')::text, 4, '0');

-- ---------------------------------------------------------------------
-- 6. Salary slips
-- ---------------------------------------------------------------------
alter table salary_slips add column if not exists period_from date;
alter table salary_slips add column if not exists period_to   date;
alter table salary_slips add column if not exists employee    jsonb not null default '{}'::jsonb;
alter table salary_slips add column if not exists rows        jsonb not null default '[]'::jsonb;
alter table salary_slips add column if not exists adjustments jsonb not null default '[]'::jsonb;
update salary_slips set status = case status when 'paid' then 'Paid' when 'unpaid' then 'Unpaid' else status end;
alter table salary_slips alter column status set default 'Unpaid';

update employees set invoice_basis = 'Weekly' where invoice_basis is null or invoice_basis = '';
alter table employees alter column invoice_basis set default 'Weekly';
alter table employees alter column shift_hours set default 10;

-- ---------------------------------------------------------------------
-- 7. Public (no-login) functions
-- ---------------------------------------------------------------------

-- Job sheet for the chauffeur (driver_key) or the company (track_key).
-- The company view never includes any price; the chauffeur view only
-- ever includes the chauffeur's own fare — never company price or
-- commission.
create or replace function public.public_job(p_ref text, p_key text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare j jobs; d drivers; mode text; res jsonb;
begin
  select * into j from jobs where ref = p_ref;
  if not found or p_key is null or p_key = '' then return null; end if;
  if p_key = j.driver_key then mode := 'driver';
  elsif p_key = j.track_key then mode := 'track';
  else return null; end if;
  -- The chauffeur's action link expires 7 days after completion.
  if mode = 'driver' and exists (select 1 from job_status_stamps
      where job_id = j.id and status = 'Completed' and stamped_at < now() - interval '7 days') then
    return jsonb_build_object('expired', true, 'ref', j.ref);
  end if;
  select * into d from drivers where id = j.driver_id;

  res := jsonb_build_object(
    'mode', mode, 'ref', j.ref, 'status', j.status,
    'service_type', j.service_type, 'direction', j.direction, 'flight', j.flight,
    'pickup_location', j.pickup_location, 'dropoff_location', j.dropoff_location,
    'pickup_date', j.pickup_date, 'pickup_time', to_char(j.pickup_time, 'HH24:MI'),
    'pax_name', j.pax_name, 'pax_count', j.pax_count, 'pax_phone', j.pax_phone,
    'vehicle', j.vehicle, 'notes', j.notes,
    'driver', case when d.id is null then null else jsonb_build_object(
      'name', d.name, 'phone', d.phone, 'registration', d.registration) end,
    'stamps', coalesce((select jsonb_object_agg(s.status, s.stamped_at)
                        from job_status_stamps s where s.job_id = j.id), '{}'::jsonb));
  if mode = 'driver' then
    res := res || jsonb_build_object('chauffeur_price', j.chauffeur_price,
      'car_park', j.car_park, 'congestion', j.congestion);
  else
    res := res - 'notes';  -- "Notes for chauffeur" are never shown to the client
  end if;
  return res;
end $$;

-- Chauffeur taps a status step. Only the driver_key can do this; a
-- stamped step can never be un-stamped or re-stamped (one-way flow).
create or replace function public.public_job_stamp(p_ref text, p_key text, p_status text)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare j jobs;
begin
  select * into j from jobs where ref = p_ref for update;
  if not found or p_key is null or p_key <> j.driver_key then
    raise exception 'Link not valid' using errcode = '28000';
  end if;
  if exists (select 1 from job_status_stamps where job_id = j.id and status = 'Completed'
             and stamped_at < now() - interval '7 days') then
    raise exception 'This link has expired.';
  end if;
  if p_status not in ('EnRoute','At Pick Up','POB','Dropped off','Completed') then
    raise exception 'Unknown status';
  end if;
  if j.status = 'Cancelled' then
    raise exception 'This job has been cancelled by the office.';
  end if;
  insert into job_status_stamps (job_id, status) values (j.id, p_status)
    on conflict (job_id, status) do nothing;
  if found then
    update jobs set status = p_status, updated_at = now() where id = j.id;
  end if;
  return public.public_job(p_ref, p_key);
end $$;

-- Driver daily-update page: employee header + last 5 submissions.
create or replace function public.public_driver(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', e.id, 'name', e.name, 'basis', e.invoice_basis,
    'shift_hours', e.shift_hours, 'daily_wage', e.daily_wage,
    'extra_hour_rate', e.extra_hour_rate,
    'recent', coalesce((
      select jsonb_agg(x order by x.log_date desc) from (
        select l.log_date,
               to_char(l.start_time, 'HH24:MI') as start_time,
               to_char(l.end_time, 'HH24:MI')   as end_time,
               coalesce((select sum(amount) from shift_expenses where shift_log_id = l.id), 0) as expenses,
               coalesce((select sum(agreed_pay) from shift_extra_jobs where shift_log_id = l.id), 0) as extra_jobs
        from shift_logs l where l.employee_id = e.id
        order by l.log_date desc limit 5) x), '[]'::jsonb))
  from employees e where e.id = p_id;
$$;

-- Driver submits the day. Re-submitting the same date replaces it.
create or replace function public.public_submit_shift(
  p_id uuid, p_date date, p_start time, p_end time, p_note text,
  p_expenses jsonb, p_jobs jsonb)
returns jsonb language plpgsql volatile security definer set search_path = public as $$
declare log_id uuid; x jsonb;
begin
  if not exists (select 1 from employees where id = p_id) then
    raise exception 'Link not valid' using errcode = '28000';
  end if;
  if p_date is null then raise exception 'Date is required'; end if;
  if jsonb_array_length(coalesce(p_expenses, '[]')) > 10
     or jsonb_array_length(coalesce(p_jobs, '[]')) > 10 then
    raise exception 'Too many rows';
  end if;

  insert into shift_logs (employee_id, log_date, start_time, end_time, note)
    values (p_id, p_date, p_start, p_end, nullif(trim(p_note), ''))
    on conflict (employee_id, log_date) do update
      set start_time = excluded.start_time, end_time = excluded.end_time, note = excluded.note
    returning id into log_id;

  delete from shift_expenses   where shift_log_id = log_id;
  delete from shift_extra_jobs where shift_log_id = log_id;
  for x in select * from jsonb_array_elements(coalesce(p_expenses, '[]')) loop
    if coalesce(trim(x->>'label'), '') <> '' then
      insert into shift_expenses (shift_log_id, label, amount)
        values (log_id, left(trim(x->>'label'), 200), coalesce(nullif(x->>'amount', '')::numeric, 0));
    end if;
  end loop;
  for x in select * from jsonb_array_elements(coalesce(p_jobs, '[]')) loop
    if coalesce(trim(x->>'label'), '') <> '' then
      insert into shift_extra_jobs (shift_log_id, description, agreed_pay)
        values (log_id, left(trim(x->>'label'), 200), coalesce(nullif(x->>'amount', '')::numeric, 0));
    end if;
  end loop;
  return public.public_driver(p_id);
end $$;

-- Shareable fleet profile (/fleet/<id>).
create or replace function public.public_fleet(p_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'class', class, 'notes', notes, 'pax', pax,
    'luggage', luggage, 'description', description, 'profile_pic_url', profile_pic_url,
    'gallery_urls', coalesce(gallery_urls, '{}'), 'video_url', video_url)
  from fleet where id = p_id;
$$;

revoke all on function public.public_job(text, text) from public;
revoke all on function public.public_job_stamp(text, text, text) from public;
revoke all on function public.public_driver(uuid) from public;
revoke all on function public.public_submit_shift(uuid, date, time, time, text, jsonb, jsonb) from public;
revoke all on function public.public_fleet(uuid) from public;
grant execute on function public.public_job(text, text) to anon, authenticated;
grant execute on function public.public_job_stamp(text, text, text) to anon, authenticated;
grant execute on function public.public_driver(uuid) to anon, authenticated;
grant execute on function public.public_submit_shift(uuid, date, time, time, text, jsonb, jsonb) to anon, authenticated;
grant execute on function public.public_fleet(uuid) to anon, authenticated;
grant usage on sequence job_ref_seq, invoice_no_seq to authenticated;
