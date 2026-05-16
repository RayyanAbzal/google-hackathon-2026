# CivicTrust — Full Task List

> BLACKOUT · GDGC UOA 2026 · Read PLAN.md first for full context.
> Branch off `dev` for all work. Never commit directly to dev or main.

---

## RAY — Full-stack Lead

**Status as of 2026-05-17 (session 15):** All core systems wired. `/map` merged into `/find` — single page with full-width map hero + listings. NL interpret-search (Haiku) live. MapFlyController, PopupListing, borough dimming implemented. Dashboard ego graph wired to Supabase. Notifications system fully wired. Settings Node ID copy fixed. Demo path needs one more end-to-end run.

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
- [x] QR vouch flow — vouch page QR display wired, flow testable end-to-end
- [x] MapFlyController — smooth fly-to on borough click
- [x] PopupListing — Leaflet popup showing verified users in borough
- [x] Borough dimming — non-selected boroughs dim on click
- [x] `/map` merged into `/find` — single-page map hero + listings (no separate /map route)

### Phase 2.5 — Scoring (session 14)
- [x] Pulled Aryan's scoring overhaul: new `ScoreInput` (passport_count/other_doc_count), vouch gate, `getTier` thresholds 20/55/91
- [x] `tier='partial'` type error in `dashboard/page.tsx` fixed — removed dead branch
- [x] `gov_anchors` bug in `score.ts` fixed — was querying wrong table, now `gov_officials`
- [x] All stale threshold comments in CLAUDE.md files corrected
- [x] DB confirmed: no `partial` tier rows

### Phase 2.6 — Features (session 15)
- [x] NL interpret-search: `POST /api/find/interpret-search` — Haiku parses free-text query → `{ skill, borough }` → passed to `/api/find`
- [x] Dashboard ego graph wired to Supabase DB (trust network, interactive)
- [x] Notifications system fully implemented — unread badge, mark-as-read, TopBar popup
- [x] Settings page — stale "User ID" copy fixed to "Node ID" everywhere

### Phase 3 — Pre-demo prep

#### Demo prep
- [ ] Re-run seed `--wipe` before demo to reset to clean state (Dr. Osei score 74)
- [ ] Test full demo path end-to-end: register → add-evidence × 2 → Dr. Osei vouch → find page map pin
- [ ] Test bad actor path: upload doc with wrong name → rejected
- [ ] Verify `NEXT_PUBLIC_USE_FALLBACKS=true` works if Gemini fails during demo
- [ ] Confirm heatmap shows populated London before Sarah registers
- [ ] Test NL search: "I need a doctor in Southwark" → Haiku extracts skill=Doctor, borough=Southwark

---

## ARYAN — Backend API (core) + Supabase

**Status as of 2026-05-17 (session 15): ALL ROUTES DONE. Scoring overhaul merged. Supabase realtime confirm still pending.**

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

**Status as of 2026-05-17 (session 15):** `seedGov.ts` done. `realtime.ts` done. `rateLimit.ts` exists. Middleware exists. `/api/find` done.

- [x] `scripts/seedGov.ts` — L0 + L1 gov anchor accounts
- [x] `src/lib/realtime.ts` — `subscribeToUserScore()` implemented
- [x] `src/lib/rateLimit.ts` — rate limit helper exists
- [x] `src/middleware.ts` — middleware implemented
- [x] `GET /api/find` — skill + borough aggregation, fully implemented

---

## HEMISH — Frontend Components

**Status as of 2026-05-17 (session 15): ALL DONE. Notifications fully wired.**

- [x] `src/components/civic/Sidebar.tsx` — reads real session (display_name, score, tier, node_id)
- [x] `src/components/civic/TopBar.tsx` — reads real session, shows initials, logout works
- [x] Notifications — unread badge, mark-as-read, TopBar popup — fully implemented

---

## MAALAV — Pages + Routing

**Status as of 2026-05-17 (session 15): ALL PAGES DONE. `/map` merged into `/find`. Dashboard ego graph + notifications live.**

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
| `/unverified` | DONE | DONE | DONE |
| `/dashboard` | DONE | DONE | DONE + ego graph wired |
| `/add-evidence` | DONE | DONE | DONE |
| `/vouch` | DONE | DONE | DONE |
| `/find` | DONE | N/A (public) | DONE — map hero + listings + NL search |
| `/map` | REMOVED | — | Merged into `/find` |
| `/settings` | DONE | DONE | DONE (Node ID copy fixed) |
| `/profile/[username]` | DONE | DONE | DONE |

---

## SHARED — all team

### Types
All types in `src/types/index.ts`. Score formula: passport×20 + other_doc×15 (max 3 docs) + vouch×5 (max 10) + gov_vouch×20 (bypasses 90 cap). Vouch gate: 1 doc=5 vouches, 2 docs=3, 3 docs=2. Tiers: 0-19 Unverified, 20-54 Verified, 55-90 Trusted, 91-100 Gov Official.

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
- [ ] Submit NHS employer letter → score 30, tier: **Verified** (threshold: 20)
- [ ] Bad actor test: upload doc with wrong name → rejected ("name doesn't match")
- [ ] Dr. Osei (BLK-00471-LDN, score 74) vouches Sarah → score 40, still Verified
- [ ] Doctor pin appears on Southwark on /find map hero
- [ ] `/find` map: 200+ pins visible across London boroughs, counter live
- [ ] NL search: type "I need a doctor in Southwark" → Haiku interprets → results filter correctly
- [ ] Borough click → map flies to borough, non-selected boroughs dim, popup shows count
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
