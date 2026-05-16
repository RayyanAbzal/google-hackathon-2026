# WORKLOG

**Updated:** 2026-05-16 (session 12)

## Active task
DB + seed fully operational — gov_anchors renamed to gov_officials, seed run, 207 users live

## Phase
implementing

## Files changed this session
- `scripts/seed.ts` — `gov_anchors` -> `gov_officials`, added realtime websocket bypass for Node 21
- `scripts/seedGov.ts` — same two fixes
- `src/lib/score.ts` — `gov_anchors` -> `gov_officials` in DB query
- `src/types/index.ts` — removed stale comment "DB table is gov_anchors"
- `supabase/migrations/0001_init.sql` — all `gov_anchors` refs -> `gov_officials`
- `src/lib/CLAUDE.md` — table name updated

**Supabase (via MCP):**
- Confirmed project `GDGC Hackathon 2026` (syffciafllpqgxcvdaih) ACTIVE_HEALTHY
- Confirmed all 4 tables: users, claims, vouches, gov_officials (RLS enabled)
- Confirmed RLS: SELECT-only policies on all tables, writes via service role (correct)
- Applied migration: `ALTER TABLE gov_anchors RENAME TO gov_officials`
- Seed run: 207 users, 663 verified claims, 0 vouches, 6 gov_officials rows

## Next step
Continue with uncommitted map work — `HeatMap.tsx` + `SkillPin.tsx` need live borough data wired in. Verify map renders with seeded boroughs.

## Open questions
- Aryan: Enable Realtime on `users` table (Supabase dashboard > Database > Replication > Tables > users > toggle on)
- Aryan: does /api/auth/register call Gemini at signup, or deferred to claims only?
- Tao: /api/find ETA? Blocks Yellow Pages demo step
- `skill` defaults to 'Other' at signup — profile edit page needed?

## Key decisions — LOCKED

**DB table name:** `gov_officials` (renamed from gov_anchors). All code, seeds, migration now aligned.

**Gemini API:** staying with Gemini (not Claude) — GDGC = Google hackathon, strategic advantage.

**Frontend design:** Tactical Resilience dark theme (bg #10141a, primary #b0c6ff, secondary #40e56c). Inline styles for design token colours — not Tailwind classes for colour values. Do not switch patterns.

**Components superseded:** TrustRing, ScoreBadge, ProfileCard, VouchQR — implemented inline in pages. Do not rebuild. TopBar, Sidebar, TierBadge, Icon live in `src/components/civic/`.

**Profile removed:** /profile/[username] redirects to /dashboard. Dashboard IS the profile.

**Auth:** node_id OR @username + password. Session in localStorage key `civictrust_session`. Min 6 char password, SHA256 hashed.

**Score formula:** `min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched ? 20 : 0)`

**Score thresholds:** 0-24 Unverified | 25-59 Verified | 60-89 Trusted | 90-100 Gov Official

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
