# Pages + Routing — Maalav

## Owner: Maalav
All page files live here. Import components from `src/components/`. Do not build UI primitives here.

## CURRENT STATE — all pages shipped (Ray, 2026-05-16)

All 10 routes are fully implemented with the Tactical Resilience design system. Maalav's job is now to wire up real data and add auth guards, not build pages from scratch.

| Route | Status | Notes |
|---|---|---|
| `/` | Done | Landing — hero, how-it-works, tiers, fraud resistance, CTA |
| `/login` | Done | Node ID + password, calls `/api/auth/login`, stores session |
| `/register` | Done | Name + password + doc upload, calls `/api/auth/register` |
| `/unverified` | Done | Post-registration splash, links to add-evidence + vouch |
| `/dashboard` | Done | Score ring, metrics, evidence grid, activity feed |
| `/add-evidence` | Done | 4-step wizard (starts at step 3 for demo) |
| `/vouch` | Done | QR display, scan/lookup, confirm vouch flow |
| `/find` | Done | Search + filters + 4 results + mini map |
| `/map` | Done | Wraps HeatMap, stat panel, legend |
| `/settings` | Done | Profile/Security/Notifications/Privacy tabs |
| `/profile/[username]` | Redirect | Redirects to `/dashboard` — My Trust Profile removed |

## What Maalav/Hemish should focus on now

1. **Auth guards** — add session check + redirect to `/login` on protected pages (dashboard, add-evidence, vouch, settings, map). Check `localStorage` key `civictrust_session`.
2. **Real data** — replace hardcoded "Sarah Mitchell / BLK-0471-LDN / score 55" with session data read from localStorage.
3. **API wiring** — dashboard should fetch actual claims/vouches; add-evidence should POST to `/api/claims`.
4. **Map** — wire up live skill pins and heatmap data.

## Design system note

Pages use inline styles for design-token colours (not Tailwind) because the Tactical Resilience tokens (#10141a, #b0c6ff etc) are defined as CSS custom properties and plain CSS utilities in `globals.css`. When adding new UI to existing pages, match the pattern used in that page — inline styles for colours and layout where needed.

## Shared civic components (already built)

Located at `src/components/civic/`:
- `TopBar` — fixed top nav, notifications popup, avatar menu
- `Sidebar` — fixed left nav, identity card, active state
- `TierBadge` — tier-0 through gov_official badges
- `Icon` — Material Symbols Outlined wrapper

## Session handling
Check for session in `localStorage` (key: `civictrust_session`).
If no session on a protected page, redirect to `/login`.
Session type: `Session` from `src/types/index.ts`.

## Demo path
Register → Unverified → Add Evidence → Dashboard → Vouch → Find → Map
