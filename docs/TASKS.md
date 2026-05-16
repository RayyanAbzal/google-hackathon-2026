# CivicTrust — Full Task List

> BLACKOUT · GDGC UOA 2026 · Read PLAN.md first for full context.
> Branch off `dev` for all work. Never commit directly to dev or main.

---

## RAY — Full-stack Lead

**Branch:** `ray/setup`
**Do these first — everyone else is blocked without the database.**

### Phase 1 — Database + Seed (do immediately)
- [ ] Create Supabase project, get URL + anon key, add to `.env.local` *(Aryan owns this — coordinate)*
- [ ] Run this SQL in Supabase SQL editor to create all tables:

```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT NOT NULL,
  skill TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'unverified',
  borough TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- claims
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  doc_type TEXT NOT NULL,
  extracted_name TEXT,
  extracted_institution TEXT,
  confidence FLOAT,
  content_hash TEXT,
  vouches INTEGER DEFAULT 0,
  flags INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vouches
CREATE TABLE vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vouchee_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voucher_id, vouchee_id)
);

-- gov_anchors
CREATE TABLE gov_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  organisation TEXT NOT NULL
);
```

- [ ] Enable Supabase Realtime on the `users` table (for live score updates)
- [ ] Set RLS policies — users can read all users, only write their own row
- [ ] Update `src/lib/supabase.ts` with working Supabase client using env vars
- [ ] Update `src/lib/gemini.ts` — implement `analyseDocument(imageBase64: string, docType: string)` that returns `{ extracted_name, doc_type, confidence, institution }`
- [ ] Write seed script at `scripts/seed.ts`:
  - 3 gov anchor accounts (NHS admin, Met Police, London Council) — score 100, tier 'gov_official'
  - Dr. James Osei — score 74, Doctor, Southwark, pre-vouched
  - 200 fake Londoners across all boroughs — mix of scores 30–90, skill tags, vouch chains
  - Pre-built vouch relationships so map looks populated
- [ ] Run seed script, verify data appears in Supabase dashboard
- [ ] Confirm `USE_FALLBACKS=true` in `.env.local` still works as a fallback

### Phase 2 — AI + Map
- [ ] London heatmap D3 component (`src/components/map/HeatMap.tsx`)
  - D3 choropleth using London GeoJSON by borough
  - Colour scale: dark = no verified users, bright blue = high density
  - Export as React component, Maalav embeds in map page
- [ ] Skill pins layer on map (`src/components/map/SkillPin.tsx`)
  - Coloured circle per skill: green = Doctor, blue = Engineer, purple = Legal, amber = Builder
  - Click pin → opens profile card (requires login)
- [ ] Live counter component: "X / 9,000,000 verified" — subscribes to Supabase realtime
- [ ] QR vouch flow glue — coordinate with Hemish (QR display) + Aryan (vouch API)

### Phase 3 — Demo prep
- [ ] Re-run seed script with final fake documents
- [ ] Test full demo path end-to-end (register → claim → vouch → verified → map)
- [ ] Test bad actor path (mismatched name doc → rejected)
- [ ] Verify `USE_FALLBACKS=true` works if Gemini API fails during demo
- [ ] Confirm heatmap shows populated London before Sarah registers

---

## ARYAN — Backend API (core) + Supabase

**Branch:** `aryan/api-core`
**Owns:** Supabase project setup, all core API routes.

