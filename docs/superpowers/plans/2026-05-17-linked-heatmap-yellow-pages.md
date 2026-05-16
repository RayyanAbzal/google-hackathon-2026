# Linked Heatmap + Yellow Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the `/find` page so the heatmap and Yellow Pages listings are live-linked: NL search filters both, listing clicks fly the map and open a Leaflet popup.

**Architecture:** Side-by-side layout (map 65%, listings 35%). Claude Haiku (`claude-haiku-4-5-20251001`) interprets natural language search queries into structured `{ skill, borough }` filters via a POST route. A `MapFlyController` child component calls `useMap()` inside `<MapContainer>` to imperatively pan the map. A Leaflet `<Popup position={...}>` anchored at the borough centroid replaces the current modal overlay.

**Tech Stack:** Next.js App Router, React, react-leaflet v4, `@anthropic-ai/sdk`, TypeScript strict

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/api/find/interpret-search/route.ts` | Create | POST route — Claude Haiku NL → `{ skill, borough }` |
| `src/components/map/HeatMap.tsx` | Modify | Add `MapFlyController`, `focusedBorough`, `popupListing`, `onPopupClose`, borough dimming, Leaflet Popup |
| `src/app/find/page.tsx` | Modify | Side-by-side layout, remove modal, `selectedListingId` state, debounced NL search, wire new HeatMap props, active listing highlight |

---

## Task 0: Setup — Install Anthropic SDK + Add API Key

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `.env.local`

- [ ] **Step 1: Install the Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

Expected: `@anthropic-ai/sdk` appears in `package.json` dependencies.

- [ ] **Step 2: Add API key to .env.local**

Add the following line to `.env.local`:

```
ANTHROPIC_API_KEY=your_key_here
```

Replace `your_key_here` with the actual key from the Anthropic console. The key must be set before the dev server or build will be able to call the interpret-search route.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @anthropic-ai/sdk for NL search"
```

(Do not commit `.env.local` — it is gitignored.)

---

## Task 1: Claude Haiku NL Search API Route

**Files:**
- Create: `src/app/api/find/interpret-search/route.ts`

- [ ] **Step 1: Create the route file**

```typescript
// src/app/api/find/interpret-search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { SkillTag } from '@/types'

const VALID_SKILLS = new Set<string>(['Doctor', 'Nurse', 'Engineer', 'Legal', 'Builder', 'Other'])

const LONDON_BOROUGHS = new Set([
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
  'City of London', 'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney',
  'Hammersmith and Fulham', 'Haringey', 'Harrow', 'Havering', 'Hillingdon',
  'Hounslow', 'Islington', 'Kensington and Chelsea', 'Kingston upon Thames',
  'Lambeth', 'Lewisham', 'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames',
  'Southwark', 'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster',
])

interface InterpretResult {
  skill: SkillTag | null
  borough: string | null
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json()
    if (typeof body !== 'object' || body === null || typeof (body as Record<string, unknown>).query !== 'string') {
      return NextResponse.json({ skill: null, borough: null })
    }
    const query = ((body as Record<string, unknown>).query as string).slice(0, 200)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: `You are a search interpreter for a post-disaster identity system in London.

Given a user's search query, extract:
- skill: the professional skill being sought. Must be exactly one of: Doctor, Nurse, Engineer, Legal, Builder, Other, or null if none applies.
- borough: a London borough name if mentioned, otherwise null.

Query: "${query}"

Respond ONLY with valid JSON in this exact shape:
{"skill": "Doctor" | "Nurse" | "Engineer" | "Legal" | "Builder" | "Other" | null, "borough": string | null}

No other text.`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const parsed: InterpretResult = JSON.parse(cleaned)

    const skill = VALID_SKILLS.has(parsed.skill ?? '') ? (parsed.skill as SkillTag) : null
    const borough = typeof parsed.borough === 'string' && LONDON_BOROUGHS.has(parsed.borough) ? parsed.borough : null

    return NextResponse.json({ skill, borough })
  } catch {
    return NextResponse.json({ skill: null, borough: null })
  }
}
```

