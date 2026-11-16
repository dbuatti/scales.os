-- ============================================================================
-- 0007_default_repertoire.sql
-- Shared default repertoire templates for new users.
--
-- Creates a global table of default page mappings keyed by storage_path.
-- The app copies matching rows into pdf_page_mappings when default docs are
-- first inserted for a user. Safe to run multiple times.
-- ============================================================================

create table if not exists public.default_page_mappings (
  storage_path text not null,
  page_start   integer not null check (page_start >= 1),
  page_end     integer not null check (page_end >= page_start),
  exercise_id  text not null default '',
  label        text not null default '',
  target_bpm   integer not null default 0 check (target_bpm >= 0 and target_bpm <= 300),
  time_signature text not null default '4/4',
  mode         text not null default 'technical' check (mode in ('technical', 'repertoire'))
);

create index if not exists idx_default_page_mappings_storage on public.default_page_mappings (storage_path);

alter table public.default_page_mappings enable row level security;

-- Only authenticated users can read the templates (needed to seed their own copies).
drop policy if exists default_page_mappings_read on public.default_page_mappings;
create policy default_page_mappings_read on public.default_page_mappings
  for select to authenticated using (true);

-- No user_id column: templates are global; seeding is done app-side.