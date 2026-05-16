# WORKLOG

**Updated:** 2026-05-16 (session 15)

## Active task
Backend/frontend/DB audit complete. Scoring overhaul synced. All checks passing.

## Phase
testing

## Files changed this session
- `src/lib/score.ts` — fixed `gov_anchors` -> `gov_officials` (correct table name); passport/other_doc split preserved
- `src/app/api/vouch/route.ts` — vouch gate confirmed at `score < 20` (Aryan's threshold)
- `src/app/page.tsx` — landing page tier thresholds corrected to 0-19 / 20-54 / 55-90 / 91-100
- `scripts/test-score.ts` — new: 19 tests validating calculateScore + getTier against Aryan's spec (all pass)

## Next step
Test full demo path end-to-end: register -> add-evidence x2 -> vouch from gov user -> check score recalculates

## Open questions
- `unverified` page still says "50 points to verified" — wrong (should be 20). Low priority.
- `vouches` table has no unique constraint on (voucher_id, vouchee_id) — duplicate vouches possible if user submits twice fast. Low priority for demo.
- Sidebar `tierLabel()` may use old thresholds (90/60/25) — verify after demo path test.

## Key decisions

**Scoring (Aryan, session 14 — now confirmed correct in code):**
- ScoreInput: `passport_count`, `other_doc_count`, `vouches_received`, `gov_vouched`
- passport = 20pts each, other doc = 15pts each, max 3 docs counted
- vouches = 5pts each, max 10 counted
- gov vouch bonus: +20, can push past 90 cap to 100
- Vouch minimum gate: 1 doc = 5 vouches, 2 docs = 3, 3 docs = 2 — below min, score capped at 19
- User cap without gov vouch: 90
- Tiers: 0-19 Unverified | 20-54 Verified | 55-90 Trusted | 91-100 Gov Official
- Vouch gate: score >= 20

**DB table:** `gov_officials` (confirmed via Supabase list_tables — not gov_anchors)

**Find page intentionally hardcoded** — /api/find returns aggregated counts only. Do not wire.

**All pages guarded + wired as of session 14** — confirmed by audit.

**Auth:** node_id OR @username + password. Session in localStorage key `civictrust_session`.

**Fallback toggle:** `NEXT_PUBLIC_USE_FALLBACKS=true` in `.env.local`

**Seed:** 214 users live. Password: password123 | Gov: govpassword99.

**Git workflow:** dev = integration. Never commit to main. Ray merges dev -> main before demo.

**Team roles:**
- Ray: full-stack lead, Gemini Vision, seed scripts, heatmap, realtime
- Aryan: Supabase setup + all core API routes (auth, claims, vouch, score)
- Tao: /api/find, rate limiting middleware, seedGov, realtime.ts
- Hemish: civic components (TopBar, Sidebar, TierBadge, Icon) — all done
- Maalav: all pages built + guarded + wired — done

**Frontend design:** Tactical Resilience dark theme (bg #10141a, primary #b0c6ff, secondary #40e56c). Inline styles for design tokens.

**Gemini:** staying with Gemini — GDGC = Google hackathon, strategic advantage.
