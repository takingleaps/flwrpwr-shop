-- FLWRPWR — image uploads (Supabase Storage)
-- Run ONCE in the Supabase dashboard: SQL Editor -> paste -> Run.
-- Creates a public bucket "flwrpwr-images" so the admin's picture panel can
-- upload files and the live site can show them. Until this is run, the
-- picture panel still works with pasted image links, and uploads show a
-- message pointing here.
--
-- NOTE: uploads are open to anyone who can reach the admin page (same as the
-- admin's anon-key text saves). If that ever needs tightening, change the
-- insert/update policies below to `authenticated` and sign uploads with the
-- admin's login session instead of the anon key.

insert into storage.buckets (id, name, public)
values ('flwrpwr-images', 'flwrpwr-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read images" on storage.objects;
create policy "Public read images" on storage.objects
  for select using (bucket_id = 'flwrpwr-images');

drop policy if exists "Admin upload images" on storage.objects;
create policy "Admin upload images" on storage.objects
  for insert with check (bucket_id = 'flwrpwr-images');

drop policy if exists "Admin update images" on storage.objects;
create policy "Admin update images" on storage.objects
  for update using (bucket_id = 'flwrpwr-images') with check (bucket_id = 'flwrpwr-images');
