# CivicTrust — Architecture

## Overview

CivicTrust is a post-disaster identity and trust system. Physical documents + community vouching replace destroyed digital records. A trust score (0–100) determines what a user can do and see.

## Stack

| Layer | Technology |
|---|---|
| Frontend + routing | Next.js 16 App Router, TypeScript strict |
| Styling | Tailwind v4, shadcn/ui |
| Map | D3.js choropleth heatmap |
| AI / doc analysis | Gemini 2.0 Flash (`analyseDocument()`) |
| Database + auth | Supabase (Postgres + RLS) |
| Realtime | Supabase Realtime (`subscribeToUserScore()`) |
| QR | qrcode.js (display) + html5-qrcode (scan) |
| Hosting | Vercel |

## Layer ownership

| Path | Owner | Responsibility |
|---|---|---|
| `src/app/api/` (auth, claims, vouch, score) | Aryan | Supabase schema, RLS, register, login, claims, vouch, flag, trust score |
| `src/app/api/` (rate limit, realtime, find) | Tao | Rate limiting, Supabase Realtime, Yellow Pages API |
| `src/components/` | Hemish | Score ring, profile cards, claim form, vouch/flag UI, QR display |
| `src/app/` (non-API pages) | Maalav | Onboarding, profile page, map page, /find page, routing |
| `src/lib/`, `src/types/`, `src/`, all of `src/` | Ray | Gemini, Supabase client, realtime, fallbacks, seed, heatmap, merges |

## Key data flows

**Registration:** name + password + mandatory doc → Gemini Vision extracts doc fields → name consistency check → Supabase insert → node ID issued (BLK-XXXXX-LDN)

**Claim submission:** claim type + photo → Gemini Vision → extract fields → name consistency check → doc dedup check → Supabase insert → score recalculated

**Vouching:** QR scan → mutual confirmation → Supabase vouch insert → both scores updated (+10 each)

**Yellow Pages:** public GET `/api/find` → query by skill/area → returns counts + anonymous pins (no names) — no auth required

**Score realtime:** Supabase Realtime subscription on `users` table → live score ring update

## Score formula

```
score = min(100, claims_verified * 15 + vouches_received * 10)
gov_vouch adds +20 per gov voucher
```

Penalty: vouching a fraud = -15pts to the voucher.

## Trust tiers

| Range | Tier | Key capability |
|---|---|---|
| 0–24 | Unverified | Submit claims. Cannot view profiles or vouch. |
| 25–59 | Verified | View all profiles. Vouch others. Appear on map + Yellow Pages. |
| 60–89 | Trusted | Gov vouch eligible. |
| 90–100 | Gov Official | Pre-seeded. GOV badge on map. |

## Trust graph / government hierarchy

- **L0 Seed:** 3 hardcoded Emergency Coalition accounts (score 100). Trust roots. No UI.
- **L1 Gov Officials:** NHS admin, Met Police, council lead. Pre-seeded. 2x vouch weight.
- **L2 Trusted:** Score 90+. Vouched by L1 or 3+ L2 within 3 hops of L0.
- **L3 Verified:** Score 50+. Vouched by any Verified user.

## Anti-scam (backend, no UI)

- Name consistency across all submitted docs (mismatch = reject)
- Doc dedup — same doc hash twice = silently rejected
- Penalty cascade — vouch a flagged user = -15pts drop
- Rate limiting — 5 vouches/24h, 3 claim submissions/10 min
- Gov vouch roots — score 90+ requires trust path to L0 within 3 hops

## Fallback strategy

`src/lib/fallbacks.ts` contains mock data for all external services.
Toggle with `USE_FALLBACKS=true` in `.env.local`. Flip if any API fails during demo.
