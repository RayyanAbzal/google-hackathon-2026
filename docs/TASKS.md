# CivicTrust — Full Task List

> BLACKOUT · GDGC UOA 2026 · Read PLAN.md first for full context.
> Branch off `dev` for all work. Never commit directly to dev or main.

---

## RAY — Full-stack Lead

**Branch:** `ray/setup`
**Scaffold done.** All files exist as owner-commented stubs. Pull `dev` and implement the bodies.
**Do these first — everyone else is blocked without the database.**

### Phase 1 — Database + Seed (do immediately)
- [ ] Create Supabase project, get URL + anon key, add to `.env.local` *(Aryan owns this — coordinate)*
- [ ] Run this SQL in Supabase SQL editor to create all tables:

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  skill TEXT DEFAULT 'Other',
  password_hash TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'unverified',
  borough TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  doc_type TEXT NOT NULL,
  extracted_name TEXT,
  extracted_institution TEXT,
  confidence FLOAT,
  content_hash TEXT,
  vouches INTEGER DEFAULT 0,
  flags INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vouches
CREATE TABLE vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vouchee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voucher_id, vouchee_id)
);

-- gov_officials
CREATE TABLE gov_officials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  organisation TEXT NOT NULL
);
```

- [ ] Enable Supabase Realtime on the `users` table (for live score updates)
- [ ] Set RLS policies — users can read all users, only write their own row
- [x] `src/lib/supabase.ts` — minimal client scaffold done. Add env vars to `.env.local` and it works.
- [ ] `src/lib/gemini.ts` — scaffold with function signatures exists. Implement `analyseDocument()` body (Gemini Vision call + response parsing).
- [ ] `scripts/seed.ts` — scaffold written with correct structure. Run it once Supabase is provisioned.
  - 3 Gov Official accounts (NHS admin, Met Police, London Council) — score 100, tier 'gov_official'
  - Dr. James Osei — score 74, Doctor, Southwark, pre-vouched
  - 200 fake Londoners across all boroughs — mix of scores 30–90, skill tags, vouch chains
  - Pre-built vouch relationships so map looks populated
- [ ] Run seed script, verify data appears in Supabase dashboard
- [ ] Confirm `USE_FALLBACKS=true` in `.env.local` still works as a fallback

### Phase 2 — AI + Map
- [x] London heatmap D3 component (`src/components/map/HeatMap.tsx`)
- [x] Skill pins layer on map (`src/components/map/SkillPin.tsx`)
- [ ] Wire map heatmap + pins from real Supabase data — currently uses `FALLBACK_USERS` and hardcoded `PINS` array in `src/app/map/page.tsx`. Do AFTER seed confirmed. Query: `from('users').select('borough, skill, tier, score').eq('tier', 'verified')`
- [ ] Live counter component: confirm "X / 9,000,000 verified" subscribes to Supabase realtime
- [ ] QR vouch flow glue — coordinate with Hemish (QR display) + Aryan (vouch API)

### Phase 3 — Demo prep
- [ ] Re-run seed script with final fake documents
- [ ] Test full demo path end-to-end (register → claim → vouch → verified → map)
- [ ] Test bad actor path (mismatched name doc → rejected)
- [ ] Verify `USE_FALLBACKS=true` works if Gemini API fails during demo
- [ ] Confirm heatmap shows populated London before Sarah registers

---

## ARYAN — Backend API (core) + Supabase

**Branch:** `aryan/api-core`
**Scaffold done.** All route files exist as 501 stubs with owner comments. Pull `dev` and implement.
**Owns:** Supabase project setup, all core API routes.

### Supabase setup (do first — blocks everyone)
- [x] Create Supabase project, get URL + anon key
- [x] Share URL + anon key with Ray for `.env.local`
- [x] Run the SQL schema in Supabase SQL editor — **done by Ray via MCP (2026-05-16)**
- [x] Set RLS policies — **done by Ray via MCP (2026-05-16)**
- [ ] **Enable Realtime on `users` table** — go to Supabase dashboard > Database > Replication > Tables > users > toggle on. Still needs doing manually.

### All routes to build

#### Auth
- [ ] `POST /api/auth/register`
  - Input: `{ display_name, password, doc_image_base64, doc_type }` — doc_type must be 'passport' or 'driving_licence' (required at signup, no skill selection)
  - Calls Ray's `analyseDocument()` to read the mandatory doc
  - Checks extracted name matches display_name (name consistency)
  - Hashes password with bcrypt
  - Generates node_id: `BLK-${randomInt(10000,99999)}-LDN`
  - Creates user row: score 0, tier 'unverified'
  - Returns: `{ node_id, display_name, score: 0, tier: 'unverified' }`

- [ ] `POST /api/auth/login`
  - Input: `{ identifier, password }` — identifier is node_id OR @username
  - Validates password hash match
  - Returns: `{ node_id, username, display_name, score, tier, skill }`
  - Store this in localStorage as `civictrust_session` on client

- [ ] `PATCH /api/auth/username`
  - Input: `{ node_id, username }` — requires auth
  - Validates username is unique and valid format (@handle)
  - Returns: `{ username }`
  - Note: only settable after first login — this is how users personalise their temp node ID

#### Claims
- [ ] `POST /api/claims`
  - Input: `{ user_id, type, doc_image_base64, doc_type }`
  - Calls `analyseDocument()` → gets extracted_name, confidence
  - Checks extracted_name matches user.display_name — if not, reject with error
  - Hashes doc content for dedup — if hash exists for this user, reject silently
  - Inserts claim row with status 'verified' if confidence > 0.7, else 'pending'
  - Recalculates score: `min(100, claims_verified * 15 + vouches * 10)`
  - Updates user.score and user.tier using `getTier()` from `src/types/index.ts`
  - Returns: `{ claim_id, score, tier }`

- [ ] `GET /api/claims/[userId]`
  - Returns all claims for a user with vouch counts
  - Requires auth

#### Vouching
- [ ] `POST /api/vouch`
  - Input: `{ voucher_id, vouchee_id }`
  - Checks voucher has score >= 50 (must be Verified to vouch)
  - Checks voucher hasn't already vouched this person
  - Checks voucher hasn't given 5+ vouches in last 24h (rate limit)
  - Inserts vouch row
  - Recalculates both users' scores
  - Returns: `{ voucher_score, vouchee_score }`

- [ ] `POST /api/vouch/flag`
  - Input: `{ claim_id, flagger_id }`
  - Marks claim as flagged
  - Finds all users who vouched the claim owner
  - Subtracts 15pts from each voucher's score
  - Updates tiers for affected users
  - Returns: `{ affected_vouchers: number }`

#### Users
- [ ] `GET /api/users/[username]`
  - Returns public profile: username, display_name, skill, score, tier, borough, claims
  - Requires auth AND score >= 50 (Verified). If logged in but score < 50: return 403 with `{ success: false, error: 'Must be Verified to view profiles. Submit a claim to raise your score.' }`

#### Score
- [ ] `GET /api/score/[userId]`
  - Returns current score + tier
  - Used by realtime subscription to confirm score after updates

### Score + tier logic — use in all routes
```typescript
// In src/types/index.ts — shared by all routes
function getTier(score: number): TrustTier {
  if (score >= 95) return 'gov_official'
  if (score >= 90) return 'trusted'
  if (score >= 50) return 'verified'
  if (score >= 30) return 'partial'
  return 'unverified'
}

