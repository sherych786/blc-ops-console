-- BLC Operations Console — Storage setup for Fleet media (photos/video)
-- Run this once in Supabase (SQL Editor), after schema.sql.

insert into storage.buckets (id, name, public)
values ('fleet-media', 'fleet-media', true)
on conflict (id) do nothing;

-- Logged-in staff can upload/replace/remove fleet photos & videos.
-- Anyone (including the public, e.g. a shared fleet profile page) can
-- view them, since the bucket itself is public.
drop policy if exists "fleet-media staff write" on storage.objects;
create policy "fleet-media staff write"
  on storage.objects for all
  using (bucket_id = 'fleet-media' and auth.role() = 'authenticated')
  with check (bucket_id = 'fleet-media' and auth.role() = 'authenticated');

drop policy if exists "fleet-media public read" on storage.objects;
create policy "fleet-media public read"
  on storage.objects for select
  using (bucket_id = 'fleet-media');