- [ ] **Step 2: Verify the route builds**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/find/interpret-search/route.ts
git commit -m "feat(find): add Claude Haiku NL interpret-search API route"
```

---

## Task 2: HeatMap — MapFlyController + Borough Dimming + focusedBorough

**Files:**
- Modify: `src/components/map/HeatMap.tsx`

- [ ] **Step 1: Add imports and update HeatMapProps**

At the top of `src/components/map/HeatMap.tsx`, add `useMap` to the react-leaflet import and add the new props interface:

```typescript
// Add useMap to the existing react-leaflet import:
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'

// Add after the existing HeatMapProps interface:
export interface PopupListing {
  nodeId: string
  title: string
  sub: string
  tierLabel: string
  tierColor: string
  iconColor: string
  icon: string
  score: number
  totalVouches: number
  credentials: string[]
  avail: string
  availColor: string
  borough: string
  username: string | null
}

// Update HeatMapProps to add:
interface HeatMapProps {
  users?: MapUser[]
  pois?: MapPOI[]
  selectedBorough?: string
  activeSkill?: SkillTag | 'All'
  onBoroughClick?: (name: string) => void
  focusedBorough?: string | null        // new
  popupListing?: PopupListing | null    // new
  onPopupClose?: () => void             // new
}
```

- [ ] **Step 2: Add MapFlyController child component**

Add this component definition before the `HeatMap` export function:

```typescript
function MapFlyController({ borough, centroids }: { borough: string | null | undefined; centroids: CentroidMap }) {
  const map = useMap()
  useEffect(() => {
    if (!borough || !centroids[borough]) return
    map.flyTo(centroids[borough], 12, { duration: 0.8 })
  }, [borough, centroids, map])
  return null
}
```

- [ ] **Step 3: Update HeatMap function signature and boroughStyle for dimming**

Update the `HeatMap` function to accept the new props, and update `boroughStyle` to dim zero-count boroughs when a skill filter is active:

```typescript
export function HeatMap({
  users = [],
  pois = [],
  selectedBorough,
  activeSkill = 'All',
  onBoroughClick,
  focusedBorough,
  popupListing,
  onPopupClose,
}: HeatMapProps) {
```

Inside the `boroughStyle` callback, update the `count === 0` branch:

```typescript
// Replace the existing count === 0 branch:
if (count === 0) {
  const dimmed = activeSkill !== 'All'
  return {
    fillColor: '#1a2235',
    fillOpacity: isSelected ? 0.7 : (dimmed ? 0.15 : 0.55),
    color: isSelected ? '#7dd3fc' : '#2a3550',
    weight: isSelected ? 2 : 0.6,
  }
}
```

- [ ] **Step 4: Update GeoJSON key to include activeSkill**

The GeoJSON key forces a re-render when style-affecting props change. Update it:

```typescript
// Replace:
<GeoJSON
  key={selectedBorough ?? '__none__'}
  ...
/>

// With:
<GeoJSON
  key={`${selectedBorough ?? '__none__'}__${activeSkill}`}
  ...
/>
```

- [ ] **Step 5: Render MapFlyController inside MapContainer**

Add `MapFlyController` as the first child inside `<MapContainer>`:

```typescript
<MapContainer
  center={[51.505, -0.09]}
  zoom={10}
  style={{ height: '100%', width: '100%', overflow: 'hidden' }}
  zoomControl
>
  <MapFlyController borough={focusedBorough} centroids={centroids} />
  <TileLayer ... />
  ...
</MapContainer>
```

- [ ] **Step 6: Verify types**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/map/HeatMap.tsx
git commit -m "feat(map): add MapFlyController, focusedBorough, borough dimming"
```

---

## Task 3: HeatMap — Leaflet Popup for Selected Listing

**Files:**
- Modify: `src/components/map/HeatMap.tsx`

- [ ] **Step 1: Add the CREDENTIAL_LABEL map and AID_HUB_LABELS map inside HeatMap.tsx**

These are currently in `find/page.tsx`. The popup needs them to render credential tags and the contact hub. Add them as module-level constants in `HeatMap.tsx`:

```typescript
const CREDENTIAL_LABEL: Record<string, string> = {
  degree: 'Degree',
  nhs_card: 'NHS card',
  employer_letter: 'Employer letter',
  professional_cert: 'Prof. cert',
}

const AID_HUB_LABELS: Record<string, string> = {
  Southwark: "Guy's Aid Hub",
  Lambeth: 'Brixton Aid Centre',
  Hackney: 'Hackney Aid Hub',
  Westminster: 'NHS Emergency HQ',
  Camden: 'UCH Field Station',
}

function getAidHub(borough: string): string {
  return AID_HUB_LABELS[borough] ?? `${borough} Aid Hub`
}
```

- [ ] **Step 2: Render the Popup inside MapContainer**

Add this block after the POI `CircleMarker` list, still inside `<MapContainer>`:

```typescript
{popupListing && centroids[popupListing.borough] && (
  <Popup
    position={centroids[popupListing.borough]}
    eventHandlers={{ remove: () => onPopupClose?.() }}
    closeButton={false}
    autoPan={false}
  >
    <div style={{ minWidth: 200, fontFamily: 'inherit', background: '#181c22', color: '#dfe2eb', borderRadius: 8, padding: '12px 14px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${popupListing.iconColor}18`, border: `1px solid ${popupListing.iconColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 15, color: popupListing.iconColor }}>{popupListing.icon}</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{popupListing.title}</div>
          <div style={{ fontSize: 10, color: popupListing.iconColor }}>{popupListing.sub}</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: popupListing.tierColor, background: `${popupListing.tierColor}1a`, border: `1px solid ${popupListing.tierColor}50`, padding: '1px 5px', borderRadius: 3 }}>
          {popupListing.tierLabel}
        </span>
      </div>

      {/* Score + availability */}
      <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#8c90a1', marginBottom: 8, borderTop: '1px solid #2a3550', paddingTop: 7 }}>
        <span>Score <span style={{ color: '#dfe2eb', fontWeight: 700 }}>{popupListing.score}</span></span>
        <span style={{ color: '#424655' }}>·</span>
        <span>{popupListing.totalVouches} vouch{popupListing.totalVouches !== 1 ? 'es' : ''}</span>
        <span style={{ color: '#424655' }}>·</span>
        <span style={{ color: popupListing.availColor }}>{popupListing.avail}</span>
      </div>

      {/* Credentials */}
      {popupListing.credentials.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {popupListing.credentials.map(c => (
            <span key={c} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, background: 'rgba(176,198,255,0.08)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff' }}>
              ✓ {CREDENTIAL_LABEL[c] ?? c}
            </span>
          ))}
        </div>
      )}

      {/* Contact hub */}
      <div style={{ fontSize: 10, color: '#8c90a1', marginBottom: 8, borderTop: '1px solid #2a3550', paddingTop: 6 }}>
        Contact via <span style={{ color: '#dfe2eb' }}>{getAidHub(popupListing.borough)}</span>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={() => onPopupClose?.()}
          style={{ flex: 1, padding: '5px 0', background: 'rgba(66,70,85,0.3)', border: '1px solid #424655', borderRadius: 5, fontSize: 10, color: '#8c90a1', cursor: 'pointer' }}
        >
          Close
        </button>
        {popupListing.username && (
          <a
            href={`/profile/${popupListing.username}`}
            style={{ flex: 1, textAlign: 'center', padding: '5px 0', background: `${popupListing.iconColor}18`, border: `1px solid ${popupListing.iconColor}40`, borderRadius: 5, fontSize: 10, fontWeight: 600, color: popupListing.iconColor, textDecoration: 'none', display: 'block' }}
          >
            View Profile →
          </a>
        )}
      </div>
    </div>
  </Popup>
)}
```

- [ ] **Step 3: Override Leaflet popup default styles**

Leaflet popup has a white background and arrow by default. Add a `<style>` block inside the popup or use a global override. Add this to `src/app/globals.css` (or the existing Leaflet CSS import area):

```css
/* Override Leaflet popup chrome for dark theme */
.leaflet-popup-content-wrapper {
  background: transparent !important;
  border: none !important;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.7) !important;
  border-radius: 8px !important;
  padding: 0 !important;
}
.leaflet-popup-content {
  margin: 0 !important;
}
.leaflet-popup-tip-container {
  display: none !important;
}
```

- [ ] **Step 4: Verify types**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/map/HeatMap.tsx src/app/globals.css
git commit -m "feat(map): add listing popup anchored at borough centroid"
```

---

## Task 4: find/page.tsx — Layout + State Restructure

**Files:**
- Modify: `src/app/find/page.tsx`

- [ ] **Step 1: Update imports and add PopupListing import**

At the top of `src/app/find/page.tsx`, add the `PopupListing` import:

```typescript
import type { PopupListing } from '@/components/map/HeatMap'
```

- [ ] **Step 2: Replace state — add selectedListingId and searchLoading**

In the `FindPage` component, replace the `selected` state and add the two new state variables:

```typescript
// Remove:
const [selected, setSelected] = useState<DisplayListing | null>(null)

// Add:
const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
const [searchLoading, setSearchLoading] = useState(false)
```

- [ ] **Step 3: Derive popupListing and focusedBorough from state**

Add these derived values after the existing `useMemo` blocks:

```typescript
const activeListing = useMemo(
  () => filtered.find(r => r.nodeId === selectedListingId) ?? null,
  [filtered, selectedListingId]
)

const popupListing = useMemo((): PopupListing | null => {
  if (!activeListing) return null
  return {
    nodeId: activeListing.nodeId,
    title: activeListing.title,
    sub: activeListing.sub,
    tierLabel: activeListing.tierLabel,
    tierColor: activeListing.tierColor,
    iconColor: activeListing.iconColor,
    icon: activeListing.icon,
    score: activeListing.score,
    totalVouches: activeListing.totalVouches,
    credentials: activeListing.credentials,
    avail: activeListing.avail,
    availColor: activeListing.availColor,
    borough: activeListing.borough,
    username: activeListing.username,
  }
}, [activeListing])
```

- [ ] **Step 4: Update YPListing component to accept isActive prop**

Update the `YPListingProps` interface and `YPListing` component:

```typescript
// Add isActive to YPListingProps:
interface YPListingProps {
  refCode: string; icon: string; iconColor: string; title: string; sub: string
  area: string; avail: string; availColor: string; tierLabel: string; tierColor: string
  note: string; featured?: boolean; isActive?: boolean; onDetails: () => void
}

// In YPListing, update the outer div's style to use isActive:
function YPListing({ refCode, icon, iconColor, title, sub, area, avail, availColor, tierLabel, tierColor, note, featured, isActive, onDetails }: YPListingProps) {
  return (
    <div
      onClick={onDetails}
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 32px 1fr 110px 120px 44px',
        alignItems: 'center',
        gap: 10,
        padding: '11px 14px',
        borderTop: '1px solid rgba(66,70,85,0.4)',
        background: isActive ? `${iconColor}08` : (featured ? 'rgba(251,191,36,0.04)' : 'transparent'),
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.1s',
        borderLeft: isActive ? `2px solid ${iconColor}` : (featured ? '2px solid #fbbf24' : '2px solid transparent'),
      }}
    >
      {/* Remove the old featured left-border div since borderLeft now handles it */}
      <div className="mono" style={{ fontSize: 9, color: '#8c90a1', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{refCode}</div>
      <div style={{ width: 30, height: 30, borderRadius: 6, background: `${iconColor}18`, border: `1px solid ${iconColor}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: iconColor }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
          {title}
          {featured && <span className="mono" style={{ fontSize: 9, padding: '2px 5px', background: '#fbbf24', color: '#000', borderRadius: 3, letterSpacing: '0.08em', fontWeight: 700 }}>GOV</span>}
        </div>
        <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub} · {note}</div>
      </div>
      <div className="mono" style={{ fontSize: 10, color: '#c2c6d8', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', gap: 3 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 11, color: '#8c90a1' }}>location_on</span>{area}
      </div>
      <div style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 5, color: availColor }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: availColor, boxShadow: `0 0 5px ${availColor}`, display: 'inline-block', flexShrink: 0 }} />{avail}
      </div>
      <span className="mono" style={{ padding: '2px 6px', borderRadius: 3, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: tierColor, background: `${tierColor}1a`, border: `1px solid ${tierColor}50`, textAlign: 'center' }}>{tierLabel}</span>
    </div>
  )
}
```

- [ ] **Step 5: Update listing render to pass isActive and updated onDetails**

In the JSX where `YPListing` is rendered, update `onDetails` and add `isActive`:

```typescript
rows.map(r => (
  <YPListing
    key={r.nodeId}
    refCode={r.refCode} icon={r.icon} iconColor={r.iconColor}
    title={r.title} sub={r.sub} area={r.area}
    avail={r.avail} availColor={r.availColor}
    tierLabel={r.tierLabel} tierColor={r.tierColor}
    note={r.note} featured={r.featured}
    isActive={r.nodeId === selectedListingId}
    onDetails={() => {
      setSelectedListingId(r.nodeId)
      setActiveBorough(r.borough)
    }}
  />
))
```

- [ ] **Step 6: Clear selectedListingId when borough changes via map click**

Update the `onBoroughClick` handler passed to `HeatMap`:

```typescript
// Replace:
onBoroughClick={(name) => setActiveBorough(name)}

// With:
onBoroughClick={(name) => {
  setActiveBorough(name)
  setSelectedListingId(null)
}}
```

- [ ] **Step 7: Remove the modal JSX and dead helpers**

Delete the entire `{selected && ( ... )}` block at the bottom of the return statement (the fixed-position modal overlay).

Also remove from `find/page.tsx`:
- `AID_HUB_LABELS` constant — now in `HeatMap.tsx`
- `getAidHub` function — now in `HeatMap.tsx`

Do NOT remove `CREDENTIAL_LABEL` — it is still used in `toDisplayListing` for the listing's `note` field.

- [ ] **Step 8: Verify types**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/find/page.tsx
git commit -m "feat(find): replace modal with selectedListingId state, wire popup props"
```

---

## Task 5: find/page.tsx — Side-by-Side Layout

**Files:**
- Modify: `src/app/find/page.tsx`

- [ ] **Step 1: Restructure the main JSX layout**

Replace the current `<main>` contents with the side-by-side layout. The new structure:

```typescript
return (
  <div style={{ background: '#10141a', minHeight: '100vh', color: '#dfe2eb' }}>
    <TopBar />
    <Sidebar active="find" />

    <main style={{ marginLeft: sidebarWidth, paddingTop: 56, transition: 'margin-left 0.2s ease', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header + search — fixed top strip */}
      <div style={{ padding: '16px 20px 12px', flexShrink: 0 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 2px', lineHeight: 1 }}>The Yellow Pages.</h1>
        <p style={{ color: '#8c90a1', fontSize: 12, margin: '0 0 10px' }}>Every verified doctor, nurse, engineer and builder — pinned to the map.</p>

        {/* Search bar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 12px', background: '#181c22', border: '1px solid #424655', borderRadius: 8, gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#8c90a1' }}>search</span>
            <input
              placeholder="Search by role, credential or borough…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#dfe2eb', fontSize: 14, padding: '10px 0', fontFamily: 'inherit' }}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {searchLoading && (
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#8c90a1', animation: 'spin 1s linear infinite' }}>progress_activity</span>
            )}
            {search && !searchLoading && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: '#8c90a1', cursor: 'pointer', lineHeight: 1 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            )}
            {mapSkill !== 'All' && !searchLoading && (
              <span style={{ fontSize: 9, color: SKILL_COLOR[mapSkill] ?? '#b0c6ff', background: `${SKILL_COLOR[mapSkill] ?? '#b0c6ff'}18`, border: `1px solid ${SKILL_COLOR[mapSkill] ?? '#b0c6ff'}40`, padding: '2px 7px', borderRadius: 3, letterSpacing: '0.06em', fontWeight: 700, whiteSpace: 'nowrap' }}>
                {mapSkill.toUpperCase()} · AI matched
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-side panels — fill remaining height */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', borderTop: '1px solid rgba(66,70,85,0.4)' }}>

        {/* LEFT: Map — 65% */}
        <div style={{ flex: '0 0 65%', position: 'relative', overflow: 'hidden', borderRight: '1px solid rgba(66,70,85,0.4)' }}>
          <HeatMap
            users={mapUsers}
            selectedBorough={activeBorough}
            activeSkill={mapSkill}
            onBoroughClick={(name) => {
              setActiveBorough(name)
              setSelectedListingId(null)
            }}
            focusedBorough={activeListing?.borough ?? null}
            popupListing={popupListing}
            onPopupClose={() => setSelectedListingId(null)}
          />

          {/* Bottom-left: map hint */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, padding: '7px 12px', background: 'rgba(16,20,26,0.92)', border: `1px solid ${mapSkill !== 'All' ? `${SKILL_COLOR[mapSkill] ?? '#b0c6ff'}50` : 'rgba(66,70,85,0.5)'}`, borderRadius: 6, zIndex: 500, pointerEvents: 'none', transition: 'border-color 0.2s' }}>
            <span className="meta" style={{ color: mapSkill !== 'All' ? (SKILL_COLOR[mapSkill] ?? '#b0c6ff') : '#8c90a1' }}>
              {mapSkill !== 'All' ? mapSkill.toUpperCase() + ' DENSITY' : 'DENSITY HEATMAP'}
            </span>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{mapSkill !== 'All' ? `Showing ${mapSkill.toLowerCase()} density` : 'Showing all verified people'}</div>
          </div>

          {/* Bottom-right: verified counter */}
          {totalVerified > 0 && (
            <div style={{ position: 'absolute', bottom: 12, right: 12, padding: '10px 14px', background: 'rgba(16,20,26,0.92)', border: '1px solid rgba(66,70,85,0.5)', borderRadius: 6, zIndex: 500, pointerEvents: 'none', textAlign: 'right' }}>
              <div className="mono" style={{ fontSize: 9, color: '#8c90a1', letterSpacing: '0.1em', marginBottom: 3 }}>VERIFIED LONDONERS</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#b0c6ff', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {totalVerified.toLocaleString()} <span style={{ fontSize: 13, color: '#556074', fontWeight: 400 }}>/ {LONDON_POPULATION.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Listings panel — 35% */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#181c22' }}>

          {/* Borough + result count header */}
          {activeBorough && (
            <div style={{ padding: '8px 14px', borderBottom: '1px solid rgba(66,70,85,0.4)', background: '#0a0e14', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#b0c6ff' }}>location_on</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#dfe2eb' }}>{activeBorough}</span>
                <span style={{ fontSize: 12, color: '#556074' }}>·</span>
                <span style={{ fontSize: 12, color: '#8c90a1' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
                {search && <span style={{ fontSize: 10, color: '#8c90a1' }}>for &ldquo;{search}&rdquo;</span>}
              </div>
            </div>
          )}

          {/* Scrollable listing content */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: 32, textAlign: 'center', color: '#8c90a1', fontSize: 14 }}>Loading listings...</div>
            )}

            {!loading && Object.entries(bySubCategory).map(([subCat, rows]) => (
              <YPSection key={subCat} title={subCat} count={rows.length}>
                {rows.map(r => (
                  <YPListing
                    key={r.nodeId}
                    refCode={r.refCode} icon={r.icon} iconColor={r.iconColor}
                    title={r.title} sub={r.sub} area={r.area}
                    avail={r.avail} availColor={r.availColor}
                    tierLabel={r.tierLabel} tierColor={r.tierColor}
                    note={r.note} featured={r.featured}
                    isActive={r.nodeId === selectedListingId}
                    onDetails={() => {
                      setSelectedListingId(r.nodeId)
                      setActiveBorough(r.borough)
                    }}
                  />
                ))}
              </YPSection>
            ))}

            {!loading && filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center', color: '#8c90a1', fontSize: 14 }}>
                No verified listings in {activeBorough || 'this area'}{search ? ` matching "${search}"` : ''}.
              </div>
            )}

            <div style={{ margin: 12, padding: 12, border: '1px dashed rgba(66,70,85,0.5)', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#b0c6ff', marginTop: 1, flexShrink: 0 }}>visibility_off</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>Names are hidden by default.</div>
                <div style={{ fontSize: 11, color: '#8c90a1', marginTop: 2, lineHeight: 1.5 }}>You see role, area, credentials, and the hub they report to — never the person directly. Contact happens at the hub.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
)
```

- [ ] **Step 2: Add `@keyframes spin` to globals.css for the search spinner**

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

- [ ] **Step 3: Verify types**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/find/page.tsx src/app/globals.css
git commit -m "feat(find): side-by-side layout, map 65% left, listings 35% right"
```

---

## Task 6: find/page.tsx — Debounced Gemini NL Search

**Files:**
- Modify: `src/app/find/page.tsx`

- [ ] **Step 1: Add debounced NL search effect**

(`searchLoading` state was already added in Task 4 Step 2.)

Add this `useEffect` after the existing `useEffect` blocks in `FindPage`:

```typescript
useEffect(() => {
  const q = search.trim()
  if (!q) {
    // Reset to client-side defaults when cleared
    return
  }

  setSearchLoading(true)
  const timer = setTimeout(async () => {
    try {
      const res = await fetch('/api/find/interpret-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const json: { skill: import('@/types').SkillTag | null; borough: string | null } = await res.json()

      if (json.skill) {
        // API returned a skill — use it
      } else {
        // Fallback: client-side keyword match (existing SEARCH_TO_SKILL logic)
        const lower = q.toLowerCase()
        const matched = SEARCH_TO_SKILL.find(([term]) => lower.includes(term) || term.includes(lower))
        json.skill = matched?.[1] ?? null
      }

      // Only update mapSkill — don't override mapSkill derived from useMemo
      // We need to break mapSkill out of useMemo into state
    } catch {
      // Silent fallback — mapSkill stays as client-side derived value
    } finally {
      setSearchLoading(false)
    }
  }, 600)

  return () => {
    clearTimeout(timer)
    setSearchLoading(false)
  }
}, [search])
```

**Note:** The current `mapSkill` is a `useMemo` derived from `search`. To allow the API to override it, we need to convert `mapSkill` from `useMemo` to `useState`. Do that in the next step.

- [ ] **Step 3: Convert mapSkill from useMemo to state**

Replace:

```typescript
// Remove this useMemo:
const mapSkill = useMemo((): SkillTag | 'All' => {
  const q = search.trim().toLowerCase()
  if (!q) return 'All'
  return SEARCH_TO_SKILL.find(([term]) => q.includes(term) || term.includes(q))?.[1] ?? 'All'
}, [search])
```

With:

```typescript
const [mapSkill, setMapSkill] = useState<SkillTag | 'All'>('All')
```

Then update the debounced effect to actually call `setMapSkill`:

```typescript
useEffect(() => {
  const q = search.trim()
  if (!q) {
    setMapSkill('All')
    return
  }

  setSearchLoading(true)
  const timer = setTimeout(async () => {
    try {
      const res = await fetch('/api/find/interpret-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const json: { skill: import('@/types').SkillTag | null; borough: string | null } = await res.json()

      if (json.skill) {
        setMapSkill(json.skill)
      } else {
        // Client-side fallback
        const lower = q.toLowerCase()
        const matched = SEARCH_TO_SKILL.find(([term]) => lower.includes(term) || term.includes(lower))
        setMapSkill(matched?.[1] ?? 'All')
      }

      if (json.borough) {
        setActiveBorough(json.borough)
        setSelectedListingId(null)
      }
    } catch {
      // Silent fallback
      const lower = q.toLowerCase()
      const matched = SEARCH_TO_SKILL.find(([term]) => lower.includes(term) || term.includes(lower))
      setMapSkill(matched?.[1] ?? 'All')
    } finally {
      setSearchLoading(false)
    }
  }, 600)

  return () => {
    clearTimeout(timer)
    setSearchLoading(false)
  }
}, [search])
```

Also remove `mapSkill` from the dependency of `skillFilteredCount` and `mapHint` since those still work with `mapSkill` as state.

- [ ] **Step 4: Verify types**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/find/page.tsx
git commit -m "feat(find): debounced Gemini NL search, AI badge, mapSkill state"
```

---

## Task 7: Smoke Test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open http://localhost:3000/find**

Verify:
- Page renders in side-by-side layout (map left, listings right)
- Map fills left panel, listings scroll independently on right
- No modal overlay code visible in DOM inspector

- [ ] **Step 3: Test search → heatmap**

Type "doctor" in the search bar. After 600ms:
- AI badge appears: `DOCTOR · AI matched`
- Map heatmap darkens non-doctor boroughs
- Listings filter to doctor/nurse entries

Type something unmappable ("food"). After 600ms:
- No AI badge (falls back to All)
- Map resets to full density view

- [ ] **Step 4: Test listing click → popup**

Click any listing row in the right panel:
- Left border highlights the clicked row
- Map flies to that borough (smooth animation)
- Leaflet popup appears at borough centroid with: role, tier, score, credentials, contact hub, View Profile link
- Dark popup (no white Leaflet chrome)

Click "Close" inside the popup:
- Popup closes
- Row highlight disappears
- Map stays at borough

- [ ] **Step 5: Test borough click clears popup**

With a popup open, click a different borough on the map:
- Popup closes
- Row highlight disappears
- Listings filter to new borough

- [ ] **Step 6: Final type check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "chore(find): smoke test passed, linked heatmap + YP complete"
```