function calculateScore(input: { claims_verified: number, vouches_received: number, gov_vouched: boolean }): number {
  return Math.min(100, input.claims_verified * 15 + input.vouches_received * 10 + (input.gov_vouched ? 20 : 0))
}
```

### Rules for all routes
- Return `{ success: boolean, data: T | null, error: string | null }` always
- Use `calculateScore()` and `getTier()` from `src/types/index.ts`
- Never expose raw Supabase errors — catch and return `{ success: false, error: 'Something went wrong' }`
- All routes that write require auth header check

---

## TAO — Backend API (features)

**Branch:** `tao/api-features`
**Scaffold done.** `src/middleware.ts`, `src/app/api/find/route.ts`, `src/lib/realtime.ts`, `scripts/seedGov.ts` all exist as stubs. Pull `dev` and implement.
**Depends on:** Ray's DB schema, Aryan's auth routes working.

### All tasks

#### Rate limiting
- [ ] Middleware at `src/middleware.ts` — checks rate limits before any API route:
  - Max 5 vouches per user per 24h (check vouches table)
  - Max 3 claim submissions per user per 10 min (check claims table)
  - Return 429 with `{ success: false, error: 'Rate limit exceeded' }` if breached

#### Yellow Pages API
- [ ] `GET /api/find`
  - Query params: `skill` (optional), `resource` (optional), `borough` (optional)
  - Search by EITHER skill (Doctor, Engineer, Legal, Builder) OR resource (insulin, water, tools)
  - Returns grouped results: `[{ borough, skill, count, avg_score }]`
  - No auth required for counts
  - Example: `GET /api/find?skill=Doctor&borough=Southwark` → `[{ borough: 'Southwark', count: 3, avg_score: 67 }]`

#### Realtime
- [ ] Set up Supabase realtime subscription helper at `src/lib/realtime.ts`
  - Subscribe to `users` table changes for a given user_id
  - Emits score + tier updates to the client
  - Hemish's score ring will use this to animate score changes live

#### Gov hierarchy seeding helper
- [ ] Helper function `scripts/seedGov.ts` — creates L0 + L1 Gov Official accounts
  - Coordinate with Ray's main seed script
  - L0: 3 accounts, score 100, tier 'gov_official', organisation: 'Emergency Coalition'
  - L1: NHS admin (score 100), Met Police (score 100), London Council (score 100), GOV badge

---

## HEMISH — Frontend Components

**Branch:** `hemish/data-wiring`
**Design system shipped by Ray (2026-05-16).** All pages are visually complete with hardcoded data. Hemish's job is now wiring real API data into the existing pages — not building from scratch.

**DO NOT rebuild:** TrustRing, ScoreBadge, ProfileCard, VouchQR. These are superseded by inline implementations in the pages and by `src/components/civic/TierBadge`.

### Priority tasks

#### 1. Wire Sidebar real session data — DO FIRST (visible every page)
- [ ] `src/components/civic/Sidebar.tsx` — lines 27-28 hardcode "Sarah Mitchell" / "BLK-0471-LDN"
  - Add `useState` + `useEffect` to read `civictrust_session` from localStorage
  - Display `session.display_name` and `session.node_id` in the identity card
  - Use `session.tier` for the tier badge and progress bar colour

#### 2. Wire TopBar avatar
- [ ] `src/components/civic/TopBar.tsx` — show first initial of `session.display_name` in avatar circle

#### 3. Wire dashboard evidence cards to real data
- [ ] `src/app/dashboard/page.tsx` — replace hardcoded evidence array with `GET /api/claims/[userId]`
  - Read `civictrust_session` from localStorage to get `user_id`
  - Fetch on mount, display real claims with correct status badges
  - Empty state: show the "Add another claim" slot only

#### 4. Wire vouch confirm button
- [ ] `src/app/vouch/page.tsx` — "Confirm vouch" button should `POST /api/vouch`
  - Input: `{ voucher_id, vouchee_id }` from session + looked-up node
  - On success: show score update, refresh activity

#### 5. Wire dashboard activity feed
- [ ] Replace hardcoded activity items with real recent events
  - Source: recent claims + vouches for the logged-in user

#### 6. Realtime score update (nice-to-have)
- [ ] Connect Tao's realtime helper to update the score ring live when a vouch comes in
  - The SVG ring in dashboard/page.tsx takes `SCORE` as a constant — make it stateful

### Civic components already built (use these, do not rebuild)

Located at `src/components/civic/`:
- `TopBar` — fixed nav, notifications, avatar menu
- `Sidebar` — left nav, identity card
- `TierBadge` — tier-0 through gov_official pill badges
- `Icon` — Material Symbols wrapper

### Visual rules
- Match the existing page style — inline styles for design token colours (`#b0c6ff`, `#40e56c` etc.)
- Do not switch to Tailwind classes for colours — it creates two visual languages
- All components under 200 lines

