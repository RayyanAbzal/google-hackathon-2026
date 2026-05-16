# CivicTrust — Full Task List

> BLACKOUT · GDGC UOA 2026 · Read PLAN.md first for full context.
> Branch off `dev` for all work. Never commit directly to dev or main.

---

## RAY — Full-stack Lead

**Status as of 2026-05-16 (session 14):** All core systems wired. Aryan's scoring overhaul pulled in. `gov_anchors` bug in score.ts fixed. `tsc` clean. Demo path needs one more end-to-end run.

### Phase 1 — Database + Seed
- [x] Supabase project created, URL + anon key in `.env.local`
- [x] Schema created via MCP (tables: `users`, `claims`, `vouches`, `gov_officials`)
- [x] RLS policies set via MCP
- [x] Enable Supabase Realtime on `users` table
- [x] `src/lib/supabase.ts` — done
- [x] `src/lib/gemini.ts` — `analyseDocument()` implemented
- [x] `src/lib/score.ts` — `recalculateUserScore()` implemented + `gov_anchors` typo fixed to `gov_officials`
- [x] `scripts/seed.ts` — 207 users live (gov anchors + Dr. Osei + 200 Londoners)
- [x] `scripts/seedGov.ts` — L0 + L1 gov anchors
- [x] Fallback toggle: `NEXT_PUBLIC_USE_FALLBACKS` in `.env.local`

### Phase 2 — AI + Map
- [x] `src/components/map/HeatMap.tsx` — D3 choropleth, borough labels, pin tooltips
- [x] `src/components/map/SkillPin.tsx` — coloured SVG circles by skill
- [x] Map wired to live Supabase data
- [x] Live counter component — realtime UPDATE + INSERT
- [ ] QR vouch flow glue — vouch page has QR display; confirm with Hemish that flow is testable end-to-end

### Phase 2.5 — Scoring (sessions 14)
- [x] Pulled Aryan's scoring overhaul: new `ScoreInput` (passport_count/other_doc_count), vouch gate, `getTier` thresholds 20/55/91
- [x] `tier='partial'` type error in `dashboard/page.tsx` fixed — removed dead branch
- [x] `gov_anchors` bug in `score.ts` fixed — was querying wrong table, now `gov_officials`
- [x] All stale threshold comments in CLAUDE.md files corrected
- [x] DB confirmed: no `partial` tier rows

### Phase 3 — Pre-demo prep

#### Demo prep
- [ ] Re-run seed `--wipe` before demo to reset to clean state (Dr. Osei score 74)
- [ ] Test full demo path end-to-end: register → add-evidence × 2 → Dr. Osei vouch → map pin
- [ ] Test bad actor path: upload doc with wrong name → rejected
- [ ] Verify `NEXT_PUBLIC_USE_FALLBACKS=true` works if Gemini fails during demo
- [ ] Confirm heatmap shows populated London before Sarah registers

#### Demo prep
- [ ] Re-run seed `--wipe` before demo to reset to clean state (Dr. Osei will be score 74)
- [ ] Test full demo path end-to-end: register → claim → vouch → verified → map
- [ ] Test bad actor path: upload doc with wrong name → rejected
- [ ] Verify `NEXT_PUBLIC_USE_FALLBACKS=true` works if Gemini fails during demo
- [ ] Confirm heatmap shows populated London before Sarah registers

---

## ARYAN — Backend API (core) + Supabase

**Status as of 2026-05-16 (session 14): ALL ROUTES DONE. Scoring overhaul merged into dev.**

