# CivicTrust — Task Assignments

> BLACKOUT · GDGC UOA 2026 · Read `docs/PLAN.md` first for full context.

---

## Ray — Full-stack Lead

**Branch:** `ray/setup`  
**Do these first — team is blocked without them**

### Phase 1 (do immediately)
- [ ] Set up Supabase project, get URL + anon key, add to `.env.local`
- [ ] Create all database tables (see schema below)
- [ ] Set up RLS policies on all tables
- [ ] Update `src/lib/supabase.ts` with working client
- [ ] Update `src/lib/gemini.ts` — implement `analyseDocument(imageBase64, docType)` function
- [ ] Write and run seed script (`scripts/seed.ts`) — 200 fake users + 3 gov anchors + Dr. Osei

### Phase 2
- [ ] London heatmap D3 component (`src/components/map/HeatMap.tsx`)
- [ ] Skill pins on map (`src/components/map/SkillPin.tsx`)
- [ ] Live counter component
- [ ] QR vouch flow glue (coordinate with Hemish + Aryan)

### Phase 3 (polish)
- [ ] Run seed script again with final fake docs
- [ ] Test full demo path end-to-end
- [ ] Test fallbacks (`USE_FALLBACKS=true`)

### Database schema to create
```sql
-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT UNIQUE NOT NULL,     -- BLK-XXXXX-LDN
  username TEXT UNIQUE,              -- @handle, set after first login
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
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL,               -- identity | credential | work
  status TEXT DEFAULT 'pending',    -- pending | verified | rejected
  doc_type TEXT NOT NULL,
  extracted_name TEXT,
  extracted_institution TEXT,
  confidence FLOAT,
  content_hash TEXT,                -- for dedup
  vouches INTEGER DEFAULT 0,
  flags INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- vouches
CREATE TABLE vouches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voucher_id UUID REFERENCES users(id),
  vouchee_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(voucher_id, vouchee_id)
);

-- help_posts
CREATE TABLE help_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  skill_tag TEXT,
  resource_tag TEXT,
  borough TEXT NOT NULL,
  urgency TEXT DEFAULT 'medium',
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- gov_anchors
CREATE TABLE gov_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  level INTEGER NOT NULL,           -- 0 = coalition, 1 = institutional
  organisation TEXT NOT NULL
);
```

---

## Aryan — Backend API

**Branch:** `aryan/api-core`  
**Depends on:** Ray's DB schema being live

### Tasks
- [ ] `POST /api/auth/register` — create user, validate name, issue node ID, store PIN hash
- [ ] `POST /api/auth/login` — validate node ID + PIN, return session
- [ ] `PATCH /api/auth/username` — set @username (must be unique)
- [ ] `POST /api/claims` — accept claim + image, call Ray's `analyseDocument()`, check name consistency, store claim, update score
- [ ] `GET /api/claims/[userId]` — return user's claims list
- [ ] `POST /api/vouch` — mutual vouch. Both users must confirm. Update both scores. Check 5-vouch/24h limit.
- [ ] `POST /api/vouch/flag` — flag a claim. Trigger penalty cascade (-15pts to all who vouched the user).
- [ ] `GET /api/score/[userId]` — return score + tier
- [ ] `GET /api/users/[username]` — return public profile data (requires auth)

### Rules
- All routes return `ApiResponse<T>` from `src/types/index.ts`
- Use `calculateScore()` from `src/types/index.ts` — do not hardcode score logic
- Validate all input at route level
- Never expose raw DB errors to client

---

## Tao — Backend API (shared)

**Branch:** `tao/api-features`  
**Depends on:** Ray's DB schema, Aryan's auth routes

