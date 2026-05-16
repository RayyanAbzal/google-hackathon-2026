# WORKLOG

**Updated:** 2026-05-17 — map popup white box fix + zoom-out-on-close

## Active task
Fixed Leaflet popup white background and wired Close button to fly back to London overview

## Phase
reviewing

## Files changed this session
- `src/app/api/find/interpret-search/route.ts` — new POST route, Claude Haiku NL query → `{ skill, borough }`
- `src/components/map/HeatMap.tsx` — added `MapFlyController`, `PopupListing` export, `focusedBorough`/`popupListing`/`onPopupClose` props, borough dimming, dark Leaflet popup at borough centroid, updated GeoJSON key; removed "View Profile →" link from popup; added `MapResetController` + `resetView` state for zoom-out-on-close
- `src/app/find/page.tsx` — side-by-side layout, removed modal, Claude NL search, `YPListing` row slimmed to 4 elements (icon / title+sub / score / dot+tier), sorted highest→lowest score per section
- `src/app/globals.css` — Leaflet popup overrides tightened: more specific selectors (`.leaflet-container .leaflet-popup .leaflet-popup-content-wrapper`), `box-shadow: none`, shadow moved to `filter: drop-shadow` on `.leaflet-popup`
- `package.json` / `package-lock.json` — `@anthropic-ai/sdk` installed

## Next step
Visual QA on `/find` — confirm white box is gone, Close flies back to London zoom 10, NL search badge works, listing click opens popup

## Open questions
- Scoring formula multipliers still not tuned to tier boundaries (carried from previous sessions)
- EgoGraph legend still says "Gov. voucher / Community voucher" — should list all 4 tiers
- `activeListing` derived from `filtered` (borough-scoped) — popup auto-closes if user switches borough while a listing is selected; correct but worth confirming visually

## Key decisions
- "View Profile →" link removed from map popup — profile page not demo-ready (only `dr_osei` seed user has a username; others 404)
- Popup white box: root cause was Leaflet CSS loading after globals.css, overriding our styles despite `!important`; fix = more specific selector chain + shadow via `filter: drop-shadow` on `.leaflet-popup`
- `MapResetController`: same pattern as `MapFlyController` — child component inside `MapContainer` reads map via `useMap()`, fires `flyTo([51.505, -0.09], 10)` when `active` prop flips true
- `resetView` pulse pattern: set true on click, reset to false after 100ms — avoids needing to debounce repeated closes
- `YPListing` row: dropped `refCode`, `area`, `note/credentials`, `"Available now"` text
- Layout: map 65% left / listings 35% right
- Claude Haiku for NL search, silent fallback to keyword match on failure
