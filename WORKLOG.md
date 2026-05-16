# WORKLOG

**Updated:** 2026-05-16 (session 15 end)

## Active task
Scoring overhaul fully synced, committed, and pushed to origin/dev

## Phase
reviewing

## Files changed this session
- `src/lib/score.ts` — `gov_anchors` → `gov_officials` (was silently broken at runtime)
- `src/app/api/auth/register/route.ts` — missing `SkillTag` import added
- `src/app/api/find/route.ts` — pulled Aryan's updated version (uses score >= 50 filter)
- `src/app/dashboard/page.tsx` — tier labels (Tier 2/3 → Tier 1/2), `ptsToNext` thresholds (90/60/25 → 91/55/20), activity "+10 pts" → "+5 pts"
- `src/app/vouch/page.tsx` — "+10 points" → "+5 points"; pulled Aryan's latest (QR scanner, copy node ID)
- `src/app/(auth)/unverified/page.tsx` — "50 pts to verified" → "20", "+10 each" → "+5 each", "Tier 2" → "Tier 1"
- `src/app/page.tsx` — tier table thresholds updated (0-19/20-54/55-90/91-100)
- `src/components/civic/Sidebar.tsx` — `tierLabel()` 95/90/50/30 → 91/55/20
- `src/components/civic/TierBadge.tsx` — "Tier 2 · Community" → "Tier 1 · Verified", "Tier 3 · Trusted" → "Tier 2 · Trusted"
- `src/components/CLAUDE.md` — tier thresholds updated
- `src/app/api/CLAUDE.md` — scoring formula + route map updated (node lookup added)
- `docs/TASKS.md` — shared types section formula + thresholds updated
- `docs/ROADMAP.md` — old formula + tier table replaced
- `docs/architecture.md` — old formula replaced
- `docs/decisions.md` — ADR-002 updated
- `docs/PLAN.md` — old formula replaced
- `docs/session-handoff.md` — all `gov_anchors` → `gov_officials`

## Next step
Run `npx tsx scripts/seed.ts --wipe` then test full demo path end-to-end:
register → add-evidence × 2 → Dr. Osei vouch → score updates → map pin appears

## Open questions
- Demo path math with new scoring: Sarah needs 2 other docs (30pts) but vouch gate requires 3 vouches with 2 docs before she can hit Verified (20+). Need to verify if Dr. Osei vouch alone is enough to unlock gate, or if demo path needs a third voucher.
- `/api/find` uses `score >= 50` filter but Verified starts at 20 — intentional conservative filter or stale?

## Key decisions

**Scoring (Aryan, session 14 — fully synced session 15):**
- ScoreInput: `passport_count`, `other_doc_count`, `vouches_received`, `gov_vouched`
- passport = 20pts each, other doc = 15pts each, max 3 docs total
- vouches = 5pts each, max 10 counted
- gov vouch bonus: +20, bypasses 90 cap
- Vouch minimum gate: 1 doc = 5 vouches, 2 docs = 3, 3 docs = 2 — below min, capped at 19
- User cap without gov vouch: 90
- Tiers: 0-19 Unverified | 20-54 Verified | 55-90 Trusted | 91-100 Gov Official
- Vouch gate: score >= 20

**DB table:** `gov_officials` (not gov_anchors — was broken in score.ts, now fixed)

**Find page intentionally hardcoded** — /api/find returns aggregated counts only, not individual profiles. Do not wire.

**All pages guarded + wired** — confirmed by session 14 audit.

**Auth:** node_id OR @username + password. Session in localStorage key `civictrust_session`.

**Fallback toggle:** `NEXT_PUBLIC_USE_FALLBACKS=true` in `.env.local`

**Seed:** re-run with `--wipe` before demo. Password: password123 | Gov: govpassword99.

**Git workflow:** dev = integration. Never commit to main. Ray merges dev → main before demo.

**Commit pushed:** `ada9f26` — fix: sync scoring overhaul across all UI, routes, and docs

**Team roles:**
- Ray: full-stack lead, Gemini Vision, seed scripts, heatmap, realtime
- Aryan: all core API routes (auth, claims, vouch, score) — done
- Tao: /api/find, middleware, seedGov, realtime.ts — done
- Hemish: civic components — done
- Maalav: all pages + guards + wiring — done

**Frontend design:** Tactical Resilience dark theme (bg #10141a, primary #b0c6ff, secondary #40e56c). Inline styles for design tokens — do not switch to Tailwind for colours.

**Gemini:** staying with Gemini — GDGC = Google hackathon.
