# CivicTrust — Roadmap & Progress

> BLACKOUT · GDGC UOA 2026 · Updated: 2026-05-16

---

## What we're building

After a solar flare wipes all digital records, people prove identity using physical documents and peer trust. CivicTrust assigns a trust score via Gemini document analysis + peer vouching, displayed on a live London heatmap.

**Demo story (4 min):**
```
Sarah registers → uploads passport → gets BLK-XXXXX-LDN node ID
→ uploads medical degree → score rises to 15 (Unverified)
→ submits NHS employer letter → score 30 → Verified tier
→ Dr. Osei (pre-seeded) QR-vouches Sarah → score 40
→ Doctor pin appears on London map in Southwark
→ Yellow Pages: search "Doctor" → "Southwark: 3 verified doctors"
```

**Score formula:** `min(100, claims_verified × 15 + vouches × 10 + gov_vouched × 20)`

| Score | Tier | Colour |
|-------|------|--------|
| 0-24 | Unverified | Red |
| 25-59 | Verified | Green |
| 60-89 | Trusted | Amber |
| 90-100 | Gov Official | Gold |

---

## Team snapshot

| Person | Role | Progress | Status |
|--------|------|----------|--------|
| Ray | Full-stack lead, DB, AI, map | 6 done / 3 remaining | 🟡 Nearly done |
| Aryan | Backend API + Supabase setup | 10 done / 1 confirmation needed | 🟡 Nearly done |
| Tao | Find API + rate limiting | 1 done / 3 remaining | 🔴 Needs work |
| Hemish | UI shell + wiring | 4 done / 4 remaining | 🔴 Needs work |
| Maalav | Pages + routing | 9 done / 5 wiring tasks | 🔴 Needs work |

---

## Project roadmap

### Phase 1 — Foundation
- [x] DB schema — all 4 tables (`supabase/migrations/0001_init.sql`)
- [x] Shared types (`src/types/index.ts`)
- [x] Supabase client (`src/lib/supabase.ts`)
- [x] Auth helpers — bcrypt hashing, JWT signing, token verification (`src/lib/auth.ts`)
- [x] Score calculation logic (`src/lib/score.ts`)
- [x] Gemini document analysis (`src/lib/gemini.ts`)
- [x] Realtime score subscription helper (`src/lib/realtime.ts`)
- [x] Fallback mock data (`src/lib/fallbacks.ts`)

### Phase 2 — Backend API
- [x] `POST /api/auth/register` — doc upload, Gemini analysis, node ID generation
- [x] `POST /api/auth/login` — node_id or @username + password, returns JWT
- [x] `PATCH /api/auth/username` — set @handle after first login
- [x] `POST /api/claims` — doc analysis, name-match check, dedup hash, score recalc
- [x] `GET /api/claims/[userId]` — all claims with vouch counts, auth required
- [x] `POST /api/vouch` — score gate (>=50), duplicate check, score recalc
- [x] `POST /api/vouch/flag` — flags claim, penalises all vouchers -15pts
- [x] `GET /api/users/[username]` — public profile, 403 if viewer score < 50
- [x] `GET /api/score/[userId]` — current score + tier
- [ ] `GET /api/find` — Yellow Pages grouped counts — **TAO** 🔴
- [ ] Rate limiting middleware (`src/middleware.ts`) — **TAO** 🔴

### Phase 3 — UI Shell
- [x] TopBar — fixed nav, notifications popup, avatar menu + sign out
- [x] Sidebar — fixed left nav, identity card, tier progress bar, active state
- [x] TierBadge — all 5 tiers with correct colours
- [x] Icon — Material Symbols Outlined wrapper
- [ ] Wire Sidebar to show real session data (display_name, node_id) — **HEMISH** 🔴 (visible every page)
- [ ] Wire TopBar avatar initials from real session — **HEMISH** 🟡
- [ ] Wire dashboard evidence cards → `GET /api/claims/[userId]` — **HEMISH** 🟡
- [ ] Wire vouch confirm button → `POST /api/vouch` — **HEMISH** 🟡

### Phase 4 — Pages
- [x] Landing (`/`) — hero, CTAs, lore
- [x] Register (`/register`) — 2-step: display name + password, then doc upload
- [x] Login (`/login`) — node_id or @username + password, session to localStorage
- [x] Dashboard (`/dashboard`) — profile, claims, score ring (inline SVG)
- [x] Map (`/map`) — HeatMap + SkillPins
- [x] Find (`/find`) — UI complete, waiting on API
- [x] Vouch (`/vouch`) — QR inline SVG, waiting on wiring
- [x] Add Evidence (`/add-evidence`) — wizard flow UI complete
- [x] Settings (`/settings`) — username update, password change
- [x] Profile redirect (`/profile/[username]`) — redirects to `/dashboard`
- [ ] Auth guards on protected pages — **MAALAV** 🔴 (anyone can hit /dashboard now)
- [ ] Wire real session data into pages — **MAALAV** 🔴 (hardcoded "Sarah Mitchell" everywhere)
- [ ] Wire add-evidence submit → `POST /api/claims` — **MAALAV** 🟡
- [ ] Wire unverified page session data (node_id, display_name) — **MAALAV** 🟡
- [ ] Wire settings "Save username" → `PATCH /api/auth/username` — **MAALAV** 🟡 (low priority)

