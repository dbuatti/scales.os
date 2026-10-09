# AGENTS.md — Scales.os

## Tech stack (authoritative)
- React + TypeScript + Vite. Source lives in `src/`.
- Pages in `src/pages/`, components in `src/components/`, context in `src/context/`.
- Routing with React Router — keep routes in `src/App.tsx`.
- **UI: shadcn/ui + Radix + Tailwind CSS.** Always use shadcn/ui primitives; never hand-roll a control that shadcn already provides. Do NOT edit files in `src/components/ui/` — wrap/extend in a new component instead.
- Icons: `lucide-react`. Validation: `zod`. State: React context. Charts: `recharts`.
- Never commit secrets. Env vars go through `src/lib/env.ts` (Zod-validated, ASCII-only).

## UI & aesthetic execution rules
- **Typography**: system sans stack (`Inter, ui-sans-serif, system-ui, -apple-system`). Headings crisp with `tracking-tight` / `-0.02em`. Use the existing `font-bold`/`font-black` scale; avoid `font-mono` for prose, `text-glow`, `animate-pulse`.
- **Spacing**: work on a 4px/8px grid. No random margins — use `gap-*`, `space-y-*`, and consistent card padding (`p-5`/`px-6 py-4`).
- **Color**: dominant neutral background via theme tokens (`bg-background`, `bg-card`, `bg-muted`). Accent (primary) only for actions/active states. Avoid pure `#000` and high-saturation primaries. Prefer the shadcn semantic tokens (`text-muted-foreground`, `border-border/60`, `bg-primary/10`).
- **Borders & shadows**: thin, subtle borders (`border border-border/60`) and soft layered shadows (`shadow-sm`; `shadow-md` on hover). No `border-2`, no harsh `shadow-inner`/`shadow-lg` except for floating panels.
- **Micro-interactions**: `transition-all duration-200` (or `duration-150`) on hover/focus/active; `active:scale-[0.98]` for buttons; `focus-visible:ring-2 ring-ring ring-offset-2` for a11y. Keep `focus-scale` convention.
- **Cards**: `rounded-xl border bg-card/50 p-5 shadow-sm`. Icon chips: `rounded-lg bg-primary/10 p-2 text-primary`. Labels: `text-xs font-bold uppercase tracking-wider text-muted-foreground`.
- **Components**: small, single-responsibility. Extract reusable pieces into `src/components/` rather than growing monoliths. Follow existing patterns for naming and props.

## Process
- Fix/verify with `pnpm typecheck`, `pnpm test`, `pnpm lint`, `pnpm build` after changes.
- Never accept a raw first draft of a UI change — do a polish pass: whitespace balance, font weight hierarchy, hover/active states, consistent spacing.
