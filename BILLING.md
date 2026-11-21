# Billing setup (15 minutes, no code)

Pro is already wired in the product. The only missing piece is a checkout URL and an
admin account. Both are configuration, not engineering.

## Deploying Edge Functions

Use `scripts/deploy-supabase.sh`. It pins the project ref, deploys both functions with
the correct JWT settings, applies Stripe secrets if present, and verifies the result.
It does not depend on whichever Supabase account the CLI is currently logged into.

```bash
./scripts/deploy-supabase.sh
```

One-time token setup, if `~/.config/scales/supabase.env` is missing or your Supabase
access token was rotated:

```bash
supabase login                         # in your own terminal, then:
mkdir -p ~/.config/scales
umask 077
printf 'SUPABASE_ACCESS_TOKEN=%s\n' \
  "$(security find-generic-password -s 'Supabase CLI' -a supabase -w)" \
  > ~/.config/scales/supabase.env
```

Stripe keys go in `~/.config/scales/stripe.env` (mode 600), never in this repo:

```
STRIPE_WEBHOOK_SECRET=whsec_...
# Optional: only needed to resolve customers who paid before the
# stripe_customer_id column existed.
STRIPE_SECRET_KEY=sk_...
```

The webhook verifies Stripe signatures with `STRIPE_WEBHOOK_SECRET` and gets the
user id from `client_reference_id` on checkout or from the saved Stripe customer
id on later subscription events, so a secret API key is not required for new
subscribers.

## 1. Apply the entitlements migration

Supabase → SQL Editor → New query → paste `supabase/migrations/0003_entitlements.sql` → Run.

This creates `scales_profiles`, `admin_emails` and `pro_waitlist`, adds RLS, creates a profile
automatically on signup, and enforces the 2-book free limit at the database level.

Then run `supabase/migrations/0008_stripe_customer.sql`. It adds one nullable column to
`scales_profiles` so the webhook can match cancellation events to the right account. Both
migrations only touch Scales-owned tables — the shared Supabase project's other app is
unaffected.

## 2. Make yourself an admin

In the same SQL editor:

```sql
insert into public.admin_emails (email)
values ('you@example.com')
on conflict (email) do nothing;
```

Then sign in and open `/business-plan`. You can see every account and flip plans
Free ↔ Pro without touching SQL.

## 3. Create a checkout link

Fastest path — Stripe Payment Links (no backend):

1. Stripe Dashboard → Payment Links → New.
2. Product: "Scales Pro (annual)" — $49/year, recurring.
3. After creating, copy the URL.
4. Repeat for "Scales Pro (monthly)" — $5/month.

Then set the env vars (Vercel → Settings → Environment Variables, and local `.env`):

```
VITE_PRO_ANNUAL_URL=https://buy.stripe.com/...
VITE_PRO_MONTHLY_URL=https://buy.stripe.com/...
```

Redeploy. `/pro` now sends people straight to checkout.

> Prefer a merchant of record (Lemon Squeezy / Polar) for automatic EU VAT? Paste
> their hosted checkout URL into the same variables. Nothing else changes.

## 4. Grant Pro when someone pays

The included webhook does this automatically once deployed (see "Automate Pro grants"
below). Until then, grant plans manually in `/business-plan` → Billing & access → set the
account to Pro. The app re-reads the plan on next load (and within 60s via React Query).

The client never needs payment secrets: it only passes the signed-in user's id to checkout
as `client_reference_id`.

## 5. Waitlist (only if checkout is not configured)

If the checkout URLs are empty, `/pro` collects emails into `public.pro_waitlist`.
View them in `/business-plan` → Billing & access.

---

### What is enforced where

| Limit | Enforced by |
| --- | --- |
| Free plan = 2 cloud PDFs | Postgres trigger on `pdf_documents` + client guard |
| Only admins change plans | Postgres trigger on `scales_profiles` + RLS |
| Admin can read all accounts | RLS policy backed by `public.is_admin()` |
| Waitlist is public-write, admin-read | RLS policies on `pro_waitlist` |

The client checks are for UX only. The database is the source of truth.

## Automate Pro grants (required before taking payments)

The repo includes a Stripe webhook that flips `scales_profiles.plan` in both directions.

```bash
# 1. Run supabase/migrations/0008_stripe_customer.sql in the SQL editor first.
# --no-verify-jwt is required: Stripe sends a Stripe signature, not a Supabase JWT.
supabase functions deploy stripe-webhook --no-verify-jwt
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
# Optional, for pre-0008 subscribers only:
supabase secrets set STRIPE_SECRET_KEY=sk_...
```

Then in Stripe → Developers → Webhooks → Add endpoint:

- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

The checkout link the app sends includes `client_reference_id=<supabase user id>`. The
webhook saves the Stripe customer id on the profile, so later subscription events — which
carry only a customer id — can grant Pro **or take it away when someone cancels** without
matching email addresses. Subscribers who paid before migration 0008 are matched once by
fetching their email from Stripe. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
injected automatically inside Edge Functions — never put the service-role key in the
browser or in `VITE_*` variables.

Until this is deployed, granting Pro in `/business-plan` remains the manual path and
cancellations will not downgrade accounts.

## Self-serve account deletion (required for app stores)

Deploy the companion function:

```bash
supabase functions deploy delete-account
```

Keep JWT verification **on** for this one (the default). The function reads the caller's
user id from the verified access token, never from the request body.

Users then find **Settings → Danger zone → Delete my Scales account** on desktop and
mobile. The function verifies the caller's Supabase access token and deletes:

- rows in Scales' six practice tables and the `scales_profiles` entitlement row;
- files under `<user-id>/` in the private `practice-pdfs` storage bucket;
- cached PDFs in the browser's IndexedDB (cleared by the client).

It deliberately does **not** delete `auth.users` or the other app's tables in this shared
Supabase project, so the same login keeps working elsewhere. The Privacy page says so
explicitly. No extra secrets are needed — the function uses the injected service-role key.
