# CivicTrust — Full Task List

> BLACKOUT · GDGC UOA 2026 · Read PLAN.md first for full context.
> Branch off `dev` for all work. Never commit directly to dev or main.

---

## RAY — Full-stack Lead

**Status as of 2026-05-16 (session 13):** Map wired to live Supabase data. Counter live. Realtime enabled. Remaining: partial tier fix, QR glue, demo prep.

### Phase 1 — Database + Seed
- [x] Supabase project created, URL + anon key in `.env.local`
- [x] Schema created via MCP (tables: `users`, `claims`, `vouches`, `gov_officials`)
- [x] RLS policies set via MCP
- [x] Enable Supabase Realtime on `users` table — done via MCP migration (session 13)
- [x] `src/lib/supabase.ts` — done
- [x] `src/lib/gemini.ts` — `analyseDocument()` implemented (Gemini Vision, returns `{ extracted_name, institution, confidence }`)
- [x] `src/lib/score.ts` — `recalculateUserScore()` implemented (queries claims + vouches + gov_officials, updates user row)
- [x] `scripts/seed.ts` — written (200 Londoners + Dr. Osei, calls seedGov.ts internally)
- [x] `scripts/seedGov.ts` — written (L0 + L1 gov anchors); imported and called by seed.ts
- [x] Seed run: 207 users live (61 verified, 40 trusted, 6 gov_official, 40 partial, 61 unverified)
- [x] Fallback toggle: renamed to `NEXT_PUBLIC_USE_FALLBACKS` in `.env.local` (was `USE_FALLBACKS` — dead in browser bundles)

### Phase 2 — AI + Map
- [x] `src/components/map/HeatMap.tsx` — D3 choropleth, split into two effects (geojson once, counts on users change), pin tooltips, borough labels
- [x] `src/components/map/SkillPin.tsx` — coloured SVG circles by skill, done
- [x] Wire map heatmap + pins from real Supabase data — `src/app/map/page.tsx` fetches verified/trusted/gov_official users on mount, falls back to FALLBACK_USERS on error
- [x] Live counter component — shows 107 / 9,000,000, re-queries on realtime UPDATE + INSERT
- [ ] QR vouch flow glue — coordinate with Hemish (QR display) + Aryan (vouch API)

### Phase 2.5 — Pre-demo fix needed
- [ ] **partial tier mismatch** — DB has 40 users with `tier='partial'` but `TrustTier` type (and `getTier()`) does not include it. Seed used different thresholds (0-29 Unverified, 30-49 Partial) than types file (0-24 Unverified, 25-59 Verified). Map correctly excludes partial users. Risk: any page that renders `TierBadge` for a DB user row with `tier='partial'` will runtime-crash. Fix: add `'partial'` back to `TrustTier` and handle it in `TierBadge`, OR re-seed with corrected thresholds to eliminate partial rows.

### Phase 3 — Demo prep
- [ ] Resolve partial tier mismatch (see Phase 2.5) before demo
- [ ] Re-run seed script with final fake documents
- [ ] Test full demo path end-to-end (register → claim → vouch → verified → map)
- [ ] Test bad actor path (mismatched name doc → rejected)
- [ ] Verify `NEXT_PUBLIC_USE_FALLBACKS=true` works if Gemini API fails during demo
- [ ] Confirm heatmap shows populated London before Sarah registers

---

## ARYAN — Backend API (core) + Supabase

**Status as of 2026-05-16:** All API routes implemented. One gap: register route skips Gemini doc analysis at signup — see note below.

### Supabase setup
- [x] Supabase project created, URL + anon key shared with Ray
- [x] Schema created via MCP (Ray, 2026-05-16)
- [x] RLS policies set via MCP (Ray, 2026-05-16)
- [x] Enable Realtime on `users` table — done by Ray via MCP migration (session 13)

### API routes

#### Auth
- [x] `POST /api/auth/register` — implemented. **Gap:** does not call `analyseDocument()` at signup — doc is accepted but not Gemini-verified. Add the call and name check if time allows.
- [x] `POST /api/auth/login` — node_id or @username + password, returns session token
- [x] `PATCH /api/auth/username` — set @handle, requires auth