### Tasks
- [ ] Rate limiting middleware — max 5 vouches/24h per user, 3 claim submissions/10 min
- [ ] `GET /api/find` — Yellow Pages search. Params: `skill`, `resource`, `borough`. Returns grouped counts by area. Public (no auth required for counts, auth required for profiles).
- [ ] `POST /api/help` — create help post. Requires auth (any score). Auto-expire at 24h.
- [ ] `GET /api/help` — list help posts by `borough`. Requires auth.
- [ ] Supabase realtime subscription setup — score updates push to client without refresh
- [ ] Gov hierarchy seeding helper (coordinate with Ray's seed script)

---

## Hemish — Frontend Components

**Branch:** `hemish/components`  
**Depends on:** Ray's DB (to test with real data), Aryan's auth (to test login flow)

### Tasks (in priority order)
- [ ] `src/components/trust/TrustRing.tsx` — animated SVG score ring. Props: `score: number`. Animates old → new on change. Green ≥50, amber 30–49, red <30.
- [ ] `src/components/trust/ProfileCard.tsx` — username, score ring, tier badge, skill tag, claim count
- [ ] `src/components/trust/ScoreBadge.tsx` — Verified / Unverified / Trusted / Gov badge
- [ ] `src/components/claims/ClaimCard.tsx` — single claim. Shows type, status, vouch count, flag button.
- [ ] `src/components/claims/ClaimForm.tsx` — doc type selector + file upload. Calls `/api/claims` on submit.
- [ ] `src/components/trust/VouchQR.tsx` — shows QR for node ID. Scan mode for vouching.
- [ ] `src/components/trust/HelpPostCard.tsx` — help request card with respond button
- [ ] Overall visual polish — dark theme, clean spacing, consistent typography

### Rules
- shadcn/ui only — no primitives from scratch
- Tailwind v4 only — no inline styles
- Components accept data as props — no API calls inside components
- Score ring is the hero visual. Make it beautiful. Framer Motion for animation.

---

## Maalav — Pages + Routing

**Branch:** `maalav/pages`  
**Depends on:** Hemish's components, Aryan's auth routes, Tao's find/help routes

### Tasks (in priority order)
- [ ] `src/app/(auth)/register/page.tsx` — registration flow. Name + PIN + skill + mandatory doc upload.
- [ ] `src/app/(auth)/login/page.tsx` — login with node ID + PIN. Store session to localStorage.
- [ ] `src/app/profile/[username]/page.tsx` — profile page. Requires auth. Shows ProfileCard + claims + QR.
- [ ] `src/app/map/page.tsx` — map page. Embeds Ray's HeatMap component + live counter.
- [ ] `src/app/find/page.tsx` — Yellow Pages. Public. Search input + skill/resource filter pills + map + result list.
- [ ] `src/app/help/page.tsx` — post for help page. Form + list of active posts.
- [ ] `src/app/page.tsx` — landing page (do last). Hero text + register CTA.

### Session handling
```typescript
// Check session on every protected page
const session = localStorage.getItem('civictrust_session')
if (!session) redirect('/login')
const { node_id, username, score } = JSON.parse(session)
```

### Page priority for demo
Register → Login → Profile → Map → Find  
These 4 must work end-to-end before anything else.

---

## Shared — all team

- [ ] Read `docs/PLAN.md` before starting
- [ ] Import all types from `src/types/index.ts` — do not define types elsewhere
- [ ] Use `src/lib/supabase.ts` — do not create new Supabase clients
- [ ] Branch off `dev`, not `main`
- [ ] Commit often with clear messages: `feat: add score ring component`
- [ ] Announce in group chat before touching `src/types/` or `src/lib/`
- [ ] If any external API fails during demo: set `USE_FALLBACKS=true` in `.env.local`

---

## Demo checklist (Ray + everyone)

Run through this before presenting:

- [ ] Seed script run — 200 users + gov anchors + Dr. Osei on map
- [ ] Register as Sarah → node ID issued → username set
- [ ] Submit degree → Gemini reads it → score rises
- [ ] Submit passport → name matches → score rises
- [ ] Submit employer letter → score reaches ~30–45
- [ ] Dr. Osei vouches Sarah → score hits 50+ → Verified badge + map pin appears
- [ ] Bad actor test: submit doc with wrong name → rejected
- [ ] Yellow Pages: search "Doctor" + "Southwark" → shows 3 results
- [ ] Map: 200 pins visible, live counter shows 1,847
- [ ] Post for help: Sarah posts "need medication" → visible on /help
- [ ] USE_FALLBACKS=true tested and working
