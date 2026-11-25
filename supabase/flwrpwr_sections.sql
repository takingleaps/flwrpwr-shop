-- FLWRPWR — section order + visibility
-- Run ONCE in the Supabase dashboard: SQL Editor -> paste -> Run.
-- (Do NOT run from the site. The admin panel shows this same SQL until the
-- table exists, and saving the section order fails until it has been run.)
-- Access mirrors flwrpwr_content: public read, anon write from the admin page.

create table if not exists public.flwrpwr_sections (
  key text primary key,
  sort_order integer not null,
  visible boolean not null default true
);

alter table public.flwrpwr_sections enable row level security;

drop policy if exists "Public read sections" on public.flwrpwr_sections;
create policy "Public read sections" on public.flwrpwr_sections
  for select using (true);

drop policy if exists "Admin write sections" on public.flwrpwr_sections;
create policy "Admin write sections" on public.flwrpwr_sections
  for insert with check (true);

drop policy if exists "Admin update sections" on public.flwrpwr_sections;
create policy "Admin update sections" on public.flwrpwr_sections
  for update using (true) with check (true);

-- Seed the site's current section order (top to bottom on flwrpwr.co),
-- so creating the table changes nothing until the team reorders in the admin.
insert into public.flwrpwr_sections (key, sort_order, visible) values
  ('hero',     1, true),
  ('vibe',     2, true),
  ('find-us',  3, true),
  ('shop',     4, true),
  ('story',    5, true),
  ('events',   6, true),
  ('join',     7, true),
  ('feed',     8, true),
  ('footer',   9, true)
on conflict (key) do nothing;
