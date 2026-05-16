# WORKLOG

**Updated:** 2026-05-16 (session 13)

## Active task
Map wired to live Supabase data + live verified counter with realtime

## Phase
implementing

## Files changed this session
- `src/app/map/page.tsx` — replaced static FALLBACK_USERS with Supabase fetch (verified/trusted/gov_official), added live counter UI, realtime subscription for both count and pins
- `src/components/map/HeatMap.tsx` — split single effect into two: geojson loads once ([] deps), counts recompute on users change. Added pin tooltips, borough name labels, improved color scale
- `src/components/civic/TierBadge.tsx` — removed stale 'partial' key from TIER_MAP (not in TrustTier type)
- `src/lib/fallbacks.ts` — USE_FALLBACKS -> NEXT_PUBLIC_USE_FALLBACKS (was dead in browser bundles)
- `.env.local` + `.env.local.example` — same rename

**Supabase (via MCP):**
- Applied migration: `ALTER PUBLICATION supabase_realtime ADD TABLE users` — realtime now active on users table
- Verified DB state: 61 verified + 40 trusted + 6 gov_official = 107 users shown on map. Counter shows 107 / 9,000,000

## Next step
Demo prep: run seed script one more time with --wipe, then test full demo path end-to-end

## Open questions
- Aryan: does /api/auth/register call Gemini at signup, or deferred to claims only?
- Tao: /api/find ETA? Blocks Yellow Pages demo step
- `skill` defaults to 'Other' at signup — profile edit page needed?

## Known pre-existing issue (not introduced this session)
**partial tier mismatch:** DB has 40 users with `tier='partial'` but `TrustTier` in `src/types/index.ts` does not include `'partial'` and `getTier()` never produces it. The seed script uses different thresholds (0-29 Unverified, 30-49 Partial...) than the types file (0-24 Unverified, 25-59 Verified...). These users are correctly excluded from the map (partial is not verified+). However, any code path that passes a DB user row directly to `TierBadge` with `tier='partial'` will runtime-crash. Fix before demo: either add 'partial' back to TrustTier, or re-seed with corrected thresholds.

## Key decisions — LOCKED

**DB table name:** `gov_officials` (renamed from gov_anchors). All code, seeds, migration now aligned.

**Gemini API:** staying with Gemini (not Claude) — GDGC = Google hackathon, strategic advantage.

**Frontend design:** Tactical Resilience dark theme (bg #10141a, primary #b0c6ff, secondary #40e56c). Inline styles for design token colours — not Tailwind classes for colour values. Do not switch patterns.

**Components superseded:** TrustRing, ScoreBadge, ProfileCard, VouchQR — implemented inline in pages. Do not rebuild. TopBar, Sidebar, TierBadge, Icon live in `src/components/civic/`.

**Profile removed:** /profile/[username] redirects to /dashboard. Dashboard IS the profile.

**Auth:** node_id OR @username + password. Session in localStorage key `civictrust_session`. Min 6 char password, SHA256 hashed.

**Score formula:** `min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched ? 20 : 0)`

**Score thresholds:** 0-24 Unverified | 25-59 Verified | 60-89 Trusted | 90-100 Gov Official

**Fallback toggle:** `NEXT_PUBLIC_USE_FALLBACKS=true` in `.env.local` (was USE_FALLBACKS — renamed this session)

**Seed:** 207 users live (6 gov + Dr. Osei + 200 Londoners). Password: password123 | Gov: govpassword99. Re-run with --wipe before demo.

**Dedup:** doc content hash is global — same document cannot be used across any account.

**Vouch:** vouchee score recalculates on vouch. Voucher penalty (-15) fires only on flagged claim.

**Git workflow:** dev = integration. Never commit to main. Ray merges dev -> main before demo.

**Team roles:**
- Ray: full-stack lead, Gemini Vision, seed scripts, heatmap (D3), realtime
- Aryan: Supabase setup + API (auth, claims, vouch, flag, score)
- Tao: /api/find, rate limiting middleware, seedGov
- Hemish: civic components done; now wiring dashboard claims + vouch confirm
- Maalav: all pages built; now wiring auth guards + real session data + add-evidence submit
