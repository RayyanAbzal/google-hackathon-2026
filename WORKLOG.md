# WORKLOG

**Updated:** 2026-05-16 14:05 NZST

## Active task
Docs + config sync complete — team ready to build on dev branch

## Phase
Implementation (starting — scaffold + docs locked, coding begins)

## Files changed this session
- `docs/PLAN.md` — full rewrite to match final brainstorm spec (5 tiers, 7 problems, flows, registration with mandatory doc, no help posts)
- `docs/TASKS.md` — full rewrite (per-person tasks, score logic, shared types block, demo checklist)
- `CLAUDE.md` — merged dev + main versions, removed help posts, added partial tier, updated ownership table + key decisions
- `src/app/api/CLAUDE.md` — removed help routes, added partial tier to score thresholds, updated Aryan owns Supabase
- `src/app/CLAUDE.md` — removed /help page, updated priority order and session object shape
- `src/components/CLAUDE.md` — removed HelpPostCard, added 5-tier colour mapping to score ring
- `src/lib/CLAUDE.md` — removed help_posts table, cleaned up file list
- `src/types/index.ts` — added `partial` to TrustTier, updated getTier() for 5 tiers, added gov_vouched bonus to calculateScore
- `src/app/api/help/route.ts` — DELETED (help posts cut)
- `src/app/help/page.tsx` — DELETED (help posts cut)
- `src/components/trust/HelpPostCard.tsx` — DELETED (help posts cut)
- `src/components/trust/HelpPostForm.tsx` — DELETED (help posts cut)

## Next step
Ray: create Supabase project → share URL + anon key → wire `src/lib/supabase.ts` → implement `analyseDocument()` in `src/lib/gemini.ts` → write and run `scripts/seed.ts`

## Open questions
- App name still TBD (CivicTrust is placeholder)
- Aryan to confirm Supabase project created and SQL schema run

## Key decisions — LOCKED

**Cut this session:**
- Post for help (/help) — removed from docs, tasks, and codebase entirely
- Voice input — removed from not-building list (was never on the table)
- Tinder swipe gesture — removed from not-building list

**Score thresholds (final):**
- 0–29: Unverified
- 30–49: Partial
- 50–89: Verified
- 90–94: Trusted
- 95+: Gov Official

**Score formula:**
`score = min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched ? 20 : 0)`

**Registration:** mandatory doc (passport OR driving licence) at signup. Node ID issued immediately. @username set after first login.

**Yellow Pages (/find):** public search by skill OR resource. Viewing profiles requires login.

**Git workflow:** dev is the working branch. No worktrees. Branch off dev, merge back to dev. Ray syncs dev → main before demo.

**Branch state:** dev = main = f4f2067

**Problems solved (7/8):** P01, P02, P03, P04, P06, P07, P08. P05 out of scope.

**Gov hierarchy:**
- L0: 3 hardcoded seed accounts, score 100 (T+6h coalition)
- L1: NHS admin, Met Police, council — pre-seeded, score 100, GOV badge, 2x vouch weight
- L2: Trusted (90+) — vouched by L1 or 3+ L2, path to L0 within 3 hops
- L3: Verified (50+) — general public, appear on map

**Team roles:**
- Ray: full-stack lead, Gemini Vision, seed script, heatmap (D3), QR vouch glue
- Aryan: Supabase setup + API (auth, claims, vouch, flag, score)
- Tao: API (rate limiting, realtime, Yellow Pages /find)
- Hemish: UI components (score ring, profile card, forms, QR, polish)
- Maalav: pages + routing (/register, /login, /profile, /map, /find, /)

**Build phases:**
1. (~3h) Seed script + DB schema + register + login
2. (~4h) Claims + Gemini Vision + score + profile UI
3. (~3h) QR vouch flow + vouch/flag + penalty logic
4. (~4h) Heatmap + map pins + Yellow Pages + polish + demo
