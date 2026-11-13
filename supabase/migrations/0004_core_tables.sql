-- ============================================================================
-- 0004_core_tables.sql
-- Scales.os core practice-data tables.
--
-- Creates the tables referenced by 0001 (RLS baseline) and 0003 (PDF limit
-- trigger) but never created by any prior migration. Safe to run multiple
-- times (IF NOT EXISTS / idempotent).
--
-- Apply in the Supabase SQL Editor after 0001–0003.
-- ============================================================================

create table if not exists public.user_progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  practice_id text not null,
  status      text not null check (status in ('practiced', 'mastered', 'stasis')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, practice_id)
);

create table if not exists public.scale_permutations_mastery (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  scale_permutation_id text not null,
  highest_mastered_bpm integer not null default 0,
  last_practiced_at  timestamptz,
  created_at         timestamptz not null default now(),
  unique (user_id, scale_permutation_id)
);

create table if not exists public.exercise_mastery (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  exercise_id        text not null,
  highest_mastered_bpm integer not null default 0,
  last_practiced_at  timestamptz,
  created_at         timestamptz not null default now(),
  unique (user_id, exercise_id)
);

create table if not exists public.practice_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  duration_minutes integer not null default 0,
  scales_practiced jsonb not null default '[]'::jsonb,
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

create table if not exists public.pdf_documents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  mode         text not null default 'technical' check (mode in ('technical', 'repertoire')),
  storage_path text not null,
  page_count   integer not null default 0,
  last_viewed_page integer not null default 1,
  created_at   timestamptz not null default now()
);

create table if not exists public.pdf_page_mappings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  document_id uuid not null references public.pdf_documents (id) on delete cascade,
  page_start  integer not null check (page_start >= 1),
  page_end    integer not null check (page_end >= page_start),
  exercise_id text not null default '',
  label       text not null default '',
  target_bpm  integer not null default 0 check (target_bpm >= 0 and target_bpm <= 300),
  time_signature text not null default '4/4',
  mode        text not null default 'technical' check (mode in ('technical', 'repertoire')),
  created_at  timestamptz not null default now()
);

-- Indexes for common query patterns

create index if not exists idx_user_progress_user_id on public.user_progress (user_id);
create index if not exists idx_user_progress_practice_id on public.user_progress (practice_id);

create index if not exists idx_scale_mastery_user_id on public.scale_permutations_mastery (user_id);
create index if not exists idx_scale_mastery_permutation on public.scale_permutations_mastery (scale_permutation_id);

create index if not exists idx_exercise_mastery_user_id on public.exercise_mastery (user_id);
create index if not exists idx_exercise_mastery_exercise on public.exercise_mastery (exercise_id);

create index if not exists idx_practice_logs_user_id on public.practice_logs (user_id);
create index if not exists idx_practice_logs_created_at on public.practice_logs (created_at desc);

create index if not exists idx_pdf_documents_user_id on public.pdf_documents (user_id);
create index if not exists idx_pdf_page_mappings_document on public.pdf_page_mappings (document_id, user_id);

-- Row Level Security (defensive: 0001 also applies it, but this ensures it
-- is on even if 0004 runs before 0001)

alter table public.user_progress enable row level security;
alter table public.scale_permutations_mastery enable row level security;
alter table public.exercise_mastery enable row level security;
alter table public.practice_logs enable row level security;
alter table public.pdf_documents enable row level security;
alter table public.pdf_page_mappings enable row level security;

drop policy if exists scales_owner_all on public.user_progress;
create policy scales_owner_all on public.user_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists scales_owner_all on public.scale_permutations_mastery;
create policy scales_owner_all on public.scale_permutations_mastery
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists scales_owner_all on public.exercise_mastery;
create policy scales_owner_all on public.exercise_mastery
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists scales_owner_all on public.practice_logs;
create policy scales_owner_all on public.practice_logs
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists scales_owner_all on public.pdf_documents;
create policy scales_owner_all on public.pdf_documents
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists scales_owner_all on public.pdf_page_mappings;
create policy scales_owner_all on public.pdf_page_mappings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());