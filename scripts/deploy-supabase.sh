#!/usr/bin/env bash
# Deploy Scales.os Edge Functions to its pinned Supabase project.
#
# Auth lives in ~/.config/scales/supabase.env (mode 600), NOT in `supabase login`.
# That keeps deploys working while you switch between Supabase accounts.
# Stripe keys live in ~/.config/scales/stripe.env (optional, mode 600).
set -euo pipefail

PROJECT_REF="rqesjpnhrjdjnrzdhzgw"
SUPABASE_ENV="${SCALES_SUPABASE_ENV:-$HOME/.config/scales/supabase.env}"
STRIPE_ENV="${SCALES_STRIPE_ENV:-$HOME/.config/scales/stripe.env}"

if [[ ! -f "$SUPABASE_ENV" ]]; then
  echo "Missing $SUPABASE_ENV. Run the init-token step in BILLING.md." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$SUPABASE_ENV"
set +a

if [[ -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
  echo "SUPABASE_ACCESS_TOKEN is empty in $SUPABASE_ENV" >&2
  exit 1
fi

echo "Deploying Scales.os to $PROJECT_REF"
echo -n "Authenticated as: "
supabase whoami 2>/dev/null | head -1

# JWT verification stays ON: the function reads the user id from the token.
supabase functions deploy delete-account \
  --project-ref "$PROJECT_REF" --use-api

# Stripe signs with its own signature, so the gateway must not require a JWT.
supabase functions deploy stripe-webhook \
  --project-ref "$PROJECT_REF" --use-api --no-verify-jwt

if [[ -f "$STRIPE_ENV" ]]; then
  echo "Setting Stripe secrets from $STRIPE_ENV"
  supabase secrets set --env-file "$STRIPE_ENV" --project-ref "$PROJECT_REF"
else
  echo "WARNING: $STRIPE_ENV not found; Stripe secrets unchanged." >&2
fi

echo "Deployed functions:"
supabase functions list --project-ref "$PROJECT_REF" --output json 2>/dev/null \
  | python3 -c 'import json,sys; d=json.load(sys.stdin); [print("  {}: {}, verify_jwt={}, v{}".format(f["name"], f["status"], f["verify_jwt"], f["version"])) for f in d if f["name"] in ("delete-account","stripe-webhook")]'
