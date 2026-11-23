-- ============================================================================
-- 0009_celebrated_milestones.sql
-- Persist seen milestone celebrations per user so a refresh, a new tab or a
-- different device never replays the same popup. Safe to run multiple times.
-- ============================================================================

alter table public.scales_profiles
  add column if not exists celebrated_milestones jsonb not null default '[]'::jsonb;

comment on column public.scales_profiles.celebrated_milestones is
  'Milestone ids the user has already dismissed; prevents repeated celebration dialogs.';
