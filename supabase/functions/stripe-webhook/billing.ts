/**
 * Pure helpers for the Stripe webhook. Kept free of Deno and remote imports so
 * the billing rules can be unit-tested with the app's regular test runner.
 */

export type ScalesPlan = 'free' | 'pro';

/** The subset of a Stripe event object the webhook actually reads. */
export interface StripeEventObject {
  client_reference_id?: string | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  payment_status?: string | null;
  status?: string | null;
  mode?: string | null;
  customer?: string | { id?: string } | null;
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing']);

/** Stripe sends `customer` as an id on events and sometimes as an expanded object. */
export function stripeCustomerId(value: unknown): string | null {
  if (typeof value === 'string') {
    const id = value.trim();
    return id.length > 0 ? id : null;
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'string' && id.trim().length > 0) return id.trim();
  }

  return null;
}

/** Normalise the email so legacy profiles can still be matched case-insensitively. */
export function customerEmail(object: StripeEventObject): string | null {
  const email = object.customer_details?.email ?? object.customer_email;
  return typeof email === 'string' && email.trim().length > 0
    ? email.trim().toLowerCase()
    : null;
}

/**
 * A subscription checkout grants Pro even when a trial means no payment was
 * taken. One-time payments still need a completed, paid session.
 */
export function planFromCheckoutSession(object: StripeEventObject): ScalesPlan {
  if (object.status !== 'complete') return 'free';
  if (object.mode === 'subscription') return 'pro';
  return object.payment_status === 'paid' ? 'pro' : 'free';
}

/** Anything other than active/trialing loses Pro, including cancellations. */
export function planFromSubscription(object: StripeEventObject): ScalesPlan {
  const status = object.status;
  return typeof status === 'string' && ACTIVE_SUBSCRIPTION_STATUSES.has(status)
    ? 'pro'
    : 'free';
}