### Supabase setup (do first — blocks everyone)
- [ ] Create Supabase project, get URL + anon key
- [ ] Share URL + anon key with Ray for `.env.local`
- [ ] Run the SQL schema (from Ray's task list above) in Supabase SQL editor
- [ ] Enable Realtime on `users` table
- [ ] Set RLS policies — read all users, write own row only

### All routes to build

#### Auth
- [ ] `POST /api/auth/register`
  - Input: `{ display_name, pin, skill, doc_image_base64, doc_type }` — doc_type must be 'passport' or 'driving_licence'
  - Calls Ray's `analyseDocument()` to read the mandatory doc
  - Checks extracted name matches display_name (name consistency)
  - Hashes PIN with bcrypt
  - Generates node_id: `BLK-${randomInt(10000,99999)}-LDN`
  - Creates user row: score 0, tier 'unverified'
  - Returns: `{ node_id, display_name, score: 0, tier: 'unverified' }`

- [ ] `POST /api/auth/login`
  - Input: `{ identifier, pin }` — identifier is node_id OR @username
  - Validates PIN hash match
  - Returns: `{ node_id, username, display_name, score, tier, skill }`
  - Store this in localStorage as `civictrust_session` on client

- [ ] `PATCH /api/auth/username`
  - Input: `{ node_id, username }` — requires auth
  - Validates username is unique and valid format (@handle)
  - Returns: `{ username }`
  - Note: only settable after first login — this is how users personalise their temp node ID

#### Claims
- [ ] `POST /api/claims`
  - Input: `{ user_id, type, doc_image_base64, doc_type }`
  - Calls `analyseDocument()` → gets extracted_name, confidence
  - Checks extracted_name matches user.display_name — if not, reject with error
  - Hashes doc content for dedup — if hash exists for this user, reject silently
  - Inserts claim row with status 'verified' if confidence > 0.7, else 'pending'
  - Recalculates score: `min(100, claims_verified * 15 + vouches * 10)`
  - Updates user.score and user.tier using `getTier()` from `src/types/index.ts`
  - Returns: `{ claim_id, score, tier }`

- [ ] `GET /api/claims/[userId]`
  - Returns all claims for a user with vouch counts
  - Requires auth

#### Vouching
- [ ] `POST /api/vouch`
  - Input: `{ voucher_id, vouchee_id }`
  - Checks voucher has score >= 50 (must be Verified to vouch)
  - Checks voucher hasn't already vouched this person
  - Checks voucher hasn't given 5+ vouches in last 24h (rate limit)
  - Inserts vouch row
  - Recalculates both users' scores
  - Returns: `{ voucher_score, vouchee_score }`

- [ ] `POST /api/vouch/flag`
  - Input: `{ claim_id, flagger_id }`
  - Marks claim as flagged
  - Finds all users who vouched the claim owner
  - Subtracts 15pts from each voucher's score
  - Updates tiers for affected users
  - Returns: `{ affected_vouchers: number }`

#### Users
- [ ] `GET /api/users/[username]`
  - Returns public profile: username, display_name, skill, score, tier, borough, claims
  - Requires auth (cannot view individual profiles without logging in)

#### Score
- [ ] `GET /api/score/[userId]`
  - Returns current score + tier
  - Used by realtime subscription to confirm score after updates

### Score + tier logic — use in all routes
```typescript
// In src/types/index.ts — shared by all routes
function getTier(score: number): TrustTier {
  if (score >= 95) return 'gov_official'
  if (score >= 90) return 'trusted'
  if (score >= 50) return 'verified'
  if (score >= 30) return 'partial'
  return 'unverified'
}

function calculateScore(claimsVerified: number, vouchesReceived: number): number {
  return Math.min(100, claimsVerified * 15 + vouchesReceived * 10)
}
```

### Rules for all routes
- Return `{ success: boolean, data: T | null, error: string | null }` always
- Use `calculateScore()` and `getTier()` from `src/types/index.ts`
- Never expose raw Supabase errors — catch and return `{ success: false, error: 'Something went wrong' }`
- All routes that write require auth header check

---

## TAO — Backend API (features)

**Branch:** `tao/api-features`
**Depends on:** Ray's DB schema, Aryan's auth routes working.

### All tasks

#### Rate limiting
- [ ] Middleware at `src/middleware.ts` — checks rate limits before any API route:
  - Max 5 vouches per user per 24h (check vouches table)
  - Max 3 claim submissions per user per 10 min (check claims table)
  - Return 429 with `{ success: false, error: 'Rate limit exceeded' }` if breached

#### Yellow Pages API
- [ ] `GET /api/find`
  - Query params: `skill` (optional), `resource` (optional), `borough` (optional)
  - Search by EITHER skill (Doctor, Engineer, Legal, Builder) OR resource (insulin, water, tools)
  - Returns grouped results: `[{ borough, skill, count, avg_score }]`
  - No auth required for counts
  - Example: `GET /api/find?skill=Doctor&borough=Southwark` → `[{ borough: 'Southwark', count: 3, avg_score: 67 }]`

#### Realtime
- [ ] Set up Supabase realtime subscription helper at `src/lib/realtime.ts`
  - Subscribe to `users` table changes for a given user_id
  - Emits score + tier updates to the client
  - Hemish's score ring will use this to animate score changes live

#### Gov hierarchy seeding helper
- [ ] Helper function `scripts/seedGov.ts` — creates L0 + L1 anchor accounts
  - Coordinate with Ray's main seed script
  - L0: 3 accounts, score 100, tier 'gov_official', organisation: 'Emergency Coalition'
  - L1: NHS admin (score 100), Met Police (score 100), London Council (score 100), GOV badge

---

## HEMISH — Frontend Components

**Branch:** `hemish/components`
**Depends on:** Ray's types file, Aryan's auth routes to test with real data.

### All components to build (in priority order)

#### 1. TrustRing — THE hero visual
- [ ] `src/components/trust/TrustRing.tsx`
  - SVG circle, stroke-dasharray to show score as arc
  - Framer Motion animation from old score to new score on change
  - Colours by tier: red = Unverified/Partial (<50), green = Verified (50–89), amber = Trusted (90–94), gold = Gov Official (95+)
  - Shows score number in centre
  - Props: `{ score: number, size?: number }`

#### 2. ScoreBadge
- [ ] `src/components/trust/ScoreBadge.tsx`
  - Shows tier as a pill badge
  - Unverified = red, Partial = orange, Verified = green, Trusted = amber, Gov Official = gold with GOV label
  - Props: `{ tier: TrustTier }`

#### 3. ProfileCard
- [ ] `src/components/trust/ProfileCard.tsx`
  - Username, display_name, TrustRing, ScoreBadge, skill tag
  - Claim count + vouch count
  - "Add claim" button + "Vouch / QR" button
  - Props: `{ user: User, claims: Claim[] }`

#### 4. ClaimCard
- [ ] `src/components/claims/ClaimCard.tsx`
  - Claim type icon (Identity/Credential/Work)
  - Status badge (pending/verified/rejected)
  - Vouch count + flag button
  - Props: `{ claim: Claim, onFlag?: () => void }`

#### 5. ClaimForm
- [ ] `src/components/claims/ClaimForm.tsx`
  - Claim type selector (Identity / Credential / Work)
  - File input for document photo
  - Converts image to base64, calls `POST /api/claims`
  - Shows loading state while Gemini processes
  - Shows success (score rose) or error (name mismatch)
  - Props: `{ userId: string, onSuccess: (newScore: number) => void }`

#### 6. VouchQR
- [ ] `src/components/trust/VouchQR.tsx`
  - Two modes: display (shows QR of your node_id) + scan (uses camera to scan)
  - Uses `qrcode.js` to generate QR
  - Uses `html5-qrcode` to scan
  - On successful scan: calls `POST /api/vouch`
  - Props: `{ nodeId: string, onVouchComplete: (newScore: number) => void }`

### Visual rules (Hemish owns this)
- Dark theme throughout — background #0a0a0f, cards #111118
- shadcn/ui components only — no primitives
- Tailwind v4 only — no inline styles
- Score ring is the most important visual — make it beautiful
- All components under 200 lines
- This is 20pts of the rubric — polish matters

---

## MAALAV — Pages + Routing

**Branch:** `maalav/pages`
**Depends on:** Hemish's components, Aryan's auth routes, Tao's find route.

### All pages to build (in priority order)

#### 1. Register page (do first — nothing works without auth)
- [ ] `src/app/(auth)/register/page.tsx`
  - Step 1: Enter display_name + skill selector dropdown
  - Step 2: Set 4-digit PIN
  - Step 3: Upload mandatory doc (passport OR driving licence) — file input, required
  - Calls `POST /api/auth/register`
  - On success: stores session to localStorage, redirects to `/profile/[node_id]`
  - Show loading while Gemini reads document
  - Note: @username is set after first login, not at registration

#### 2. Login page
- [ ] `src/app/(auth)/login/page.tsx`
  - Input: node ID (BLK-XXXXX-LDN) OR @username
  - Input: 4-digit PIN
  - Calls `POST /api/auth/login`
  - On success: stores session, redirects to `/profile/[username]`
  - If no username set yet: prompts to set @username via `PATCH /api/auth/username`

#### 3. Profile page
- [ ] `src/app/profile/[username]/page.tsx`
  - Requires auth — redirect to `/login` if no session
  - Fetches `GET /api/users/[username]` and `GET /api/claims/[userId]`
  - Renders ProfileCard + list of ClaimCards + ClaimForm + VouchQR
  - Subscribes to realtime score updates (Tao's realtime helper)
  - Score ring animates when score changes

#### 4. Map page
- [ ] `src/app/map/page.tsx`
  - Requires auth
  - Embeds Ray's HeatMap component
  - Skill pins layer
  - Live counter "X / 9,000,000 verified"
  - Click pin → sidebar showing area skill breakdown (profile link requires auth, already handled)

#### 5. Find page — Yellow Pages
- [ ] `src/app/find/page.tsx`
  - Search is public (no login required)
  - Search input: "Search skill or resource..."
  - Filter pills: Doctor, Engineer, Legal, Builder, Insulin, Water, Tools...
  - Results: grouped by borough — "Southwark: 3 verified doctors"
  - Map view (simplified heatmap with pins)
  - Clicking a result → "Login to view profiles" if not logged in
  - "Are you a verified [skill]? Register here →" CTA at bottom

#### 6. Landing page (do last)
- [ ] `src/app/page.tsx`
  - Hero: "After the flare wiped every record — rebuild your identity"
  - CTA: "Get verified" → /register
  - Secondary: "Find help near you" → /find
  - Brief explanation of what the app does
  - Clean, dark, minimal

### Session handling (use on every protected page)
```typescript
// At top of any protected page component:
const sessionStr = localStorage.getItem('civictrust_session')
if (!sessionStr) redirect('/login')
const session = JSON.parse(sessionStr)
// session = { node_id, username, display_name, score, tier, skill }
```

### Navigation
- [ ] Shared navbar component with: Logo | Map | Find | Profile
- [ ] Active state on current page
- [ ] "Login / Register" shown if no session, "Profile" shown if logged in

---

## SHARED — all team

### Types — define in `src/types/index.ts` before anything else

```typescript
export type TrustTier = 'unverified' | 'partial' | 'verified' | 'trusted' | 'gov_official'

export interface User {
  id: string
  node_id: string
  username: string | null
  display_name: string
  skill: string
  score: number
  tier: TrustTier
  borough: string | null
  created_at: string
}

export interface Claim {
  id: string
  user_id: string
  type: 'identity' | 'credential' | 'work'
  status: 'pending' | 'verified' | 'rejected'
  doc_type: string
  extracted_name: string | null
  extracted_institution: string | null
  confidence: number | null
  vouches: number
  flags: number
  created_at: string
}

export interface Vouch {
  id: string
  voucher_id: string
  vouchee_id: string
  created_at: string
}

export function getTier(score: number): TrustTier {
  if (score >= 95) return 'gov_official'
  if (score >= 90) return 'trusted'
  if (score >= 50) return 'verified'
  if (score >= 30) return 'partial'
  return 'unverified'
}

export function calculateScore(claimsVerified: number, vouchesReceived: number): number {
  return Math.min(100, claimsVerified * 15 + vouchesReceived * 10)
}
```

### Before starting
- [ ] Pull dev after Ray merges the scaffold PR
- [ ] Read `docs/PLAN.md` for full context
- [ ] Import ALL types from `src/types/index.ts` — never define types elsewhere
- [ ] Use `src/lib/supabase.ts` for DB — never create new clients

### Git workflow
```
git checkout dev && git pull
git checkout -b yourname/feature-name
# work...
git add specific-files
git commit -m "feat: description"
git checkout dev && git pull && git merge yourname/feature-name && git push
```

### If an API breaks during demo
Set `USE_FALLBACKS=true` in `.env.local` — activates mock data from `src/lib/fallbacks.ts`.

---

## DEMO CHECKLIST — Ray runs through this before presenting

- [ ] Seed script run — 200 users + gov anchors + Dr. Osei visible on map
- [ ] Register as Sarah Mitchell + Doctor tag + passport upload → node ID issued, tier: Unverified
- [ ] First login → set username to @sarah_mitchell
- [ ] Submit medical degree → Gemini reads "UCL Medicine" → score 15, tier: Unverified
- [ ] Submit NHS employer letter → score 30, tier: Partial
- [ ] Bad actor test: upload doc with wrong name → rejected ("name doesn't match")
- [ ] Dr. Osei (pre-seeded, score 74) QR-vouches Sarah → score 40, still Partial
- [ ] A second vouch → score 50 → tier: **Verified** → Doctor pin appears on London map in Southwark
- [ ] Map: 200+ pins visible, counter shows "1,847 / 9,000,000"
- [ ] Yellow Pages (/find): search "Doctor" → shows "Southwark: 3 verified doctors"
- [ ] Yellow Pages: search "insulin" (resource) → returns relevant results
- [ ] `USE_FALLBACKS=true` tested — app still works if Gemini is down
- [ ] Full demo rehearsed at least twice before presenting

---

## MARKING SCHEMA — keep in mind throughout

| Category | Points | What judges look for |
|---|---|---|
| Technical | 35 | Working prototype, good architecture, technologically impressive |
| Idea | 30 | Innovative, relevant to problem, complete |
| Design | 20 | Look and feel, usability, wow factors |
| Presentation | 15 | Prepared, clear problem/solution, engaging |

**Technical is the biggest category. A working demo beats a beautiful broken one every time.**
