# Pages + Routing - Maalav

## Owner: Maalav
All page files live here. Import components from `src/components/`. Do not build UI primitives here.

## Current State - all pages shipped

All routes are implemented with the Tactical Resilience design system. Maalav's page/routing work is wired for the demo path.

| Route | Status | Notes |
|---|---|---|
| `/` | Done | Landing, how-it-works, tiers, fraud resistance, CTA |
| `/login` | Done | Username + password, calls `/api/auth/login`, stores session, prompts for first username |
| `/register` | Done | Name + password + doc upload, calls `/api/auth/register` |
| `/unverified` | Done | Post-registration splash, links to add-evidence + vouch |
| `/dashboard` | Done | Score ring, metrics, evidence grid, notifications in TopBar |
| `/add-evidence` | Done | 4-step wizard, protected, submits claims |
| `/vouch` | Done | QR display, User ID lookup, request carousel, confirm vouch flow |
| `/find` | Done | Public search + filters + expandable result details |
| `/find-help` | Done | Alias route for `/find` |
| `/map` | Removed | Merged into `/find` — full-width map hero + listings on one page |
| `/settings` | Done | Profile/Security/Notifications/Privacy tabs |
| `/profile/[username]` | Done | Protected profile view with score + claims |

## Completed Maalav/Hemish Focus Areas

1. **Auth guards** - protected pages check `localStorage` key `civictrust_session` and redirect to `/login`.
2. **Real data** - shared chrome and key pages read session data from localStorage.
3. **API wiring** - dashboard fetches claims; add-evidence posts to `/api/claims`; vouch posts to `/api/vouch`.
4. **Map** - heatmap and skill pins are wired for the demo path.

## Design System Note

Pages use inline styles for design-token colours because the Tactical Resilience tokens (`#10141a`, `#b0c6ff`, etc.) are defined as CSS custom properties and plain CSS utilities in `globals.css`. When adding UI to existing pages, match the pattern used in that page.

## Shared Civic Components

Located at `src/components/civic/`:
- `TopBar` - fixed top nav, notifications popup, avatar menu
- `Sidebar` - fixed left nav, identity card, active state
- `TierBadge` - tier-0 through gov_official badges
- `Icon` - Material Symbols Outlined wrapper

## Session Handling

Check for session in `localStorage` (key: `civictrust_session`).
If no session on a protected page, redirect to `/login`.
Session type: `Session` from `src/types/index.ts`.

## Demo Path

Register -> Unverified -> Add Evidence -> Dashboard -> Vouch -> Find Help -> Map -> Profile
