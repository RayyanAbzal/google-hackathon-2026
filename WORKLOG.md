# WORKLOG

**Updated:** 2026-05-16 (session — Yellow Pages / heatmap overhaul)

## Active task
Yellow Pages + heatmap redesign: full-width map hero, search-driven skill density, map audit fixes

## Phase
implementing

## Files changed this session
- `src/app/find/page.tsx` — full rewrite: full-width map hero above listings; search drives heatmap skill filter (type "doctor" → map shows doctor density); borough chips replace category pills; search→skill overlay hint + live counter sub-count now skill-aware; hardcoded POIs removed; category pills removed; Aid Hub card removed from listings; Status filter removed; icon colors now match skill colors
- `src/components/map/HeatMap.tsx` — empty boroughs now visible (`#1a2235` / opacity 0.55 instead of near-black 0.18); permanent Tooltip labels on POI markers (removed since POIs removed from find page); tooltip now shows top-2 skills e.g. "Southwark — 14 verified · 5 Doctor · 3 Engineer"; onBoroughClick signature simplified to `(name: string) => void` (dropped unused users param); Tooltip imported
- `src/components/map/map-data.ts` — removed dead `getDisplayName` function; removed its usage in people sort
- `src/app/CLAUDE.md` — updated /map row from "Done" to "Removed — merged into /find"
- `src/app/find/page.tsx.tmp` — deleted (stale scratch file)

## Next step
Visual QA in browser — verify: search "doctor" changes map to green density + counter shows doctor count; click borough on map filters listings; modal opens with credentials; tsc stays clean

## Open questions
- Scoring formula multipliers still not tuned to tier boundaries (deferred)
- seed users all have username=null so "View Profile" won't show — need @dr_osei to have username set for demo flow
- Yellow Pages still feels like a directory — discussed "Post for Help" bulletin board feature but user confirmed NOT building it

## Key decisions
- Combined /find page (map + listings) confirmed — no separate /map route
- Search drives heatmap `activeSkill`: SEARCH_TO_SKILL mapping covers plurals, synonyms (lawyer→Legal, nhs→Nurse, construction→Builder)
- Map overlay counter sub-count is skill-aware: searching "builder" → shows "146 builders verified"; no search → shows medical/engineers/legal breakdown
- Borough chips now show ALL boroughs (not per-category) — simpler, works with search replacing category filter
- Hardcoded POIs (NHS Emergency HQ, Aid Hubs etc.) removed from map — user wants these searchable not pinned
- Empty borough style: `#1a2235` fill at 0.55 opacity — visually distinct from "low density" (dark vs dim blue)
- Icon colors in listings now match skill colors from heatmap legend (Doctor=green, Engineer=blue, Legal=purple, Builder=amber)
