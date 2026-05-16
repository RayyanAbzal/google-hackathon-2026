# CivicTrust — Roadmap & Progress

> BLACKOUT · GDGC UOA 2026 · Last updated: 2026-05-16

---

## What we're building

After a solar flare wipes all digital records, people need a way to prove who they are using physical documents and peer trust. CivicTrust lets you:

1. Register with a passport or driving licence
2. Submit documents to build a trust score
3. Vouch for people you know
4. Appear on a London map so others can find verified doctors, engineers, and tradespeople

---

## Demo path (the 4-minute story)

```
Sarah registers → uploads passport → gets BLK-XXXXX-LDN node ID
→ uploads medical degree → score rises
→ Dr. Osei (pre-seeded) scans her QR and vouches
→ second vouch → score hits 50 → Verified tier
→ Doctor pin appears on London map in Southwark
→ Yellow Pages: search "Doctor" → "Southwark: 3 verified doctors"
```

---

## Score tiers

| Score | Tier | Colour |
|-------|------|--------|
| 0–29 | Unverified | Red |
| 30–49 | Partial | Orange |
| 50–89 | Verified | Green |
| 90–94 | Trusted | Amber |
| 95–100 | Gov Official | Gold |

Formula: `min(100, claims_verified × 15 + vouches_received × 10 + gov_vouched × 20)`

---

## Overall status

| Area | Owner | Status |
|------|-------|--------|
| DB schema + migrations | Ray | DONE |
| Auth API (register/login/username) | Aryan | DONE |
| Claims API | Aryan | DONE |
| Vouch API | Aryan | DONE |
| Users API | Aryan | DONE |
| Score API | Aryan | DONE |
| Find API (Yellow Pages) | Tao | NOT STARTED |
| Rate limiting middleware | Tao | NOT STARTED |
| Realtime subscription helper | Tao | NOT STARTED |
| HeatMap component | Ray | DONE |
| SkillPin component | Ray | DONE |
| TrustRing component | Hemish | STUB (9 lines) |
| ScoreBadge component | Hemish | STUB (10 lines) |
| ProfileCard component | Hemish | STUB (11 lines) |
| ClaimCard component | Hemish | STUB (10 lines) |
| ClaimForm component | Hemish | STUB (17 lines) |
| VouchQR component | Hemish | STUB (16 lines) |
| Register page | Maalav | DONE (132 lines) |
| Login page | Maalav | DONE (97 lines) |
| Dashboard page | Maalav | DONE (364 lines) |
| Map page | Maalav | DONE (181 lines) |
| Find page | Maalav | DONE (137 lines) |
| Vouch page | Maalav | DONE (349 lines) |
| Add Evidence page | Maalav | DONE (415 lines) |
| Settings page | Maalav | DONE (265 lines) |
| Landing page | Maalav | DONE (116 lines) |
| Seed script (200 Londoners) | Ray | IN PROGRESS |
| Gov seed script | Ray/Tao | IN PROGRESS |
| Supabase realtime enabled | Aryan | NEEDS CONFIRM |
| RLS policies set | Aryan | NEEDS CONFIRM |

---

## Detailed breakdown

### Backend API routes

| Route | Status | Notes |
|-------|--------|-------|
| `POST /api/auth/register` | DONE | Password hashed, node_id generated, doc analysed via Gemini |
| `POST /api/auth/login` | DONE | node_id or @username + password |
| `PATCH /api/auth/username` | DONE | Set @handle after first login |
| `POST /api/claims` | DONE | Gemini analysis, name match, dedup hash, score recalc |
| `GET /api/claims/[userId]` | DONE | Returns all claims with vouch counts |
| `POST /api/vouch` | DONE | Score >= 50 required, rate-limited, score recalc |
| `POST /api/vouch/flag` | DONE | Penalises vouchers -15pts each |
| `GET /api/users/[username]` | DONE | Public profile, requires auth + score >= 50 |
| `GET /api/score/[userId]` | DONE | Current score + tier |
| `GET /api/find` | NOT STARTED | Returns grouped skill/borough counts |

### Frontend components

The Tactical Resilience design system is shipped. Civic shell components are complete. The old planned components (TrustRing, ProfileCard etc.) are superseded by inline implementations in the pages — do not rebuild them.

