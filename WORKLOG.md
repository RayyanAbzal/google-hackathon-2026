# WORKLOG

**Updated:** 2026-05-16 (latest session)

## Active task
Merged Trust Map into /find (Yellow Pages + heatmap combined), wired YP listings to Supabase DB

## Phase
implementing

## Files changed this session
- `src/app/find/page.tsx` — full rewrite: Leaflet HeatMap replaces SVG map; fetches real listings from /api/find/listings; dynamic borough pills per category; YP listing click highlights borough on heatmap; credential chips in modal; profile link if username exists; single API fetch powers both map and listings
- `src/app/api/find/listings/route.ts` — NEW: returns per-user YPListingRow[] with credentials aggregated from claims (degree/nhs_card/employer_letter filtered), used by find page
- `src/app/map/page.tsx` — DELETED (merged into /find)
- `src/components/civic/Sidebar.tsx` — removed "Trust Map" nav entry from AUTH_NAV and PUBLIC_NAV (now redundant)
- `src/components/map/HeatMap.tsx` — hover now only changes outline color/weight (not fill), POI pins made solid/opaque with white border so they show above density circles

## Next step
Visual QA: verify listings load from DB, borough pills populate, modal shows credentials, heatmap pins visible, hover outline-only behavior confirmed in browser

## Open questions
- Scoring formula multipliers still not tuned to tier boundaries (deferred from prev session)
- seed users all have username=null so "View Profile" won't show in demo — need demo user (@dr_osei) to have tier=verified/trusted and borough set to see the full flow

## Key decisions
- No separate listings table needed — users table IS the YP data source (skill+tier+borough+claims)
- Single fetch to /api/find/listings powers both Leaflet heatmap AND YP results (no duplicate Supabase call from client)
- Borough pills are dynamic per active category (only show boroughs with data for that skill group)
- YP listing click → setActiveBorough(row.borough) → map highlights that borough
- Hover on heatmap: only outline changes (color+weight), fill/fillOpacity untouched — prevents dark boroughs flashing light blue
- POI pins: solid fill (fillOpacity 0.85) + white border — visible above density glow circles
- "View Profile →" only shown when username is non-null (seed users won't show it, real registered users will)
- /map route deleted; sidebar Trust Map entry removed; find-help alias unchanged