---

## MAALAV — Pages + Routing

**Branch:** `maalav/data-wiring`
**All pages shipped by Ray (2026-05-16).** Every route exists and builds clean. Maalav's job is now auth guards + session data wiring, not building pages.

### Priority tasks

#### 1. Auth guards on protected pages — DO FIRST
Every page below needs this at the top of the component:
```typescript
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Inside component:
const router = useRouter()
useEffect(() => {
  const raw = localStorage.getItem('civictrust_session')
  if (!raw) router.push('/login')
}, [router])
```

Protected pages: `/dashboard`, `/add-evidence`, `/vouch`, `/settings`, `/map`
Public (no guard needed): `/`, `/find`, `/login`, `/register`, `/unverified`

#### 2. Read real session data into pages
All pages currently show hardcoded "Sarah Mitchell / BLK-0471-LDN / score 55".
Replace with data from `civictrust_session` in localStorage.

Session shape (set by login/register, stored as JSON):
```typescript
// { token, user_id, node_id, username, display_name, score, tier }
const session = JSON.parse(localStorage.getItem('civictrust_session') ?? '{}')
```

Pages to update (Sidebar/TopBar handled by Hemish):
- [ ] `dashboard/page.tsx` — "Welcome back, Sarah." → `session.display_name`; score ring → `session.score`; tier badge → `session.tier`
- [ ] `vouch/page.tsx` — hardcoded `BLK-0471-LDN` (line 141) → `session.node_id`
- [ ] `settings/page.tsx` — prefill display_name + username fields from session

