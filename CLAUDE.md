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

## App: CivicTrust (name TBD)

BLACKOUT theme — trust score from physical docs + peer vouching + London heatmap.
See `docs/PLAN.md` for the full plan.

## Layer ownership

| Area | Owner | Path |
|------|-------|------|
| Full-stack lead, Gemini, DB, heatmap | Ray | All of `src/` |
| Backend API (auth, claims, vouch, score) + Supabase | Aryan | `src/app/api/` |
| Backend API (rate limit, realtime, find) | Tao | `src/app/api/` |
| UI Components | Hemish | `src/components/` |
| Pages + Routing | Maalav | `src/app/` (non-API) |
| Shared types | All (read only) | `src/types/` |
| Lib / Supabase / Gemini | Ray | `src/lib/` |

**Each area has its own CLAUDE.md with specific instructions.**

## Key decisions

- Auth: node ID + password. No email. No facial recognition.
- Mandatory doc at signup: passport OR driving licence. Everyone starts Unverified.
- Score: 0-24 Unverified, 25-59 Verified, 60-89 Trusted, 90-100 Gov Official
- Score formula: `min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched * 20)`
- 3 claim types: Identity, Credential, Work
- Yellow Pages (/find): public search by skill OR resource. Profiles need login to view.
- Post for help: CUT — not building this feature
- All demo data is fake and pre-seeded — Ray runs seed script before demo

## Database — Ray owns this

Ray creates and manages all Supabase tables, migrations, and RLS policies.
Do not write SQL or touch the Supabase dashboard without checking with Ray first.
Use `src/lib/supabase.ts` for all DB access.

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
- Tailwind v4 utility classes preferred. Inline styles allowed where Tailwind is insufficient.
- Mobile-first responsive layout
- Keep components under 200 lines — extract if larger
- Judges see the demo on a laptop — optimise for that viewport

## Demo-path-first

Every feature must connect to the runnable demo. If it cannot be shown in 4 minutes, it does not ship.

## Fallbacks

`src/lib/fallbacks.ts` contains mock data for all external services.
Toggle `USE_FALLBACKS=true` in `.env.local` to activate.
Flip this if any API fails during the demo.

## Skills — invoke these by name

| Trigger | Skill |
|---|---|
| Before committing / "ready to PR" | `ship-check` |
| "review this" / after implementing | `code-review` |
| After adding auth or API routes | `security-review` |
| "audit the project" | `context-audit` |
| "add endpoint" / "new API route" | `add-api-route` |
| Architectural decision to record | `documentation-and-adrs` |
| "what should I build next" | `project-insights` |
| Before building any new feature | `superpowers:brainstorming` |
| "gather requirements" / new feature spec | `superpowers:requirements` |

**Plugin note:** `claude-plugins-official` injects 42 skills per session. Disable for read-only/research sessions: `~/.claude/settings.json` → remove from plugins list. Re-enable for implementation sessions.

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
| `scripts/seed.ts` | Seed 200 fake Londoners + Gov Officials (Ray) |
| `.env.local.example` | Copy to `.env.local` and fill in keys |
| `docs/PLAN.md` | Full implementation plan — read this first |
| `docs/TASKS.md` | Per-person task list with all routes and components |