#### Claims
- [x] `POST /api/claims` — calls `analyseDocument()`, name check, dedup hash, score recalc via `recalculateUserScore()`
- [x] `GET /api/claims/[userId]` — returns all claims, requires auth

#### Vouching
- [x] `POST /api/vouch` — score >= 50 check, 24h rate limit (inline), inserts vouch, recalcs both scores
- [x] `POST /api/vouch/flag` — flags claim, penalises all vouchers -15pts, updates tiers

#### Users + Score
- [x] `GET /api/users/[username]` — public profile, requires auth + score >= 50
- [x] `GET /api/score/[userId]` — current score + tier

### Rules for all routes
- Return `{ success: boolean, data: T | null, error: string | null }` always
- Use `calculateScore()` and `getTier()` from `src/types/index.ts`
- Never expose raw Supabase errors — catch and return `{ success: false, error: 'Something went wrong' }`
- All routes that write require auth header check

---

## TAO — Backend API (features)

**Status as of 2026-05-16:** `seedGov.ts` done (imported by Ray's seed.ts). `realtime.ts` and `find` route still TODO.

> **Rate limiting note:** Aryan's `claims` and `vouch` routes already enforce limits inline (3 claims/10min, 5 vouches/24h). Tao's middleware does not need to duplicate these — focus on IP-level limiting or other routes not yet covered.

### Tasks

#### Rate limiting
- [ ] `src/middleware.ts` — implement rate limiting. Claims (3/10min) and vouch (5/24h) are already handled in-route. Middleware can add IP-level blanket limiting across all API routes if desired.

#### Yellow Pages API
- [ ] `GET /api/find`
  - Query params: `skill` (optional), `resource` (optional), `borough` (optional)
  - Search by EITHER skill (Doctor, Engineer, Legal, Builder) OR resource (insulin, water, tools)
  - Returns grouped results: `[{ borough, skill, count, avg_score }]`
  - No auth required for counts
  - Example: `GET /api/find?skill=Doctor&borough=Southwark` → `[{ borough: 'Southwark', count: 3, avg_score: 67 }]`

#### Realtime
- [ ] `src/lib/realtime.ts` — Supabase realtime subscription helper
  - Subscribe to `users` table changes for a given user_id
  - Emits score + tier updates to the client
  - Hemish's score ring uses this to animate score changes live

#### Gov seeding
- [x] `scripts/seedGov.ts` — L0 + L1 gov anchor accounts written, exported as `seedGovAnchors()`, called by Ray's `seed.ts`

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

Session type (from `src/types/index.ts`):
```typescript
interface Session {
  token: string
  user_id: string
  node_id: string
  username: string | null
  display_name: string
  score: number
  tier: TrustTier
}
```

Pages to update:
- [ ] `dashboard/page.tsx` — "Welcome back, Sarah." → session.display_name; score ring → session.score; tier badge → session.tier
- [ ] `vouch/page.tsx` — Node ID display → session.node_id
- [ ] `settings/page.tsx` — prefill name fields from session
- [ ] `unverified/page.tsx` — node ID + name from session
- [ ] `sidebar` (TopBar + Sidebar in civic/) — already reads from hardcoded values; update to read session

#### 3. Wire add-evidence submit
- [ ] `src/app/add-evidence/page.tsx` step 4 "Submit claim" button:
  - Reads file + claim type from wizard state
  - POSTs to `POST /api/claims` with `{ user_id, type, doc_image_base64, doc_type }`
  - On success: redirect to `/dashboard`
  - On error: show error message

#### 4. Wire find page to real API
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

### Types
All types live in `src/types/index.ts` — import from there, never define elsewhere. File is fully populated with `User`, `Claim`, `Vouch`, `Session`, `TrustTier`, `getTier()`, `calculateScore()`.

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
- [ ] Submit NHS employer letter → score 30, tier: Verified
- [ ] Bad actor test: upload doc with wrong name → rejected ("name doesn't match")
- [ ] Dr. Osei (pre-seeded, score 74) QR-vouches Sarah → score 40, still Verified
- [ ] Doctor pin appears on London map in Southwark
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