### Phase 5 — Demo prep
- [ ] Supabase realtime enabled on `users` table — **ARYAN** 🟡
- [x] RLS policies confirmed — **RAY via MCP (2026-05-16)**
- [ ] Run seed: `npx tsx scripts/seedGov.ts && npx tsx scripts/seed.ts` — **RAY** 🟡
- [ ] Full demo path rehearsed end-to-end
- [ ] Bad actor path tested (wrong-name doc → rejected)
- [ ] `USE_FALLBACKS=true` tested (app works if Gemini down)

---

## Critical path

```
BLOCKING RIGHT NOW:
  Maalav: auth guards + real session data          ← unauthed users see everything
  Hemish: Sidebar hardcoded "Sarah Mitchell"       ← visible on every protected page
  Tao: /api/find                                   ← Yellow Pages shows no results

NEEDED FOR FULL DEMO:
  Hemish: wire claims + vouch calls                ← dashboard shows placeholder data
  Maalav: wire add-evidence submit                 ← form does nothing on submit
  Aryan: enable realtime on users table            ← live score updates won't fire
  Ray: run seed scripts + wire map real data       ← map is empty

LAST:
  Full demo rehearsal x2
```

---

---

## RAY — Full-stack lead

> DB schema, AI integration, map components, seed data

| # | Task | Status |
|---|------|--------|
| 1 | DB schema — all 4 tables | ✅ Done |
| 2 | `src/lib/gemini.ts` — `analyseDocument()` + `generateText()` | ✅ Done |
| 3 | `src/lib/realtime.ts` — `subscribeToUserScore()` | ✅ Done |
| 4 | `src/lib/score.ts` — `recalculateUserScore()` | ✅ Done |
| 5 | `src/components/map/HeatMap.tsx` — D3 choropleth by borough | ✅ Done |
| 6 | `src/components/map/SkillPin.tsx` — coloured circle per skill | ✅ Done |
| 7 | Run seed scripts against live Supabase | ⏳ Pending |
| 8 | Confirm live counter on map page subscribes to realtime | ⏳ Pending |
| 9 | Wire map heatmap + pins from real Supabase data (currently uses FALLBACK_USERS) | ⏳ Pending |

### Remaining tasks

**Task 7 — Run seeds**
```bash
npx tsx scripts/seedGov.ts   # run first — seed.ts depends on gov accounts
npx tsx scripts/seed.ts
# or wipe and re-seed:
npx tsx scripts/seed.ts --wipe
```
Creates: 3 Gov Officials + NHS/Met/Council anchors + Dr. Osei (BLK-00471-LDN, score 74, Southwark) + 200 fake Londoners

**Task 8 — Live counter**
Map page should show "X / 9,000,000 verified" — confirm it's hooked up to realtime subscription.

**Task 9 — Wire map real data**
`src/app/map/page.tsx` line 8 imports `FALLBACK_USERS` and passes it to `<HeatMap users={FALLBACK_USERS} />`. After seed runs, replace with a Supabase query:
```typescript
const { data: users } = await supabaseAdmin.from('users').select('borough, skill, tier, score').eq('tier', 'verified')
```
Also replace the hardcoded `PINS` array with real pin data grouped by borough and skill.
Do this AFTER seed is confirmed (otherwise the query returns 0 rows and map looks empty).

### Demo day responsibilities
- Run seed script the morning of demo
- Flip `USE_FALLBACKS=true` if Gemini fails mid-demo
- Merge `dev → main` before presenting

---

## ARYAN — Backend API + Supabase

> All core API routes done. Two Supabase confirmations needed.

| # | Task | Status |
|---|------|--------|
| 1 | `POST /api/auth/register` | ✅ Done |
| 2 | `POST /api/auth/login` | ✅ Done |
| 3 | `PATCH /api/auth/username` | ✅ Done |
| 4 | `POST /api/claims` | ✅ Done |
| 5 | `GET /api/claims/[userId]` | ✅ Done |
| 6 | `POST /api/vouch` | ✅ Done |
| 7 | `POST /api/vouch/flag` | ✅ Done |
| 8 | `GET /api/users/[username]` | ✅ Done |
| 9 | `GET /api/score/[userId]` | ✅ Done |
| 10 | Supabase realtime enabled on `users` table | ⏳ Confirm |
| 11 | RLS policies active | ✅ Done (Ray via MCP, 2026-05-16) |

