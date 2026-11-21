import { z } from 'zod';

/**
 * Public support contact. Optional so local/dev builds still work, but a
 * production launch should set VITE_SUPPORT_EMAIL: the privacy policy, terms,
 * payment providers and app stores all expect a reachable contact address.
 */
const runtimeEnv = import.meta.env as Record<string, string | undefined>;

const parsed = z
  .string()
  .trim()
  .email()
  .regex(/^[\x20-\x7e]*$/)
  .safeParse(runtimeEnv.VITE_SUPPORT_EMAIL ?? '');

export const SUPPORT_EMAIL: string | null = parsed.success ? parsed.data : null;

export const supportMailto = (subject?: string): string | null => {
  if (!SUPPORT_EMAIL) return null;
  return subject
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`
    : `mailto:${SUPPORT_EMAIL}`;
};
