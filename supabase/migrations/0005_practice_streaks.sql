-- ============================================================================
-- 0005_practice_streaks.sql
-- Scales.os practice streak tracking.
--
-- Persists current/longest streak and last practice date per user so the
-- streak survives across devices and sessions.
-- Safe to run multiple times (IF NOT EXISTS).
-- Apply after 0004_core_tables.sql.
-- ============================================================================

create table if not exists public.practice_streaks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_practice_date date not null default CURRENT_DATE,
  updated_at     timestamptz not null default now(),
  unique (user_id)
);

create index if not exists idx_practice_streaks_user_id on public.practice_streaks (user_id);

alter table public.practice_streaks enable row level security;

drop policy if exists scales_owner_all on public.practice_streaks;
create policy scales_owner_all on public.practice_streaks
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());