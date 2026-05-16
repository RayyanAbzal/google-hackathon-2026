# WORKLOG

**Updated:** 2026-05-16 (session 4)

## Active task
Idle — PIN→password + skill removal fully applied and pushed

## Phase
Implementing (teammates actively pushing to dev)

## Files changed this session
- `supabase/migrations/0001_init.sql` — `pin_hash` → `password_hash`, `skill TEXT NOT NULL` → `skill TEXT DEFAULT 'Other'`
- `scripts/seed.ts` — `DEFAULT_PIN` → `DEFAULT_PASSWORD ('password1234')`, `pin_hash` → `password_hash` throughout
- `src/lib/auth.ts` — `hashPin` renamed to `hashPassword`
- `src/app/api/auth/register/route.ts` — password field, no skill, doc_type restricted to 'passport'/'driving_licence', `password_hash` in insert
- `src/app/api/auth/login/route.ts` — password field, `password_hash` in DB query, removed 4-digit regex check
- `src/types/index.ts` — `MandatoryDocType` added, `User.skill` typed as `SkillTag | null`, `pin_hash` removed from interface
- `src/lib/CLAUDE.md` — `pin_hash` → `password_hash`, skill noted nullable
- `CLAUDE.md` — key decisions: "4-digit PIN" → "password"
- `src/app/CLAUDE.md` — register/login descriptions, session skill typed as `string | null`
- `src/app/api/CLAUDE.md` — register/login route descriptions
- `docs/PLAN.md` — Flow 1, Flow 5, Screen 1, demo step 2 updated
- `docs/TASKS.md` — SQL schema snippet, route inputs, page steps updated
- `docs/registration.puml` — password not PIN, skill step removed, doc options passport/driving_licence only; Aryan further updated with full validation flow + hashPassword/generateNodeId detail
- `docs/login.puml` — password field, hashPassword, password_hash in diagram

## Next step
Pull latest dev before any further changes — teammates (Aryan, Tao) are actively pushing

## Open questions
- Aryan: registration route accepts `doc_image_base64` but does not call Gemini — is Gemini validation at signup still planned or moved entirely to claims?
- Tao: `/api/find` still returns 501 — ETA?
- `skill` defaults to `'Other'` at signup — where does it get set to a real value? Profile edit page? Not yet built.

## Key decisions — LOCKED

**Auth (updated this session):**
- Password replaces 4-digit PIN — min 6 chars, hashed with SHA256 via `hashPassword()`
- Skill selection removed from registration — `skill` defaults to `'Other'` in DB, `SkillTag | null` in TypeScript
- Mandatory doc at signup: passport OR driving_licence ONLY
- `MandatoryDocType = 'passport' | 'driving_licence'` in `src/types/index.ts`
- `pin_hash` column renamed to `password_hash` in DB + all code

**Cut:**
- Post for help (/help) — removed from docs and codebase entirely
- Skill selector at registration — removed; skill set via profile later
- National ID card as signup doc — removed (passport/driving_licence only)

**Score formula:**
`score = min(100, claims_verified * 15 + vouches_received * 10 + gov_vouched ? 20 : 0)`

**Score thresholds:**
- 0–29: Unverified — 30–49: Partial — 50–89: Verified — 90–94: Trusted — 95+: Gov Official

**Profile view gate:**
- Not logged in → "Login to view profiles"
- Logged in + score < 50 → 403, redirect to own profile with claim-submit prompt
- Logged in + score >= 50 → view allowed

**Dedup:** doc hash check is global — same document cannot be used across any account.

**Vouch:** only vouchee score recalculates on vouch. Voucher penalty (-15) fires only when a flagged claim is processed.

**Git workflow:** dev is integration branch. Always `git pull --rebase` before pushing. Ray merges dev → main before demo.

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
