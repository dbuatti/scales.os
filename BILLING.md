# Billing setup (15 minutes, no code)

Pro is already wired in the product. The only missing piece is a checkout URL and an
admin account. Both are configuration, not engineering.

## 1. Apply the entitlements migration

Supabase → SQL Editor → New query → paste `supabase/migrations/0003_entitlements.sql` → Run.

This creates `scales_profiles`, `admin_emails` and `pro_waitlist`, adds RLS, creates a profile
automatically on signup, and enforces the 2-book free limit at the database level.

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

Until a webhook is wired, do it manually in `/business-plan` → Billing & access →
set the account to Pro. The app re-reads the plan on next load (and within 60s via
React Query).

To automate later: add a Stripe webhook that updates `public.scales_profiles.plan` with the
service role. The client never needs payment secrets.

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
## Automate Pro grants (optional, after the first manual grants)

The repo includes a Stripe webhook that flips `scales_profiles.plan` automatically.

```bash
supabase functions deploy stripe-webhook
supabase secrets set STRIPE_SECRET_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_...
```

Then in Stripe → Developers → Webhooks → Add endpoint:

- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

The checkout link the app sends includes `client_reference_id=<supabase user id>`, so the
webhook can find the account without matching email addresses. `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are injected automatically inside Edge Functions — never put
the service-role key in the browser or in `VITE_*` variables.

Until this is deployed, granting Pro in `/business-plan` remains the manual path.
