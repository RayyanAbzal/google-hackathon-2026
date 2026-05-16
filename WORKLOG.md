# WORKLOG

**Updated:** 2026-05-17 — /find map UX fixes session

## Active task
Polishing /find page UX — borough auto-select, hover color bug, borough label on map

## Phase
reviewing

## Files changed this session
- `src/app/find/page.tsx` — removed useEffect that auto-picked allBoroughs[0] (Barnet); `filtered` now shows all listings when no borough selected; right panel header shows "All boroughs · N results" on load
- `src/components/map/HeatMap.tsx` — fixed stale closure bug in onEachBorough mouseover (boroughStyle read via ref so hover shows correct heatmap color, not dark blue); added DivIcon Marker at centroid to show selected borough name inside region shape

## Next step
Score explanation on /dashboard — "Why is my score X?" using Claude Haiku with user's claims + vouch count as context

## Open questions
- Scoring formula multipliers still not tuned to tier boundaries (carried over)
- Borough report cache never invalidates — fine for demo, would need TTL in prod

## Key decisions
- No auto-select on /find load: showing all 146 listings immediately is better for demo judges than arbitrary Barnet filter
- Hover bug root cause: onEachFeature handlers in Leaflet are set once at mount; users data loads async after, making boroughStyle stale in closure; fix is `boroughStyleRef.current = boroughStyle` on every render so handlers always see latest lookup
- Borough name label: DivIcon Marker with `iconSize:[0,0]`, 200px wide div centered via `margin-left:-100px`, uppercase white text with heavy text-shadow
