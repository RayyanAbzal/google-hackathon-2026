# WORKLOG

**Updated:** 2026-05-16 (session — dashboard trust network wiring + EgoGraph interactivity)

## Active task
Dashboard fully wired to DB; Trust Network section connected to real vouch data with interactive ego graph

## Phase
implementing

## Files changed this session
- `src/app/api/network/[userId]/route.ts` — NEW: returns real voucher nodes (type, display_name, username, tier, vouched_at), pts_this_week via snapshot diff, total_vouchers; capped at 12 displayed nodes
- `src/components/civic/svg/EgoGraph.tsx` — rewritten: 4 tier rings matching landing page; nodes placed on ring by voucher tier; hover tooltip shows name/@username/tier badge/vouched date; tooltip dismisses on mouse-out; no-flicker: passes `[]` while loading (not mock fallback)
- `src/app/dashboard/page.tsx` — fetches /api/network; passes real voucher nodes to EgoGraph; shows real pts_this_week (hidden when 0); replaced hardcoded "Southwark, London" with session.borough; added networkLoaded flag to prevent mock flicker
- `src/app/CLAUDE.md` — (pre-existing, no change this session)

## Next step
Visual QA in browser — verify: 4 rings visible; hover node shows tooltip with real name/tier; tooltip clears on mouse-out; pts_this_week shows correct diff; borough shows from session; no mock flicker on page load

## Open questions
- Scoring formula multipliers still not tuned to tier boundaries (deferred from last session)
- EgoGraph legend still says "Gov. voucher / Community voucher" — should it now say all 4 tiers to match the rings?
- Only 1 real voucher in DB for demo user (David Lewis / Verified) — graph looks sparse; seed more vouchers for demo?

## Key decisions
- pts_this_week uses snapshot diff (recalculate score as-of-7-days-ago, diff with current) — not naive 5×count which breaks at caps
- EgoGraph 4 rings: Gov Official (innermost, green solid), Trusted (green dashed), Verified (blue dashed), Unverified (gray dashed) — matches landing page "Four rings of trust"
- Nodes placed on ring matching voucher's own tier, not just gov/community binary
- No mock fallback while loading: passes `vouchers={[]}` until networkLoaded=true — shows rings + YOU only during fetch
- Tooltip clears via onMouseLeave on each node `<g>` (SVG-level onMouseLeave alone was insufficient)
- hardcoded "Southwark, London" replaced with session.borough (already in Session type from login route)
