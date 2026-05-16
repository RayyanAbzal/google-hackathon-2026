# Linked Heatmap + Yellow Pages — Design Spec

**Date:** 2026-05-17
**Status:** Approved — ready for implementation planning

---

## Overview

Wire the `/find` page so the heatmap and Yellow Pages listings are live-linked:
- Searching filters both the map and the list simultaneously
- Clicking a listing flies the map to that borough and opens a Leaflet popup with condensed trust info
- The current stacked layout (map on top, listings below) becomes side-by-side (map 65% left, listings 35% right)

---

## Layout

**Before:** full-width map hero (480px tall) stacked above scrollable listings.

**After:** fixed-height two-panel layout filling the viewport below the search bar.

- Left panel: `flex: 0 0 65%` — HeatMap, fills height
- Right panel: `flex: 1` — scrollable YP listings
- Both panels visible simultaneously; scrolling the listings does not affect the map
- Search bar remains full-width above both panels
- Page header ("The Yellow Pages.") and borough label/stats bar remain above the search bar

---

## Feature 1: Claude NL Search

### API route — `/api/find/interpret-search`

**Method:** POST  
**Body:** `{ query: string }`  
**Response:** `{ skill: SkillTag | null, borough: string | null }`

Uses `claude-haiku-4-5-20251001` (cost-sensitive, fast). Prompt instructs the model to extract:
- `skill`: one of `Doctor | Nurse | Engineer | Legal | Builder | Other | null`
- `borough`: a London borough name or null

Example: `"I need a lawyer for housing issues"` → `{ skill: "Legal", borough: null }`

**Fallback:** If the API call fails or returns unparseable JSON, fall back silently to the existing client-side `SEARCH_TO_SKILL` keyword match. No error shown to user.

**Debounce:** 600ms after the user stops typing before the API call fires. Interim: show spinner on search bar.

### Client-side behavior

1. User types → debounce starts
2. After 600ms → POST to `/api/find/interpret-search`
3. Response sets `mapSkill` (skill) and optionally `activeBorough` (borough, if non-null)
4. Map recolors: boroughs with zero matches for the active skill get `fillOpacity: 0.15` (dimmed), matching boroughs keep full heat color
5. AI badge appears on search bar: `"LEGAL · AI matched"` in skill color
6. If query is cleared → AI badge disappears, map resets to `activeSkill: 'All'`

**Fallback path:** if API fails → `SEARCH_TO_SKILL` keyword match runs client-side as today.

---

## Feature 2: Listing Click → Map Popup

### State changes

Add to `FindPage`:
- `selectedListingId: string | null` — tracks which listing's popup is open (separate from `activeBorough`)

Remove: `selected: DisplayListing | null` (drives the current modal — modal is removed entirely).

### Clicking a listing

1. Sets `selectedListingId = listing.nodeId`
2. Sets `activeBorough = listing.borough` (selects borough in map)
3. Passes `focusedBorough` and `popupListing` props down to `HeatMap`

### HeatMap imperative pan

`HeatMap` cannot call `map.flyTo()` directly — it renders outside `MapContainer`. Solution: add a child component `MapFlyController` inside `<MapContainer>` that:

```tsx
function MapFlyController({ borough, centroids }: { borough: string | null; centroids: CentroidMap }) {
  const map = useMap()
  useEffect(() => {
    if (!borough || !centroids[borough]) return
    map.flyTo(centroids[borough], 12, { duration: 0.8 })
  }, [borough, centroids, map])
  return null
}
```

Renders inside `<MapContainer>`. Receives `focusedBorough` and `centroids` as props.

### Leaflet Popup in HeatMap

Add a `popupListing` prop to `HeatMap`:

```tsx
interface PopupListing {
  nodeId: string
  title: string
  sub: string
  tierLabel: string
  tierColor: string
  iconColor: string
  score: number
  totalVouches: number
  credentials: string[]
  avail: string
  availColor: string
  borough: string
  username: string | null
}
```

When `popupListing` is set, render a `<Popup>` anchored at `centroids[popupListing.borough]` via a `<CircleMarker radius={0}>` (invisible anchor). Popup content:

- Role + tier badge (header row)
- Score · vouches · availability (metadata row)
- Credentials as tags
- "Contact via [Aid Hub]" one-liner
- "View Profile →" link (if `username` is set)
- Close button sets `selectedListingId` to null (via `onClose` callback)

### Active listing highlight

In the YP listing rows, the row whose `nodeId === selectedListingId` gets a 2px left border in `iconColor` and a faint `background: rgba(iconColor, 0.04)`.

---

## Feature 3: Borough click → listing filter (unchanged)

Clicking a borough on the map already sets `activeBorough` via `onBoroughClick`. No change needed. Clicking a new borough clears `selectedListingId` (closes any open popup).

---

## Files Changed

| File | Change |
|---|---|
| `src/app/find/page.tsx` | Layout → side-by-side; remove modal; add `selectedListingId` state; wire `focusedBorough` + `popupListing` to HeatMap; add debounced Claude search |
| `src/app/api/find/interpret-search/route.ts` | New POST route — Haiku call, returns `{ skill, borough }` |
| `src/components/map/HeatMap.tsx` | Add `MapFlyController` child; add `popupListing` prop + Popup; add `focusedBorough` prop |

---

## Error Handling

- Claude API failure → silent fallback to keyword match, no UI change
- Borough centroid missing → `flyTo` skipped, popup not rendered (both guard on centroid existence)
- Empty search → clear AI badge, reset skill to `'All'`

---

## Out of Scope

- Persisting selected listing across page navigations
- Individual pin markers per person (map remains borough-level heatmap)
- Filtering by borough in the NL search (borough filter is set but the user can still override by clicking the map)