### Remaining tasks

**Task 10 — Enable realtime**
Supabase dashboard → Settings → Database → Replication → enable `users` table.
Required for live score ring animation on dashboard.

---

## TAO — Find API + rate limiting

> Three tasks not started. Two directly block demo features.

| # | Task | Status |
|---|------|--------|
| 1 | `scripts/seedGov.ts` written | ✅ Done |
| 2 | `GET /api/find` | 🔴 Not started |
| 3 | Rate limiting middleware (`src/middleware.ts`) | 🔴 Not started |
| 4 | Confirm seedGov runs clean against live Supabase | ⏳ Pending |

### Task 2 — `GET /api/find` (blocks Yellow Pages page)

```typescript
// Query params: skill?, resource?, borough?
// Returns: { success: true, data: [{ borough, skill, count, avg_score }] }
// No auth required
// Example: GET /api/find?skill=Doctor&borough=Southwark
// → [{ borough: 'Southwark', skill: 'Doctor', count: 3, avg_score: 67 }]
```

### Task 3 — Rate limiting middleware (blocks vouch spam)

File exists at `src/middleware.ts` — body is a single `return NextResponse.next()` stub.

Rules to enforce:
- Max 5 vouches per user per 24h — check `vouches` table
- Max 3 claim submissions per user per 10min — check `claims` table
- Return `429` + `{ success: false, error: 'Rate limit exceeded' }` if breached

### Task 4 — Run seedGov

Coordinate with Ray. seedGov must run before seed.ts (vouch chains depend on gov accounts existing).

---

## HEMISH — UI components + wiring

> Shell components done. Four wiring tasks remain — Sidebar is highest priority (visible every page).

| # | Task | Status |
|---|------|--------|
| 1 | TopBar — nav, notifications, avatar menu | ✅ Done |
| 2 | Sidebar — identity card, tier progress bar | ✅ Done |
| 3 | TierBadge — all 5 tiers | ✅ Done |
| 4 | Icon wrapper (Material Symbols) | ✅ Done |
| 5 | Wire Sidebar real session data (display_name, node_id from localStorage) | 🔴 Blocking |
| 6 | Wire TopBar avatar initials from real session | 🟡 Remaining |
| 7 | Wire dashboard evidence cards → `GET /api/claims/[userId]` | 🟡 Remaining |
| 8 | Wire vouch confirm → `POST /api/vouch` | 🟡 Remaining |

### Component status note

The original planned components (TrustRing as separate file, ProfileCard, ScoreBadge, VouchQR) are superseded — they are implemented inline in the pages directly. Do not rebuild them as separate components.

ClaimCard and ClaimForm stubs exist but are low priority — dashboard evidence cards and add-evidence wizard are both handled inline in page files.

### Task 5 — Wire Sidebar session data (do first)

`src/components/civic/Sidebar.tsx` line 27 hardcodes "Sarah Mitchell" and "BLK-0471-LDN". Replace with real data from localStorage:
```typescript
const [session, setSession] = useState<{ display_name: string; node_id: string; tier: TrustTier } | null>(null)
useEffect(() => {
  const raw = localStorage.getItem('civictrust_session')
  if (raw) setSession(JSON.parse(raw))
}, [])
```
Use `session?.display_name`, `session?.node_id`, `session?.tier` in the identity card and progress bar.

### Task 6 — Wire TopBar avatar

`src/components/civic/TopBar.tsx`: show first initial of `session.display_name` in the avatar circle instead of a static placeholder.

### Task 7 — Wire dashboard evidence cards

In `src/app/dashboard/page.tsx`: fetch `GET /api/claims/[userId]` using the session user_id. Replace the hardcoded placeholder evidence with real claim data.

### Task 8 — Wire vouch confirm

In `src/app/vouch/page.tsx`: on QR scan success (or manual confirm), call `POST /api/vouch` with `{ voucher_id, vouchee_id }`. Handle success (show new score) and error (already vouched, score too low).

---

## MAALAV — Pages + routing

> All 9 pages built. Three wiring tasks remain — two are blocking security issues.

