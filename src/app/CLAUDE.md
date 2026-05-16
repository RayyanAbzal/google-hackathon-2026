# Pages + Routing — Maalav

## Owner: Maalav
All page files live here. Import components from `src/components/`. Do not build UI primitives here.

## Pages to build

| Route | File | Notes |
|---|---|---|
| `/` | `page.tsx` | Landing — hero text + register CTA + login link |
| `/register` | `(auth)/register/page.tsx` | Registration form. Name + password + mandatory doc upload (passport or driving licence, min 1). No skill selection. |
| `/login` | `(auth)/login/page.tsx` | Node ID (or @username) + password form. |
| `/profile/[username]` | `profile/[username]/page.tsx` | User profile. Score ring, claims, vouch QR. Requires login. |
| `/map` | `map/page.tsx` | D3 heatmap + skill pins + live counter. Ray provides the D3 component. |
| `/find` | `find/page.tsx` | Yellow Pages — public. Skill OR resource search, area filter, map + list. |

## Rules
- Use `src/components/` for all UI elements — do not write raw HTML forms
- Tailwind v4 only — no inline styles
- Pages fetch data via API routes — do not call Supabase directly from pages
- All pages except `/` and `/find` (search view) require auth — redirect to `/login` if no session
- Viewing individual profiles on `/find` also requires auth
- Mobile-responsive but optimise for laptop (demo is on a laptop)

## Priority order
1. `/register` + `/login` — team cannot test anything without auth
2. `/profile/[username]` — needed to demo the score ring
3. `/map` — demo wow moment
4. `/find` — Yellow Pages, public search
5. `/` — landing page (last, after everything works)

## Session handling
Check for session in `localStorage` (key: `civictrust_session`).
If no session on a protected page, redirect to `/login`.
Session object: `{ node_id: string, username: string | null, score: number, tier: string, skill: string | null }`

## Demo path pages used
Register → Profile → Map → Find (in that order in the demo)
