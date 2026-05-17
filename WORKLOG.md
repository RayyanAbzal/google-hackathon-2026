# WORKLOG

**Updated:** 2026-05-17 — pre-demo QA sweep, 2hrs to presentation

## Active task
Full e2e API + static QA sweep against running dev server. 35 endpoint cases hit, theme/rubric scored.

## Phase
reviewing

## Files changed this session
None — read-only QA. All changes are recommendations, not applied.

## Next step
Decision pending: fix HeatMap.tsx:203,206 refs-during-render (5 min, React 19 lint error, blank-map risk). Optional 10-min add server-side ?skill/?borough filter to src/app/api/find/listings/route.ts.

## Open questions
- HeatMap fix now or after manual heatmap smoke?
- /api/find/listings client-side filter acceptable for demo, or implement server-side?
- npm test 9/12 failures are Node ws transport (Supabase realtime) — confirmed env, not code. Leave?

## Key decisions
- Test fallback disabled (NEXT_PUBLIC_USE_FALLBACKS=false) — real Gemini + Anthropic in play during demo.
- Login creds confirmed: BLK-30001-LDN / password123 → Eleanor Whitfield (gov_official, score 100).
- All 401 gates verified: vouch, claims, profile, notifications, users/lookup. Bad/expired token → 401.
- All 400 validation paths verified on register/login/vouch/claims/profile. No 500s anywhere in sweep.
- Rate limits work: vouch 5/24h enforced.
- AI integration live: /api/find/borough-report returns real Anthropic Sonnet output; /api/find/interpret-search returns real Gemini structured output.
- Score: 91/100. Technical 32/35, Idea 29/30, Design 17/20, Presentation 13/15. Theme (BLACKOUT) fit is strong — solves P01–P04, P06–P08.
- P2 issues (cosmetic, skip for demo): vouch self/bad-uuid returns 404 not 422/400; /api/auth/username GET 405 (PATCH only, undocumented).