### API routes — all implemented
- [x] `POST /api/auth/register` — creates user. Gap: does not call Gemini at signup (doc accepted but not verified). Not blocking for demo — claim route does Gemini.
- [x] `POST /api/auth/login` — node_id or @username + password, returns session token
- [x] `PATCH /api/auth/username` — set @handle, requires auth
- [x] `POST /api/claims` — Gemini Vision, name check, dedup hash, score recalc
- [x] `GET /api/claims/[userId]` — returns all claims, requires auth
- [x] `POST /api/vouch` — score >= 50 check, 24h rate limit, inserts vouch, recalcs score
- [x] `POST /api/vouch/flag` — flags claim, penalises all vouchers -15pts
- [x] `GET /api/users/[username]` — public profile, requires auth
- [x] `GET /api/users/node/[nodeId]` — resolves node ID to user (used by vouch page). No auth required (by design — vouch page doesn't send auth headers on lookup).
- [x] `GET /api/score/[userId]` — current score + tier

---

## TAO — Backend API (features)

**Status as of 2026-05-16 (session 14):** `seedGov.ts` done. `realtime.ts` done. `rateLimit.ts` exists. Middleware exists.

- [x] `scripts/seedGov.ts` — L0 + L1 gov anchor accounts
- [x] `src/lib/realtime.ts` — `subscribeToUserScore()` implemented
- [x] `src/lib/rateLimit.ts` — rate limit helper exists
- [x] `src/middleware.ts` — middleware implemented
- [x] `GET /api/find` — skill + borough aggregation, fully implemented

---

## HEMISH — Frontend Components

**Status as of 2026-05-16 (session 14): ALL CHROME WIRED.**

- [x] `src/components/civic/Sidebar.tsx` — reads real session (display_name, score, tier, node_id). Tier label thresholds are slightly off — Ray fixing.
- [x] `src/components/civic/TopBar.tsx` — reads real session, shows initials, logout works

---

## MAALAV — Pages + Routing

**Status as of 2026-05-16 (session 14): ALL PROTECTED PAGES GUARDED AND WIRED.**

### Auth guards — ALL DONE
- [x] `/dashboard` — `requireSession()` guard
- [x] `/add-evidence` — `requireSession()` guard
- [x] `/vouch` — manual localStorage check + `router.push('/login')`
- [x] `/map` — `requireSession()` guard
- [x] `/settings` — `requireSession()` guard
- [x] `/unverified` — `requireSession()` guard

### Real data wiring — ALL DONE
- [x] `dashboard/page.tsx` — session data + real claims from `/api/claims/[userId]`
- [x] `add-evidence/page.tsx` — session data + POSTs to `/api/claims`
- [x] `vouch/page.tsx` — session data + node lookup + POST `/api/vouch`
- [x] `unverified/page.tsx` — session data (has threshold bug — Ray fixing)
- [x] `settings/page.tsx` — session data

### Find page — INTENTIONALLY HARDCODED
- `/find` page uses rich hardcoded `ALL_RESULTS` array — no API call. This is intentional: the real `/api/find` returns only aggregated counts (borough + count + avg_score), not individual profiles with contact details. The hardcoded data is richer for the demo. **Do not wire to the real API** unless you extend the API to return individual user listings.

### Pages status

| Route | Visual | Auth guard | Real data |
|-------|--------|-----------|-----------|
| `/` | DONE | N/A (public) | N/A |
| `/login` | DONE | N/A | DONE |
| `/register` | DONE | N/A | DONE |
| `/unverified` | DONE | DONE | DONE (threshold bug — Ray fixing) |
| `/dashboard` | DONE | DONE | DONE |
| `/add-evidence` | DONE | DONE | DONE |
| `/vouch` | DONE | DONE | DONE |
| `/find` | DONE | N/A (public) | HARDCODED (intentional) |
| `/map` | DONE | DONE | DONE |
| `/settings` | DONE | DONE | Session only |
| `/profile/[username]` | DONE | — | — |

---

## SHARED — all team

### Types
All types in `src/types/index.ts`. Score formula: `min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched * 20)`. Tiers: 0-24 Unverified, 25-59 Verified, 60-89 Trusted, 90+ Gov Official.

### If an API breaks during demo
Set `NEXT_PUBLIC_USE_FALLBACKS=true` in `.env.local` — activates mock data from `src/lib/fallbacks.ts`.

---

## DEMO CHECKLIST — Ray runs through this before presenting

### Setup
- [ ] Run `npx tsx scripts/seed.ts --wipe` — 207 users fresh (Dr. Osei score 74)
- [ ] Confirm heatmap shows 200+ pins across London boroughs
- [ ] Confirm counter shows reasonable number (not 0)

### Demo path
- [ ] Register as Sarah Mitchell + Doctor + passport upload → node ID issued, tier: Unverified
- [ ] Login → prompted to set @username → set to @sarah_mitchell
- [ ] Submit medical degree → Gemini reads "UCL Medicine" → score 15, still Unverified
- [ ] Submit NHS employer letter → score 30, tier: **Verified** (threshold: 25)
- [ ] Bad actor test: upload doc with wrong name → rejected ("name doesn't match")
- [ ] Dr. Osei (BLK-00471-LDN, score 74) vouches Sarah → score 40, still Verified
- [ ] Doctor pin appears on London map in Southwark
- [ ] Map: 200+ pins visible, counter live
- [ ] Yellow Pages (/find): filter Medical + Southwark → shows verified doctors
- [ ] `NEXT_PUBLIC_USE_FALLBACKS=true` tested — app still works if Gemini is down
- [ ] Full demo rehearsed at least twice

---

## MARKING SCHEMA

| Category | Points | What judges look for |
|---|---|---|
| Technical | 35 | Working prototype, good architecture, technologically impressive |
| Idea | 30 | Innovative, relevant to problem, complete |
| Design | 20 | Look and feel, usability, wow factors |
| Presentation | 15 | Prepared, clear problem/solution, engaging |

**Technical is the biggest category. A working demo beats a beautiful broken one every time.**
