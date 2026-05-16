# WORKLOG

**Updated:** 2026-05-16 (session 11)

## Active task
Idle — DB provisioned, schema aligned, seed scripts fixed, pushed to dev

## Phase
implementing

## Files changed this session
- `supabase/migrations/0001_init.sql` — full rewrite: password_hash, skill nullable, drop help_posts, rename gov_officials -> gov_anchors, add CHECK constraints, sync RLS policies to live DB
- `src/lib/CLAUDE.md` — gov_officials -> gov_anchors table name
- `src/lib/fallbacks.ts` — expand FALLBACK_USERS to 20 boroughs, remove FALLBACK_HELP_POSTS (feature cut)
- `src/components/map/HeatMap.tsx` — implement D3 choropleth + skill pins (was TODO stub)
- `src/components/map/SkillPin.tsx` — implement SVG circle with gov ring variant
- `docs/TASKS.md` — mark Aryan's Supabase setup items done (schema + RLS applied via MCP), flag Realtime as still outstanding
- `scripts/seed.ts` — fix gov_officials -> gov_anchors (was reverted by hook/process)
- `scripts/seedGov.ts` — fix gov_officials -> gov_anchors (same)
- `package.json` / `package-lock.json` — install d3 + @types/d3
- `PLAN.md` (root) — DELETED (duplicate of docs/PLAN.md)
- `ROLES.md` (root) — DELETED (stale, covered by AGENTS.md)

**Supabase (via MCP):**
- Renamed `gov_officials` -> `gov_anchors` in live DB
- Fixed claims RLS: was SELECT WHERE status='verified' only — changed to SELECT all
- Added missing INSERT policies for all tables
- Added `gov_anchors_insert` policy
- Confirmed all 4 tables live: users, claims, vouches, gov_anchors (all RLS enabled, 0 rows)
- GEMINI_API_KEY added to .env.local

## Next step
Run seed script once Aryan confirms Realtime is enabled:
```
npx tsx scripts/seed.ts --wipe
```
Then verify 200+ rows in Supabase dashboard.

## Open questions
- Aryan: Enable Realtime on `users` table — Supabase dashboard > Database > Replication > Tables > users > toggle on
- Aryan: does /api/auth/register call Gemini at signup, or deferred to claims only?
- Tao: /api/find ETA? Blocks Yellow Pages demo step
- `skill` defaults to 'Other' at signup — Settings page enough, or needs dedicated edit flow?

## Key decisions — LOCKED

**DB table name:** `gov_anchors` (NOT gov_officials). Both seed scripts and migration now aligned. DB renamed via MCP migration.

**Gemini API:** staying with Gemini (not Claude) — GDGC = Google hackathon, judges are Google-affiliated, strategic advantage.

**Frontend design:** Tactical Resilience dark theme (bg #10141a, primary #b0c6ff, secondary #40e56c). Inline styles for design token colours — not Tailwind classes for colour values. Do not switch patterns.

**Components superseded:** TrustRing, ScoreBadge, ProfileCard, VouchQR — implemented inline in pages. Do not rebuild. TopBar, Sidebar, TierBadge, Icon live in `src/components/civic/`.

**Profile removed:** /profile/[username] redirects to /dashboard. Dashboard IS the profile.

**Auth:** node_id OR @username + password. Session in localStorage key `civictrust_session`. Min 6 char password, SHA256 hashed.

**Score formula:** `min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched ? 20 : 0)`

**Score thresholds:** 0-29 Unverified | 30-49 Partial | 50-89 Verified | 90-94 Trusted | 95+ Gov Official

**Dedup:** doc content hash is global — same document cannot be used across any account.

**Vouch:** vouchee score recalculates on vouch. Voucher penalty (-15) fires only on flagged claim.

**Git workflow:** dev = integration. Never commit to main. Ray merges dev -> main before demo.

**Team roles:**
- Ray: full-stack lead, Gemini Vision, seed scripts, heatmap (D3), realtime
- Aryan: Supabase setup + API (auth, claims, vouch, flag, score)
- Tao: /api/find, rate limiting middleware, seedGov
- Hemish: civic components done; now wiring dashboard claims + vouch confirm
- Maalav: all pages built; now wiring auth guards + real session data + add-evidence submit
