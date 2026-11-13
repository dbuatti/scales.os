export type Plan = 'free' | 'pro';

/** Free accounts keep this many method books in the cloud library. */
export const FREE_PDF_LIMIT = 2;

export const PRO_PRICE = {
  monthly: 5,
  annual: 49,
  annualPerMonth: 49 / 12,
} as const;

export const isProPlan = (plan: Plan | undefined | null): plan is 'pro' => plan === 'pro';

/** Checkout links are optional so the app still works before billing is wired. */
const env = import.meta.env as Record<string, string | undefined>;

export const PRO_CHECKOUT = {
  monthly: env.VITE_PRO_MONTHLY_URL ?? env.VITE_PRO_CHECKOUT_URL ?? '',
  annual: env.VITE_PRO_ANNUAL_URL ?? env.VITE_PRO_CHECKOUT_URL ?? '',
} as const;