#### 3. Wire add-evidence submit
- [ ] `src/app/add-evidence/page.tsx` step 4 "Submit claim" button:
  - Reads file + claim type from wizard state
  - POSTs to `POST /api/claims` with `{ user_id, type, doc_image_base64, doc_type }`
  - On success: redirect to `/dashboard`
  - On error: show error message

#### 4. Wire unverified page session data
- [ ] `src/app/(auth)/unverified/page.tsx` line 30 hardcodes `BLK-0471-LDN`
  - Read from localStorage and show real `session.node_id` and `session.display_name`

#### 5. Wire settings username save (low priority)
- [ ] `src/app/settings/page.tsx` — "Save changes" button for @username field
  - Call `PATCH /api/auth/username` with `{ node_id: session.node_id, username }`
  - Show success/error inline
  - Password change form: leave UI as-is, non-functional (not in demo path)

#### 6. Wire find page to real API
- [ ] `src/app/find/page.tsx` — replace hardcoded 4 results with `GET /api/find?skill=...&borough=...`
  - Depends on Tao implementing `/api/find`
  - Loading state while fetching
  - Empty state if no results

### Pages status

| Route | Visual | Auth guard | Real data |
|-------|--------|-----------|-----------|
| `/` | DONE | N/A (public) | N/A |
| `/login` | DONE | N/A | DONE (calls API) |
| `/register` | DONE | N/A | DONE (calls API) |
| `/unverified` | DONE | TODO | TODO |
| `/dashboard` | DONE | TODO | TODO |
| `/add-evidence` | DONE | TODO | TODO (submit only) |
| `/vouch` | DONE | TODO | TODO |
| `/find` | DONE | N/A (public) | TODO (needs Tao) |
| `/map` | DONE | TODO | TODO (needs Ray seed) |
| `/settings` | DONE | TODO | TODO |

