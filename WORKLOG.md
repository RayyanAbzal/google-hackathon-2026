# WORKLOG

**Updated:** 2026-05-16 — PLAN LOCKED. Ready for implementation.

## Active task
Plan finalised. Waiting for team to pick app name, then write implementation plan.

## Phase
Planning → Implementation (transition)

## Key decisions — LOCKED

- **Platform:** Web app, laptop-optimised demo
- **Auth:** Node ID + 4-digit PIN. No email. No facial recognition (cut — too complex).
- **Claims: 3 types only:** Identity, Credential, Work. Resource + Information claims cut.
- **Screens: 3 only:** Onboarding, Profile+Claims, Map
- **Cut hard:** facial recognition, tinder swipe, dispute mechanic, verify queue (Screen 4), resource claims, info claims, score decay, voice, offline/PWA, P05
- **Trust score formula (build):** `score = min(100, claims_verified * 15 + vouches * 10)`
- **Doc verification:** Gemini Vision reads name/DOB/doc type. Name must match across all docs.
- **Vouch + Flag only** (no dispute in UI). Flag triggers penalty cascade (-15pts to vouchers).
- **Gov hierarchy:** L0 (hardcoded seed) → L1 (NHS/Met/council, pre-seeded) → L2 (75+) → L3 (50+)
- **All demo data fake:** 200 Londoners, 3 gov anchors, Dr. Osei, fake Sarah docs
- **Lore anchor:** CivicTrust deployed at T+6h post-flare by emergency coalition
- **User value:** Verified = NHS/Met/councils accept as temp staff credential
- **Wow:** skill pins on map, live counter (X/9M), vouch arc animation (stretch)
- **Demo close:** "142 are doctors. First hospital ward reopens tomorrow. Not from a server. From people."
- **Build estimate:** 13–14h (realistic for 28h hackathon after cuts)

## Team roles
- Ray: Gemini Vision, seed script, heatmap, glue, architecture
- Aryan: Supabase schema, API routes, trust score, penalty cascade, realtime
- Hemish: score ring, profile card, claim form, vouch/flag UI, polish
- Maalav: onboarding page, profile page, map page, routing

## Build order
1. Seed script + Supabase schema + register/login
2. Claim submit + Gemini Vision + trust score + profile
3. QR vouch + flag + penalty
4. Heatmap + skill pins + counter + polish

## Open (only thing blocking implementation plan)
- **App name** — TBD. Pick one: ANCHOR, VOUCH, NODE, THREAD, CivicTrust

## Files changed this session
- `docs/theme.md` — created
- `memory/*` — theme, status, solution plan all updated
- `.superpowers/.../final.html` — definitive locked plan with roles, hard cuts, advisor warning
- `scripts/test-face-match.mjs` — created (face-match test, not needed since facial recog cut)
- `WORKLOG.md` — this file
