# Scales.os

The practice log for piano technique. Structured scales and arpeggios, a metronome
that follows your tempo, and your method books (Hanon, Dohnányi, Czerny, any PDF) —
with every session logged so progress is measurable.

**Live surfaces**

- `/` — marketing site for signed-out visitors
- `/login` — sign in / create account
- `/` — practice workspace once signed in
- `/progress` — mastery, technique, history
- `/reader` — PDF method-book reader
- `/pro` — upgrade / early access
- `/business-plan` — admin-only billing and plan management

## Stack

React + TypeScript + Vite, Tailwind + shadcn/ui, Supabase (auth, Postgres, storage),
`pdfjs-dist`, `vite-plugin-pwa`. No server of our own.

## Getting started

```bash
pnpm install
cp .env.example .env   # add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
pnpm dev
```

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build (also regenerates the PWA manifest) |
| `pnpm typecheck` | TypeScript, no emit |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |

## Billing

Pro is wired end-to-end (entitlement table, RLS, database-enforced free limit, admin
plan management). The only external piece is a checkout URL. Setup takes about 15
minutes — see [BILLING.md](./BILLING.md).

Quick version:

1. Run `supabase/migrations/0003_entitlements.sql` in the Supabase SQL editor.
2. Insert your email into `public.admin_emails`.
3. Create a Stripe Payment Link (or Lemon Squeezy / Polar URL) and set
   `VITE_PRO_ANNUAL_URL` / `VITE_PRO_MONTHLY_URL`.
4. Manage plans in `/business-plan`.

Until a checkout URL is set, `/pro` collects early-access emails instead.

## Project layout

```
src/
  components/      app components (ui/ is generated shadcn — do not edit)
  context/         scales, repertoire, metronome, tempo, zen mode
  hooks/           session, plan, admin, repertoire data
  lib/             scales, progression, tempo, validation, plan
  pages/           Landing, Login, Index, Progress, Reader, Pro, BusinessPlan, Legal
supabase/migrations/
```

## Design rules

- Warm paper + deep bordeaux. Serif display type (`font-display`), sans UI.
- Use the `.surface` / `.surface-interactive` classes instead of ad-hoc cards.
- Motion is subtle and always respects `prefers-reduced-motion`.
- Never commit secrets. All env access goes through `src/lib/env.ts`.