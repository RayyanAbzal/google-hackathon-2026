# WORKLOG

**Updated:** 2026-05-16 (session 16)

## Active task
Demo readiness — tier fixes committed, E2E path verified

## Phase
reviewing

## Files changed this session
- `src/app/_components/LandingContent.tsx` — tier table corrected (0-19/20-54/55-90/91-100, names: Unverified/Verified/Trusted/Gov Official). Also refactored by teammate: landing content extracted from page.tsx into this component, Sidebar added to landing with SidebarProvider context.
- `src/app/page.tsx` — now a 12-line shell importing LandingContent (teammate refactor)
- `src/app/vouch/page.tsx` — stale comment "score gate >=50" corrected to >=20
- `src/components/civic/Sidebar.tsx` — collapsible sidebar (240px/56px), AUTH_NAV vs PUBLIC_NAV modes (teammate)
- `src/components/civic/SidebarProvider.tsx` — new: context + useSidebar() hook, persists collapse state to localStorage `sidebar_collapsed` (teammate)

## Next step
Re-run `npx tsx scripts/seed.ts --wipe` before demo to reset Dr. Osei to score 74 + clean slate.
Then do one manual walkthrough in browser: register → add-evidence × 2 → vouch × 3 → dashboard shows Verified.

## Open questions
- QR vouch flow not tested in browser (only via curl). Confirm Hemish's QR scanner works on mobile at demo.
- `find/route.ts` uses `score >= 20` (confirmed correct this session — old worklog was stale saying 50).

## Key decisions

**Scoring (confirmed correct in code as of session 16):**
- passport = 20pts each, other doc = 15pts each, max 3 docs total
- vouches = 5pts each, max 10 counted
- gov vouch bonus: +20, bypasses 90 cap
- Vouch minimum gate: 1 doc = 5 vouches, 2 docs = 3, 3 docs = 2 — below min, score capped at 19
- User cap without gov vouch: 90
- Tiers: 0-19 Unverified | 20-54 Verified | 55-90 Trusted | 91-100 Gov Official
- Vouch gate: score >= 20

**E2E path verified via curl (session 16):**
- Register → 2 claims (with USE_FALLBACKS=true) → 3 vouches from seeded users → score 50, tier verified
- Gate math confirmed: 2 docs needs 3 vouches minimum. Score stays 19 until 3rd vouch lands.
- Seeded users login via node_id (BLK-10XXX-LDN), NOT username (only dr_osei has username set)
- Good demo vouchers: BLK-10003-LDN (score 20), BLK-10010-LDN (score 94)
- Global doc dedup: rejected claims also store hash — need unique image bytes per claim submission

**DB cleanup (session 16):** Two test users deleted from Supabase (Sarah Test + Sarah Mitchell + their claims/vouches)

**Commit:** `4e6a69f` — fix(ui): correct tier thresholds to 0-19/20-54/55-90/91-100 across all UI

**Auth:** node_id OR @username + password. Session in localStorage key `civictrust_session`.

**Fallback toggle:** `NEXT_PUBLIC_USE_FALLBACKS=true` in `.env.local` — flip to true if Gemini fails at demo.

**Seed:** re-run with `--wipe` before demo. Password: password123 | Gov: govpassword99.

**Git workflow:** dev = integration. Never commit to main. Ray merges dev → main before demo.

**Team roles:**
- Ray: full-stack lead, Gemini Vision, seed scripts, heatmap, realtime
- Aryan: all core API routes (auth, claims, vouch, score) — done
- Tao: /api/find, middleware, seedGov, realtime.ts — done
- Hemish: civic components (Sidebar collapsible + SidebarProvider added this session) — done
- Maalav: all pages + guards + wiring — done

**Frontend design:** Tactical Resilience dark theme (bg #10141a, primary #b0c6ff, secondary #40e56c). Inline styles for design tokens.

**Gemini:** staying with Gemini — GDGC = Google hackathon.
