@AGENTS.md

# CLAUDE.md — GDGC Hackathon 2026

## Mode: HACKATHON

This project runs in hackathon mode. Speed > perfection.

## Stack
- Next.js 16 App Router + TypeScript strict
- Tailwind v4 + shadcn/ui
- Gemini API (`src/lib/gemini.ts`)
- Supabase (`src/lib/supabase.ts`)

## Overrides (this project only)

- No 80% test coverage requirement — skip tests unless explicitly asked
- No refactoring code you did not break
- No cleanup of pre-existing dead code
- `any` still banned — use typed alternatives
- `unknown` may be loosened to typed if it is blocking progress

## Layer ownership

| Area | Owner | Path |
|------|-------|------|
| Full-stack lead, Gemini, heatmap, seed | Ray | all of `src/` |
| Backend / API routes (core) | Aryan | `src/app/api/` |
| Backend / API routes (features) | Tao | `src/app/api/` (find, help, rate limiting) |
| Frontend / UI components | Hemish | `src/components/` |
| Pages / routing | Maalav | `src/app/` (non-API) |
| Shared types | All | `src/types/` |

## Git workflow

```
main   — demo-ready only. Ray merges dev -> main before the demo. Never commit here directly.
dev    — integration branch. All feature branches merge here. This is where development happens.
```

Branch off `dev` for all work:

```bash
git checkout dev && git pull
git checkout -b yourname/feature-slug
# work...
git checkout dev && git pull && git merge yourname/feature-slug && git push
git branch -d yourname/feature-slug
```

Shared files (`src/types/`, `src/lib/`) — announce in group chat before touching.

## Commit format

```
feat: add user input form
fix: null check on gemini response
chore: install @google/generative-ai
```

Conventional commits. ASCII only. Imperative mood. No trailing period.

## Frontend design with Claude Code

When working on frontend/UI:
- Use shadcn/ui components — do not build primitives from scratch
- Tailwind v4 utility classes only — no inline styles
- Mobile-first responsive layout
- Keep components under 200 lines — extract if larger
- Judges see the demo on a laptop — optimise for that viewport

## Demo-path-first

Every feature must connect to the runnable demo. If it cannot be shown in 4 minutes, it does not ship.

## Fallbacks

`src/lib/fallbacks.ts` contains mock data for all external services.
Toggle `USE_FALLBACKS=true` in `.env.local` to activate.
Flip this if any API fails during the demo.

## Key files

| File | Purpose |
|------|---------|
| `src/types/index.ts` | All shared types — import from here, never define elsewhere |
| `src/lib/supabase.ts` | Supabase client — never create a new one |
| `src/lib/gemini.ts` | `analyseDocument()` + `generateText()` |
| `src/lib/realtime.ts` | `subscribeToUserScore()` for live score updates |
| `src/lib/fallbacks.ts` | Mock data — toggle with `USE_FALLBACKS=true` |
| `src/middleware.ts` | Rate limiting (Tao) — must stay at this path |
| `supabase/migrations/0001_init.sql` | Full DB schema — run in Supabase SQL editor |
| `scripts/seed.ts` | Seed 200 fake Londoners + gov anchors (Ray) |
| `.env.local.example` | Copy to `.env.local` and fill in keys |
