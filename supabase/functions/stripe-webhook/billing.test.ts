import { describe, expect, it } from 'vitest';
import {
  customerEmail,
  planFromCheckoutSession,
  planFromSubscription,
  stripeCustomerId,
} from './billing.ts';

describe('stripeCustomerId', () => {
  it('reads a plain customer id', () => {
    expect(stripeCustomerId('cus_123')).toBe('cus_123');
  });

  it('reads an expanded customer object', () => {
    expect(stripeCustomerId({ id: 'cus_456' })).toBe('cus_456');
  });

  it('returns null for missing or unusable values', () => {
    expect(stripeCustomerId(null)).toBeNull();
    expect(stripeCustomerId(undefined)).toBeNull();
    expect(stripeCustomerId('  ')).toBeNull();
    expect(stripeCustomerId({})).toBeNull();
  });
});

describe('customerEmail', () => {
  it('prefers customer_details and normalises the address', () => {
    expect(
      customerEmail({
        customer_details: { email: ' Player@Example.com ' },
        customer_email: 'other@example.com',
      }),
    ).toBe('player@example.com');
  });

  it('falls back to customer_email', () => {
    expect(customerEmail({ customer_email: 'Player@Example.com' })).toBe(
      'player@example.com',
    );
  });

  it('returns null when no email is present', () => {
    expect(customerEmail({})).toBeNull();
    expect(customerEmail({ customer_details: { email: '  ' } })).toBeNull();
  });
});

describe('planFromCheckoutSession', () => {
  it('grants Pro for a completed paid subscription', () => {
    expect(
      planFromCheckoutSession({
        status: 'complete',
        mode: 'subscription',
        payment_status: 'paid',
      }),
    ).toBe('pro');
  });

  it('grants Pro for a trial with no payment required', () => {
    expect(
      planFromCheckoutSession({
        status: 'complete',
        mode: 'subscription',
        payment_status: 'no_payment_required',
      }),
    ).toBe('pro');
  });

  it('withholds Pro for unpaid or incomplete sessions', () => {
    expect(
      planFromCheckoutSession({ status: 'complete', payment_status: 'unpaid' }),
    ).toBe('free');
    expect(
      planFromCheckoutSession({
        status: 'open',
        mode: 'subscription',
        payment_status: 'paid',
      }),
    ).toBe('free');
  });

  it('grants Pro for a completed one-time payment', () => {
    expect(
      planFromCheckoutSession({ status: 'complete', payment_status: 'paid' }),
    ).toBe('pro');
  });
});

describe('planFromSubscription', () => {
  it('keeps active and trialing subscriptions on Pro', () => {
    expect(planFromSubscription({ status: 'active' })).toBe('pro');
    expect(planFromSubscription({ status: 'trialing' })).toBe('pro');
  });

  it('downgrades cancelled and unpaid subscriptions', () => {
    expect(planFromSubscription({ status: 'canceled' })).toBe('free');
    expect(planFromSubscription({ status: 'unpaid' })).toBe('free');
    expect(planFromSubscription({ status: 'past_due' })).toBe('free');
  });

  it('fails closed when the status is missing', () => {
    expect(planFromSubscription({})).toBe('free');
  });
});