| # | Task | Status |
|---|------|--------|
| 1 | Landing (`/`) | ✅ Done |
| 2 | Register (`/register`) | ✅ Done |
| 3 | Login (`/login`) | ✅ Done |
| 4 | Dashboard (`/dashboard`) | ✅ Done |
| 5 | Map (`/map`) | ✅ Done |
| 6 | Find (`/find`) | ✅ Done (UI) |
| 7 | Vouch (`/vouch`) | ✅ Done (UI) |
| 8 | Add Evidence (`/add-evidence`) | ✅ Done (UI) |
| 9 | Settings (`/settings`) | ✅ Done |
| 10 | Auth guards on protected pages | 🔴 Blocking |
| 11 | Wire real session into pages | 🔴 Blocking |
| 12 | Wire add-evidence submit → `POST /api/claims` | 🟡 Remaining |
| 13 | Wire unverified page session data (node_id, display_name) | 🟡 Remaining |
| 14 | Wire settings "Save username" → `PATCH /api/auth/username` | 🟡 Remaining (low priority) |

### Task 10 — Auth guards (security, blocking)

Protected pages (`/dashboard`, `/map`, `/vouch`, `/add-evidence`, `/settings`) currently have no auth check — anyone can visit them without logging in.

Add at the top of each protected page:
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

### Task 11 — Real session data (blocking)

Pages currently show hardcoded "Sarah Mitchell" / placeholder values. Wire the `session` object from localStorage into:
- Dashboard: display real display_name, score, tier
- Map: use real user_id for realtime subscription
- Vouch: pass real node_id as the voucher
- Settings: pre-fill real username/display_name

### Task 12 — Wire add-evidence submit

In `src/app/add-evidence/page.tsx`: the wizard form collects doc type + file. On submit:
1. Convert file to base64
2. Call `POST /api/claims` with `{ user_id, type, doc_image_base64, doc_type }`
3. Show loading while Gemini processes
4. On success: show new score + redirect to dashboard
5. On error: show "name doesn't match" or other error message

### Task 13 — Wire unverified page session data

`src/app/(auth)/unverified/page.tsx` line 30 hardcodes `BLK-0471-LDN`. Read from localStorage and show real `session.node_id` + `session.display_name`.

### Task 14 — Wire settings username save (low priority)

`src/app/settings/page.tsx`: "Save changes" button for the @username field should call `PATCH /api/auth/username` with `{ node_id, username }`. Show success/error feedback. Password change form: leave UI as-is but non-functional (not in demo path).

---

## Demo checklist — Ray runs before presenting

### Data setup
- [ ] `npx tsx scripts/seedGov.ts` — gov accounts created
- [ ] `npx tsx scripts/seed.ts` — 200 Londoners + Dr. Osei seeded
- [ ] Verify Dr. Osei exists: node_id `BLK-00471-LDN`, score 74, borough Southwark

### Demo path (run through twice)
- [ ] Register as Sarah Mitchell + passport upload → node ID issued, tier: Unverified
- [ ] Login → set @sarah_mitchell username
- [ ] Submit medical degree → Gemini reads "UCL Medicine" → score 15, tier: Unverified
- [ ] Submit NHS employer letter → score 30, tier: Verified
- [ ] Bad actor test: upload doc with wrong name → rejected ("name doesn't match")
- [ ] Login as Dr. Osei (`BLK-00471-LDN` / `password123`) → QR-vouch Sarah → score 40
- [ ] Doctor pin appears on Southwark map
- [ ] Map: 200+ pins visible, counter shows "1,847 / 9,000,000"
- [ ] Yellow Pages: search "Doctor" → "Southwark: 3 verified doctors"
- [ ] Yellow Pages: search "insulin" → returns relevant results
- [ ] Set `USE_FALLBACKS=true` → confirm app still runs

### Passwords
| Account | Password |
|---------|----------|
| All seeded users | `password123` |
| Gov Officials | `govpassword99` |
| Dr. Osei node_id | `BLK-00471-LDN` |

---

## Marking rubric

| Category | Points | How we hit it |
|----------|--------|--------------|
| **Technical** | **35** | Working auth, claims, vouch, map, realtime — all live with real data |
| Idea | 30 | Post-disaster identity rebuild — real BLACKOUT problem |
| Design | 20 | Dark UI, score animations, London heatmap |
| Presentation | 15 | Sarah's story arc, 4-minute flow, bad actor demo |

**Technical is the biggest category. A working prototype beats a beautiful broken one.**

---

## Quick links

| Resource | Path |
|----------|------|
| Full implementation plan | `docs/PLAN.md` |
| Per-person task list | `docs/TASKS.md` |
| Architecture decisions | `docs/decisions.md` |
| Seed command | `npx tsx scripts/seed.ts` |
| Gov seed command | `npx tsx scripts/seedGov.ts` |
| Fallback toggle | `.env.local` → `USE_FALLBACKS=true` |
| **Live app (Vercel)** | https://google-hackathon-gamma.vercel.app |

## Deployment

App is live on Vercel. Every push to `dev` auto-deploys a preview URL.
Ray owns the Vercel project — do not add/change env vars without checking with Ray.

To deploy manually: `vercel --prod` (requires Vercel CLI + login).
