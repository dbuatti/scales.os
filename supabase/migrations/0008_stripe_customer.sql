-- ============================================================================
-- 0008_stripe_customer.sql
-- Remember the Stripe customer id on the Scales entitlement profile so that
-- subscription.updated / subscription.deleted events (which carry no user id
-- and no email) can find the right account and grant or remove Pro.
--
-- IMPORTANT: this Supabase project is shared with another app. This migration
-- only touches public.scales_profiles, which is owned by Scales.
-- Safe to run multiple times.
-- ============================================================================

alter table public.scales_profiles
  add column if not exists stripe_customer_id text;

create unique index if not exists scales_profiles_stripe_customer_id_key
  on public.scales_profiles (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.scales_profiles.stripe_customer_id is
  'Stripe customer id captured at checkout; used to match later subscription events.';
