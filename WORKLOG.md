# WORKLOG

**Updated:** 2026-05-16 — scaffold committed, PR #2 open, team ready to build

## Active task
PR #2 open — waiting for Ray to merge to main so team can pull and start

## Phase
Implementation (transition — scaffold done, coding starts next)

## Files changed this session
- `CLAUDE.md` — updated with locked decisions, layer ownership, Ray owns DB
- `WORKLOG.md` — this file
- `docs/theme.md` — BLACKOUT theme reference
- `docs/PLAN.md` — full implementation plan (idea, flows, score, demo path, anti-scam)
- `docs/TASKS.md` — per-person task list with DB schema + demo checklist
- `src/types/index.ts` — shared TS types + calculateScore + getTier functions
- `src/app/api/CLAUDE.md` — Aryan + Tao API route map and rules
- `src/components/CLAUDE.md` — Hemish component list + priority order
- `src/app/CLAUDE.md` — Maalav page list + session handling + priority
- `src/lib/CLAUDE.md` — Ray lib ownership + Supabase table reference
- `scripts/test-face-match.mjs` — Gemini face-match test (reference, not in build)
- `memory/project_hackathon_theme.md` — full lore, constraints, OTB angles
- `memory/project_solution_plan.md` — full plan + all confirmed decisions
- `memory/project_marking_rubric.md` — 100pt rubric with per-category actions
- `memory/MEMORY.md` — index updated

## Next step
Ray merges PR #2 to main → all team members pull → Ray creates Supabase project + runs DB schema → development starts

## Open questions
- **App name** — still TBD. Only unresolved item. CivicTrust is placeholder.

## Key decisions — ALL LOCKED

**Product:**
- App: CivicTrust (name TBD) — trust score + Yellow Pages + post for help
- Primary problems: P01, P03, P04, P07, P08
- Platform: web app, laptop-optimised for demo
- Lore: deployed at T+6h post-flare by emergency coalition

**Auth:**
- Node ID (BLK-XXXXX-LDN) issued on signup → user sets @username after first login
- Login: node ID (or @username) + 4-digit PIN
- No email, no facial recognition, no biometrics, no device fingerprinting

**Mandatory doc at signup:**
- Passport OR driving licence required during registration
- Everyone starts Unverified regardless — vouches push to 50+

**Score thresholds (updated):**
- 0–49: Unverified (default)
- 50–89: Verified
- 90–94: Trusted
- 95–100: Gov Official

**Score formula (build):**
`score = min(100, claims_verified * 15 + vouches_received * 10)`

**Claims: 3 types only:**
Identity, Credential, Work. Resource + Info claims cut.

**Screens: 4 pages:**
Register/Login, Profile+Claims, Map, /find (Yellow Pages), /help (post for help)

**Yellow Pages (/find):**
- Map + search: public (no login)
- Profile details: login required
- Search by skill OR resource

**Post for help (/help):**
- Any registered user can post
- Only Verified (50+) can respond
- Posts expire 24h

**Gov hierarchy:**
- L0: 3 hardcoded seed accounts (T+6h coalition)
- L1: NHS admin, Met Police, council (pre-seeded at 95)
- L2: Trusted (90+)
- L3: Verified (50+)

**Anti-scam (backend only, no UI):**
- Name consistency: Gemini reads name from doc, must match registered name
- Doc dedup: content hash, reject duplicates
- Penalty cascade: vouch fraudster = -15pts, drop below 50 = lose Verified
- Rate limiting: 5 vouches/24h, 3 claims/10 min

**Cut hard (confirmed):**
Facial recognition, device fingerprinting, Face ID, biometrics, tinder swipe, dispute mechanic, verify queue, resource claims, info claims, score decay, voice input, offline/PWA, P05, external DB checks

**Demo data:** all fake and pre-seeded. Seed script = Ray's first task.

**Team roles:**
- Ray: full-stack lead, Gemini Vision, DB + seed script, heatmap, architecture
- Aryan: API routes (auth, claims, vouch, score) — `src/app/api/`
- Tao: API routes (rate limit, realtime, find, help) — `src/app/api/`
- Hemish: UI components (score ring, profile, forms) — `src/components/`
- Maalav: pages + routing — `src/app/` (non-API)

**Build phases:**
1. (~3h) Seed script + DB schema + register + login
2. (~4h) Claims + Gemini + score + profile UI
3. (~4h) QR vouch + Yellow Pages + post for help
4. (~4h) Heatmap + map pins + counter + polish + demo

**Marking rubric:** Technical 35 (biggest), Idea 30, Design 20, Presentation 15.
Ship working flows first. Polish second.

**PR:** #2 open at https://github.com/RayyanAbzal/google-hackathon-2026/pull/2
