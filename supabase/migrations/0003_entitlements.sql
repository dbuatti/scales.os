-- ============================================================================
-- 0003_entitlements.sql
-- Scales.os plans, entitlements, admin grants and the Pro waitlist.
--
-- IMPORTANT: this Supabase project is shared with another app that already owns
-- public.profiles (first_name/last_name/etc). Scales uses a dedicated
-- public.scales_profiles table so it never touches that schema.
--
-- Apply once in the Supabase SQL editor. Safe to run multiple times.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.scales_profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  plan        text not null default 'free' check (plan in ('free', 'pro')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.scales_profiles is 'Scales.os entitlement profile. One row per auth user.';

create table if not exists public.admin_emails (
  email       text primary key,
  created_at  timestamptz not null default now()
);

comment on table public.admin_emails is 'Emails allowed to manage plans. Managed by SQL only.';

create table if not exists public.pro_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  source      text not null default 'pro',
  created_at  timestamptz not null default now()
);

create unique index if not exists pro_waitlist_email_key
  on public.pro_waitlist (lower(email));

comment on table public.pro_waitlist is 'Early-access requests captured before checkout is wired.';

alter table public.scales_profiles  enable row level security;
alter table public.admin_emails     enable row level security;
alter table public.pro_waitlist     enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

comment on function public.is_admin() is 'True when the current JWT email is in admin_emails.';

-- ---------------------------------------------------------------------------
-- scales_profiles: RLS
-- ---------------------------------------------------------------------------

drop policy if exists scales_profiles_select_own   on public.scales_profiles;
drop policy if exists scales_profiles_select_admin on public.scales_profiles;
drop policy if exists scales_profiles_update_own   on public.scales_profiles;
drop policy if exists scales_profiles_update_admin on public.scales_profiles;

create policy scales_profiles_select_own
  on public.scales_profiles for select to authenticated
  using (id = auth.uid());

create policy scales_profiles_select_admin
  on public.scales_profiles for select to authenticated
  using (public.is_admin());

create policy scales_profiles_update_own
  on public.scales_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy scales_profiles_update_admin
  on public.scales_profiles for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- scales_profiles: plan guard + timestamps
-- ---------------------------------------------------------------------------

create or replace function public.enforce_plan_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for service-role writes (e.g. a Stripe webhook).
  if new.plan is distinct from old.plan
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an admin can change a plan.' using errcode = '42501';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists scales_profiles_plan_guard on public.scales_profiles;
create trigger scales_profiles_plan_guard
  before update on public.scales_profiles
  for each row execute function public.enforce_plan_update();

-- ---------------------------------------------------------------------------
-- scales_profiles: create one automatically on signup
-- (separate from the other app's on_auth_user_created trigger)
-- ---------------------------------------------------------------------------

create or replace function public.handle_scales_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.scales_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_scales_user_created on auth.users;
create trigger on_scales_user_created
  after insert on auth.users
  for each row execute function public.handle_scales_user();

-- Backfill anyone who signed up before this migration.
insert into public.scales_profiles (id, email)
select u.id, u.email
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- PDF limit: free accounts keep 2 method books
-- ---------------------------------------------------------------------------

create or replace function public.enforce_pdf_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plan text;
begin
  select plan into v_plan from public.scales_profiles where id = new.user_id;

  if coalesce(v_plan, 'free') <> 'pro' then
    if (select count(*) from public.pdf_documents where user_id = new.user_id) >= 2 then
      raise exception 'FREE_PDF_LIMIT' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

do $$
begin
  if to_regclass('public.pdf_documents') is not null then
    execute 'drop trigger if exists pdf_limit_guard on public.pdf_documents';
    execute 'create trigger pdf_limit_guard
      before insert on public.pdf_documents
      for each row execute function public.enforce_pdf_limit()';
  else
    raise notice 'skipping pdf_limit_guard: public.pdf_documents does not exist yet';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Waitlist: anyone can join, only admins can read
-- ---------------------------------------------------------------------------

drop policy if exists waitlist_insert_any   on public.pro_waitlist;
drop policy if exists waitlist_select_admin on public.pro_waitlist;

create policy waitlist_insert_any
  on public.pro_waitlist for insert to anon, authenticated
  with check (char_length(email) between 3 and 254);

create policy waitlist_select_admin
  on public.pro_waitlist for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Done. Add your admin address:
--   insert into public.admin_emails (email) values ('you@example.com')
--   on conflict (email) do nothing;
-- ============================================================================