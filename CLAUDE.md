@AGENTS.md

# CLAUDE.md — GDGC Hackathon 2026

## Mode: HACKATHON

This project runs in hackathon mode. Speed > perfection.

## Stack
- Next.js 16.2.6 App Router + TypeScript strict
- Tailwind v4 + shadcn/ui
- Gemini API (`src/lib/gemini.ts`)
- Supabase (`src/lib/supabase.ts`) — project: https://syffciafllpqgxcvdaih.supabase.co

## Overrides (this project only)

- No 80% test coverage requirement — skip tests unless explicitly asked
- No refactoring code you did not break
- No cleanup of pre-existing dead code
- `any` still banned — use typed alternatives
- `unknown` may be loosened to typed if it is blocking progress

## App: CivicTrust

BLACKOUT theme — post-solar-flare identity rebuilding. Trust score from physical docs + peer vouching + London heatmap.
See `docs/PLAN.md` for the full plan and `docs/TASKS.md` for per-person task list.

## Layer ownership

| Area | Owner | Path |
|------|-------|------|
| Full-stack lead, Gemini, heatmap, seed script | Ray | `src/lib/`, `src/components/map/`, `scripts/seed.ts` |
| Backend API (auth, claims, vouch, score, profile) | Aryan | `src/app/api/` |
| Backend API (rate limit, realtime, find) | Tao | `src/app/api/find`, `src/lib/rateLimit.ts`, `scripts/seedGov.ts` |
| UI Components | Hemish | `src/components/` |
| Pages + Routing | Maalav | `src/app/` (non-API) |
| Shared types (read-only for most) | All | `src/types/index.ts` |

**Each area has its own CLAUDE.md with specific instructions.**

## Key decisions (current, confirmed)

- **Auth**: node ID (BLK-XXXXX-LDN) + **password** (min 6 chars). No email. No PIN. No facial recognition.
- **Mandatory doc at signup**: passport OR driving licence (`MandatoryDocType`). Doc processed via `POST /api/claims` immediately after register.
- **Skill**: optional at registration — defaults to `'Other'` in DB. Users with skills are seeded.
- **Score formula**: `min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched * 20)`
- **Tiers**: `unverified` (0-24) | `verified` (25-59) | `trusted` (60-89) | `gov_official` (90+). Use `gov_official` — never `gov`.
- **Claim types**: identity | credential | work
- **Doc dedup**: GLOBAL — same physical document cannot be used by any two accounts
- **Yellow Pages** (`/find`): public skill/resource search. Profiles require login.
- **Post for help**: CUT — not building
- **Session**: HMAC-SHA256 signed token stored in `localStorage` as `civictrust_session`. Send as `Authorization: Bearer <token>`.
- **All writes go through API routes** using `supabaseAdmin` — never the anon client from the frontend

## Database — Tao's schema is canonical

**The live Supabase DB uses Tao's combined schema** (includes all tables, indexes, constraints, RLS policies). Do NOT run `scripts/schema-updates.sql` — it is superseded.

Tables: `users`, `claims`, `vouches`, `help_posts`, `gov_anchors`

Key column notes:
- `users.password_hash` — NOT `pin_hash` (renamed)
- `users.skill TEXT NOT NULL` — defaults to `'Other'` at registration
- `users.borough TEXT NOT NULL`
- `users.tier` — check constraint enforces `gov_official` spelling
- `claims.content_hash` — globally unique (partial index, NULLs excluded)

RLS policies use `auth.uid()` but **all API routes use `supabaseAdmin`** (service role key) which bypasses RLS entirely. Never use the anon `supabase` client for writes.

## Supabase clients — two exports from `src/lib/supabase.ts`

```ts
supabase      // anon client — respects RLS, use for client-side reads only
supabaseAdmin // service role — bypasses RLS, use in ALL API routes
```

## Auth helpers — `src/lib/auth.ts`

```ts
hashPassword(password: string): string        // SHA-256
generateNodeId(): string                       // BLK-XXXXX-LDN
signToken(userId: string): string              // HMAC-SHA256 signed
verifyAuth(request: Request): Promise<User | null>  // reads Bearer token, returns User row
```

## Score helpers — `src/lib/score.ts`

```ts
recalculateUserScore(userId: string): Promise<{ score: number; tier: TrustTier }>
// Queries verified claims + vouches + gov_anchors, updates user row, returns new values
```

## Types — `src/types/index.ts`

Key exports:
```ts
type TrustTier = 'unverified' | 'partial' | 'verified' | 'trusted' | 'gov_official'
type Tier = TrustTier  // alias
type MandatoryDocType = 'passport' | 'driving_licence'
type SkillTag = 'Doctor' | 'Engineer' | 'Legal' | 'Builder' | 'Nurse' | 'Other'
type DocType = 'passport' | 'driving_licence' | 'degree' | 'employer_letter' | 'nhs_card'

interface ScoreInput { claims_verified: number; vouches_received: number; gov_vouched: boolean }
calculateScore(input: ScoreInput): number
getTier(score: number): TrustTier

type ApiResponse<T> = { success: true; data: T } | { success: false; error: string }

interface Session { token: string; user_id: string; node_id: string; username: string | null; display_name: string; score: number; tier: TrustTier }
interface DocumentAnalysis { extracted_name: string | null; doc_type: DocType | string; institution: string | null; confidence: number }
```

