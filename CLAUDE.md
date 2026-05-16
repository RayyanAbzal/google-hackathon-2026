@AGENTS.md

# CLAUDE.md — GDGC Hackathon 2026

## Mode: HACKATHON

This project runs in hackathon mode. Speed > perfection.

## Stack
- Next.js 15 App Router + TypeScript strict
- Tailwind v4 + shadcn/ui
- Gemini API (`src/lib/gemini.ts`)
- Supabase (`src/lib/supabase.ts`)

## Overrides (this project only)

- No 80% test coverage requirement — skip tests unless explicitly asked
- No refactoring code you did not break
- No cleanup of pre-existing dead code
- `any` still banned — use typed alternatives
- `unknown` may be loosened to typed if it is blocking progress

## App: CivicTrust (name TBD)

BLACKOUT theme — trust score from physical docs + peer vouching + London heatmap.
See `docs/PLAN.md` for the full plan.

## Layer ownership

| Area | Owner | Path |
|------|-------|------|
| Full-stack lead, Gemini, DB, heatmap | Ray | All of `src/` |
| Backend API (auth, claims, vouch, score) | Aryan | `src/app/api/` |
| Backend API (rate limit, realtime, find, help) | Tao | `src/app/api/` |
| UI Components | Hemish | `src/components/` |
| Pages + Routing | Maalav | `src/app/` (non-API) |
| Shared types | All (read only) | `src/types/` |
| Lib / Supabase / Gemini | Ray | `src/lib/` |

**Each area has its own CLAUDE.md with specific instructions.**

## Key decisions

- Auth: node ID + 4-digit PIN. No email. No facial recognition.
- Mandatory doc at signup: passport OR driving licence
- Score: 0–49 Unverified, 50–89 Verified, 90–94 Trusted, 95+ Gov Official
- Score formula: `min(100, claims_verified * 15 + vouches_received * 10)`
- 3 claim types: Identity, Credential, Work
- Yellow Pages (/find): public search by skill OR resource
- Post for help (/help): registered users post requests, Verified users respond
- All demo data is fake and pre-seeded — Ray runs seed script before demo

## Database — Ray owns this

Ray creates and manages all Supabase tables, migrations, and RLS policies.
Do not write SQL or touch the Supabase dashboard without checking with Ray first.
Use `src/lib/supabase.ts` for all DB access.

## Frontend design with Claude Code

When working on frontend/UI:
- Use shadcn/ui components — do not build primitives from scratch
- Tailwind v4 utility classes only — no inline styles
- Mobile-first responsive layout
- Keep components under 200 lines — extract if larger
- Judges see the demo on a laptop — optimise for that viewport

## Commit format

```
feat: add user input form
fix: null check on gemini response
chore: install @google/generative-ai
```

Conventional commits. ASCII only. Imperative mood. No trailing period.

## Demo-path-first

Every feature must connect to the runnable demo. If it cannot be shown in 4 minutes, it does not ship.

## Fallbacks

`src/lib/fallbacks.ts` contains mock data for all external services.
Toggle `USE_FALLBACKS=true` in `.env.local` to activate.
Flip this if any API fails during the demo.
