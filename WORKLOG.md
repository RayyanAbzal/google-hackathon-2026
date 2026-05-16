# WORKLOG

**Updated:** 2026-05-16 (session 6)

## Active task
Idle — full frontend design system shipped and pushed to dev

## Phase
Frontend complete (visual). Data wiring + auth guards = next priority for Maalav + Hemish.

## Files changed this session

**Design system:**
- `src/app/globals.css` — replaced shadcn colour tokens with Tactical Resilience design tokens; added utility classes (.bento, .btn-primary/ghost/solid-primary, .field-input, .tier-0..3, .chip, .city-grid, .dot-*)
- `src/app/layout.tsx` — Inter font, Material Symbols Outlined via Google Fonts, html.dark class

**New civic components (`src/components/civic/`):**
- `TopBar.tsx` — fixed nav bar, blackout timer pill, notifications popup, avatar menu with sign out
- `Sidebar.tsx` — fixed left nav, identity card, tier progress bar, active state highlighting
- `TierBadge.tsx` — all 5 tiers (unverified → gov_official)
- `Icon.tsx` — Material Symbols Outlined wrapper

**Pages (all 10 routes):**
- `src/app/page.tsx` — landing: hero, how-it-works, trust tiers, fraud resistance, CTA
- `src/app/(auth)/login/page.tsx` — Node ID + password, calls /api/auth/login, stores session
- `src/app/(auth)/register/page.tsx` — name + password + doc upload, calls /api/auth/register
- `src/app/(auth)/unverified/page.tsx` — NEW: post-register splash, progress bar, next steps
- `src/app/dashboard/page.tsx` — NEW: score ring SVG, 3 metric cards, evidence grid, activity feed
- `src/app/add-evidence/page.tsx` — NEW: 4-step wizard (choose type, upload, review extracted, submit)
- `src/app/vouch/page.tsx` — NEW: QR display, scanner/lookup, person preview, vouch type selector
- `src/app/find/page.tsx` — search + chip filters + 4 result cards + mini map
- `src/app/map/page.tsx` — wraps HeatMap, Southwark stat panel, legend
- `src/app/settings/page.tsx` — NEW: 4 tabs (Profile active), form fields, devices, save footer
- `src/app/profile/[username]/page.tsx` — now redirects to /dashboard

**Docs updated:**
- `src/app/CLAUDE.md` — current state of all routes, what Maalav should focus on next
- `src/components/CLAUDE.md` — superseded components listed, civic/ components documented
- `docs/ROADMAP.md` — components section updated, critical path updated
- `docs/TASKS.md` — Hemish + Maalav tasks rewritten to reflect data-wiring focus

## Next step
Maalav: auth guards + session data wiring (see docs/TASKS.md)
Hemish: wire dashboard claims + vouch confirm button
Tao: /api/find is still NOT STARTED — blocking Find page real data

## Open questions
- Aryan: registration route accepts `doc_image_base64` but does not call Gemini — Gemini at signup still planned or moved to claims only?
- Tao: `/api/find` still 501 — ETA?
- `skill` defaults to `'Other'` at signup — where does it get set? Profile edit page not yet built.
- Root `PLAN.md` + `ROLES.md` — delete or move to docs/?

## Key decisions — LOCKED

**Auth:**
- Password replaces 4-digit PIN — min 6 chars, hashed with SHA256 via `hashPassword()`
- Skill defaults to `'Other'` at signup, set via profile later
- Mandatory doc at signup: passport OR driving_licence ONLY
- `MandatoryDocType = 'passport' | 'driving_licence'` in `src/types/index.ts`
- `password_hash` column (was `pin_hash`)

**Cut:**
- Post for help (/help), skill selector at registration, National ID card at signup

**Score formula:**
`score = min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched ? 20 : 0)`

**Score thresholds:**
0-29: Unverified | 30-49: Partial | 50-89: Verified | 90-94: Trusted | 95+: Gov Official

**Profile view gate:**
- Not logged in → "Login to view profiles"
- Logged in + score < 50 → 403, redirect to own profile with claim-submit prompt
- Logged in + score >= 50 → view allowed

**Dedup:** doc hash check is global — same document cannot be used across any account.

**Vouch:** only vouchee score recalculates on vouch. Voucher penalty (-15) fires only on flagged claim processing.

**Git workflow:** dev = integration. Always `git pull --rebase` before pushing. Ray merges dev → main before demo.

**Team roles:**
- Ray: full-stack lead, Gemini Vision, seed script, heatmap (D3), QR vouch glue
- Aryan: Supabase setup + API (auth, claims, vouch, flag, score)
- Tao: API (rate limiting, realtime, Yellow Pages /find)
- Hemish: UI components (score ring, profile card, forms, QR, polish)
- Maalav: pages + routing (/register, /login, /profile, /map, /find, /)

**Build phases:**
1. (~3h) Seed script + DB schema + register + login
2. (~4h) Claims + Gemini Vision + score + profile UI
3. (~3h) QR vouch flow + vouch/flag + penalty logic
4. (~4h) Heatmap + map pins + Yellow Pages + polish + demo
