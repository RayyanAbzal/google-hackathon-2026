# Pages + Routing — Maalav

## Owner: Maalav
All page files live here. Import components from `src/components/`. Do not build UI primitives here.

## Pages to build

| Route | File | Owner | Notes |
|---|---|---|---|
| `/` | `page.tsx` | Maalav | Landing — hero text + register CTA + login link |
| `/register` | `(auth)/register/page.tsx` | Maalav | Registration form. Mandatory doc upload. |
| `/login` | `(auth)/login/page.tsx` | Maalav | Node ID + PIN form. |
| `/profile/[username]` | `profile/[username]/page.tsx` | Maalav | User profile. Shows score ring, claims, vouch QR. Requires login. |
| `/map` | `map/page.tsx` | Maalav | D3 heatmap + skill pins + live counter. Ray provides the D3 component. |
| `/find` | `find/page.tsx` | Maalav | Yellow Pages — public. Skill + resource search, area filter, map + list. |
| `/help` | `help/page.tsx` | Maalav | Post for help + list of active posts in area. |

## Rules
- Use `src/components/` for all UI elements — do not write raw HTML forms
- Tailwind v4 only — no inline styles
- Pages fetch data via API routes — do not call Supabase directly from pages
- All pages except `/`, `/find` require auth — redirect to `/login` if no session
- Mobile-responsive but optimise for laptop (demo is on a laptop)

## Priority order
1. `/register` + `/login` — team cannot test anything without auth
2. `/profile/[username]` — needed to demo the score ring
3. `/map` — demo wow moment
4. `/find` — Yellow Pages, public
5. `/help` — post for help
6. `/` — landing page (last, after everything works)

## Session handling
Check for session in `localStorage` (key: `civictrust_session`).
If no session on a protected page, redirect to `/login`.
Session object: `{ node_id: string, username: string, score: number }`

## Demo path pages used
Register → Profile → Map → Find (in that order in the demo)