---

## SHARED — all team

### Types — define in `src/types/index.ts` before anything else

```typescript
export type TrustTier = 'unverified' | 'partial' | 'verified' | 'trusted' | 'gov_official'

export interface User {
  id: string
  node_id: string
  username: string | null
  display_name: string
  skill: string
  score: number
  tier: TrustTier
  borough: string | null
  created_at: string
}

export interface Claim {
  id: string
  user_id: string
  type: 'identity' | 'credential' | 'work'
  status: 'pending' | 'verified' | 'rejected'
  doc_type: string
  extracted_name: string | null
  extracted_institution: string | null
  confidence: number | null
  vouches: number
  flags: number
  created_at: string
}

export interface Vouch {
  id: string
  voucher_id: string
  vouchee_id: string
  created_at: string
}

export function getTier(score: number): TrustTier {
  if (score >= 95) return 'gov_official'
  if (score >= 90) return 'trusted'
  if (score >= 50) return 'verified'
  if (score >= 30) return 'partial'
  return 'unverified'
}

export interface ScoreInput {
  claims_verified: number
  vouches_received: number
  gov_vouched: boolean
}

export function calculateScore(input: ScoreInput): number {
  return Math.min(100, input.claims_verified * 15 + input.vouches_received * 10 + (input.gov_vouched ? 20 : 0))
}
```

### Before starting
- [ ] Pull dev after Ray merges the scaffold PR
- [ ] Read `docs/PLAN.md` for full context
- [ ] Import ALL types from `src/types/index.ts` — never define types elsewhere
- [ ] Use `src/lib/supabase.ts` for DB — never create new clients

### Git workflow
```
git checkout dev && git pull
git checkout -b yourname/feature-name
# work...
git add specific-files
git commit -m "feat: description"
git checkout dev && git pull && git merge yourname/feature-name && git push
```

### If an API breaks during demo
Set `USE_FALLBACKS=true` in `.env.local` — activates mock data from `src/lib/fallbacks.ts`.

---

## DEMO CHECKLIST — Ray runs through this before presenting

- [ ] Seed script run — 200 users + Gov Officials + Dr. Osei visible on map
- [ ] Register as Sarah Mitchell + Doctor tag + passport upload → node ID issued, tier: Unverified
- [ ] First login → set username to @sarah_mitchell
- [ ] Submit medical degree → Gemini reads "UCL Medicine" → score 15, tier: Unverified
- [ ] Submit NHS employer letter → score 30, tier: Partial
- [ ] Bad actor test: upload doc with wrong name → rejected ("name doesn't match")
- [ ] Dr. Osei (pre-seeded, score 74) QR-vouches Sarah → score 40, still Partial
- [ ] A second vouch → score 50 → tier: **Verified** → Doctor pin appears on London map in Southwark
- [ ] Map: 200+ pins visible, counter shows "1,847 / 9,000,000"
- [ ] Yellow Pages (/find): search "Doctor" → shows "Southwark: 3 verified doctors"
- [ ] Yellow Pages: search "insulin" (resource) → returns relevant results
- [ ] `USE_FALLBACKS=true` tested — app still works if Gemini is down
- [ ] Full demo rehearsed at least twice before presenting

---

## MARKING SCHEMA — keep in mind throughout

| Category | Points | What judges look for |
|---|---|---|
| Technical | 35 | Working prototype, good architecture, technologically impressive |
| Idea | 30 | Innovative, relevant to problem, complete |
| Design | 20 | Look and feel, usability, wow factors |
| Presentation | 15 | Prepared, clear problem/solution, engaging |

**Technical is the biggest category. A working demo beats a beautiful broken one every time.**