| Component | Status | Notes |
|-----------|--------|-------|
| TopBar | DONE | Fixed nav, notifications popup, avatar menu + sign out |
| Sidebar | DONE | Fixed left nav, identity card, tier progress bar, active state |
| TierBadge | DONE | Replaces ScoreBadge — all 5 tiers |
| Icon | DONE | Material Symbols Outlined wrapper |
| TrustRing | SUPERSEDED | Score ring is inline SVG in dashboard/page.tsx |
| ScoreBadge | SUPERSEDED | Replaced by TierBadge in src/components/civic/ |
| ProfileCard | SUPERSEDED | Dashboard IS the profile now |
| VouchQR | SUPERSEDED | QR is inline SVG in vouch/page.tsx |
| ClaimCard | STUB — low priority | Dashboard evidence cards are inline; only needed if wiring real data |
| ClaimForm | STUB — low priority | Add-evidence page has its own wizard flow |

### Pages

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Landing | `/` | DONE | Hero + CTAs |
| Register | `/register` | DONE | 2-step: details + doc upload |
| Login | `/login` | DONE | node_id or @username + password |
| Dashboard | `/dashboard` | DONE | Profile + claims — uses stub components |
| Map | `/map` | DONE | HeatMap + SkillPin embedded |
| Find | `/find` | DONE (UI only) | UI done, API not started |
| Vouch | `/vouch` | DONE (UI only) | UI done, VouchQR is a stub |
| Add Evidence | `/add-evidence` | DONE (UI only) | UI done, ClaimForm is a stub |
| Settings | `/settings` | DONE | Username update, password change |
| Profile redirect | `/profile/[username]` | DONE | Redirects to `/dashboard` |

### Infrastructure

| Item | Status |
|------|--------|
| DB schema (`supabase/migrations/0001_init.sql`) | DONE |
| Seed script (`scripts/seed.ts`) | IN PROGRESS |
| Gov seed (`scripts/seedGov.ts`) | IN PROGRESS |
| Fallback toggle (`USE_FALLBACKS=true`) | DONE |
| Supabase realtime on `users` table | NEEDS CONFIRM |
| RLS policies | NEEDS CONFIRM |
| London GeoJSON for HeatMap | DONE (embedded in component) |

---

## Critical path to demo

In order — each step unblocks the next.

```
1. Maalav: add auth guards to protected pages   ← BLOCKING — anyone can hit /dashboard now
2. Maalav: wire session data into pages         ← BLOCKING — hardcoded "Sarah Mitchell" everywhere
3. Maalav: wire add-evidence submit → POST /api/claims
4. Hemish: wire dashboard evidence → GET /api/claims/[userId]
5. Hemish: wire vouch confirm → POST /api/vouch
6. Tao: implement /api/find                     ← BLOCKING Yellow Pages real results
7. Tao: implement realtime helper               ← BLOCKING live score updates
8. Aryan: confirm RLS + realtime on             ← BLOCKING live data
9. Ray: run seed scripts                        ← BLOCKING map population
10. All: full demo path rehearsal
```

---

## Demo checklist

- [ ] Seed run — 200 users + Gov Officials + Dr. Osei visible on map
- [ ] Register as Sarah Mitchell + passport upload → node ID issued, tier: Unverified
- [ ] First login → set @sarah_mitchell username
- [ ] Submit medical degree → score 15, tier: Unverified
- [ ] Submit NHS employer letter → score 30, tier: Partial
- [ ] Bad actor test: wrong-name doc → rejected
- [ ] Dr. Osei QR-vouches Sarah → score 40
- [ ] Second vouch → score 50 → tier: Verified → Doctor pin on map
- [ ] Map: 200+ pins visible, counter shows "1,847 / 9,000,000"
- [ ] Yellow Pages: search "Doctor" → "Southwark: 3 verified doctors"
- [ ] Yellow Pages: search "insulin" → returns relevant results
- [ ] `USE_FALLBACKS=true` tested — app works if Gemini is down
- [ ] Full demo rehearsed at least twice

---

## Marking rubric

| Category | Points | How we score |
|----------|--------|-------------|
| Technical | 35 | Working prototype: auth, claims, vouch, map all live |
| Idea | 30 | Post-disaster identity rebuild — real problem, novel solution |
| Design | 20 | Dark UI, TrustRing animation, heatmap — Hemish owns this |
| Presentation | 15 | Sarah's story arc hits all 4 minutes |

**Technical is the biggest category. Working beats beautiful every time.**

---

## Quick links

| Resource | Path |
|----------|------|
| Full implementation plan | `docs/PLAN.md` |
| Per-person task list | `docs/TASKS.md` |
| Architecture decisions | `docs/decisions.md` |
| Architecture overview | `docs/architecture.md` |
| Lore / narrative | `docs/lore.md` |
| Fallback toggle | `.env.local` → `USE_FALLBACKS=true` |
| Seed command | `npx tsx scripts/seed.ts` |
| Gov seed command | `npx tsx scripts/seedGov.ts` |