## Aryan's API routes — ALL COMPLETE on `aryan` branch

| Route | Method | Auth | Notes |
|-------|--------|------|-------|
| `/api/auth/register` | POST | none | display_name, password, doc_type, borough, skill? → token, user_id, node_id |
| `/api/auth/login` | POST | none | identifier (node_id or @username), password → Session |
| `/api/auth/username` | PATCH | Bearer | Set unique @username |
| `/api/claims` | POST | Bearer | type, doc_type, image_base64 → claim + new score. Rate-limited 3/10min. Global dedup. |
| `/api/claims/[userId]` | GET | none | All claims for a user |
| `/api/vouch` | POST | Bearer | vouchee_id → new score. Rate-limited 5/24h. Requires voucher score ≥50. |
| `/api/vouch/flag` | POST | Bearer | claim_id → penalizes vouchers -15pts. Auto-rejects claim at 3 flags. |
| `/api/score/[userId]` | GET | none | { score, tier } |
| `/api/users/[username]` | GET | Bearer | Public profile + verified claims |

## Gemini — `src/lib/gemini.ts`

```ts
analyseDocument(imageBase64: string, docType: string): Promise<DocumentAnalysis>
// Returns: { extracted_name, doc_type, institution, confidence }
// content_hash is computed in claims/route.ts — NOT returned by analyseDocument
```

## Seed scripts

```bash
npx tsx scripts/seedGov.ts          # L0/L1 gov anchors (Tao's file)
npx tsx scripts/seed.ts             # Dr. Osei + 200 Londoners (Ray's file)
npx tsx scripts/seed.ts --wipe      # Wipe all data then re-seed
```

Demo passwords: seed users = `password123` | gov accounts = `govpassword99`
Dr. Osei: node_id `BLK-00471-LDN`, username `dr_osei`, Doctor, Southwark, score 74

## Next.js 16 gotchas

- `params` in route handlers is a Promise — always `await params`
- `middleware.ts` is deprecated → renamed to `proxy.ts` (Tao's rate limiting file should use `proxy.ts`)
- Use `Response.json()` and native `Request` — not `NextResponse`/`NextRequest` (those still work but aren't needed)

## Git workflow

```
main  — demo-ready only. Never commit directly.
dev   — integration branch. All feature branches merge here.
aryan — Aryan's working branch (push here, merge to dev when ready)
```

```bash
git checkout aryan && git pull
# work...
git push origin aryan
# when ready to integrate:
git checkout dev && git pull && git merge aryan && git push
```

Shared files (`src/types/`, `src/lib/`) — announce in group chat before touching.

## Commit format

```
feat: add user input form
fix: null check on gemini response
chore: install @google/generative-ai
```

Conventional commits. ASCII only. Imperative mood. No trailing period.

## Testing on Windows (use curl.exe, NOT Invoke-WebRequest)

```bash
# Register
curl.exe -s -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d "{\"display_name\":\"Sarah Mitchell\",\"password\":\"testpass123\",\"doc_type\":\"passport\",\"borough\":\"Southwark\"}"

# Login
curl.exe -s -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"identifier\":\"BLK-XXXXX-LDN\",\"password\":\"testpass123\"}"

# Score (public)
curl.exe -s http://localhost:3000/api/score/USER_ID

# Claims (set USE_FALLBACKS=true in .env.local first)
curl.exe -s -X POST http://localhost:3000/api/claims -H "Content-Type: application/json" -H "Authorization: Bearer TOKEN" -d "{\"type\":\"identity\",\"doc_type\":\"passport\",\"image_base64\":\"dGVzdA==\"}"
```

## Frontend design

- Use shadcn/ui components — do not build primitives from scratch
- Tailwind v4 utility classes preferred. Inline styles allowed where Tailwind is insufficient.
- Mobile-first responsive layout
- Keep components under 200 lines — extract if larger
- Judges see the demo on a laptop — optimise for that viewport

## Demo-path-first

Every feature must connect to the runnable demo. If it cannot be shown in 4 minutes, it does not ship.

## Fallbacks

`src/lib/fallbacks.ts` — toggle `USE_FALLBACKS=true` in `.env.local` to skip Gemini during demo.

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
| `src/lib/supabase.ts` | Exports `supabase` (anon) + `supabaseAdmin` (service role) |
| `src/lib/auth.ts` | `hashPassword`, `signToken`, `verifyAuth`, `generateNodeId` |
| `src/lib/score.ts` | `recalculateUserScore` — call after any claim or vouch |
| `src/lib/gemini.ts` | `analyseDocument()` + `generateText()` |
| `src/lib/realtime.ts` | `subscribeToUserScore()` — Tao implements, Hemish uses |
| `src/lib/fallbacks.ts` | Mock data — toggle with `USE_FALLBACKS=true` |
| `scripts/seed.ts` | Main seed script (Ray) |
| `scripts/seedGov.ts` | Gov anchor helper (Tao) — called by seed.ts |
| `docs/PLAN.md` | Full implementation plan |
| `docs/TASKS.md` | Per-person task list |
