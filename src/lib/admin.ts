// Admin access control for the private business-plan page.
// Set VITE_ADMIN_EMAIL (or a comma-separated VITE_ADMIN_EMAILS) in Vercel to
// grant access to specific email addresses. Leave unset and no one is admin.
const raw = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '';

export const ADMIN_EMAILS: string[] = raw
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isAdmin = (email: string | null | undefined): boolean =>
  Boolean(email) && ADMIN_EMAILS.includes(email.trim().toLowerCase());
