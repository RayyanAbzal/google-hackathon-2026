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

## Layer ownership

Only touch files in the assigned owner's area unless explicitly told otherwise.

| Area | Owner | Path |
|------|-------|------|
| AI / Gemini infra + Supabase + Vercel | Ray | `src/lib/` |
| Backend / API routes | Aryan | `src/app/api/` |
| Frontend / UI components | Hemish | `src/components/` |
| Pages / routing | Maalav | `src/app/` (non-API) |
| Types | All | `src/types/` |

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
