'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet'
import type { Layer, PathOptions, LeafletMouseEvent } from 'leaflet'
import type { Feature, FeatureCollection } from 'geojson'
import * as d3 from 'd3'
import 'leaflet/dist/leaflet.css'
import type { SkillTag, TrustTier } from '@/types'

export interface MapUser {
  node_id?: string
  username?: string | null
  display_name?: string | null
  skill?: SkillTag | null
  tier?: TrustTier
  borough?: string | null
}

export interface MapPOI {
  borough: string
  type: 'aid_hub' | 'risk_alert'
  label: string
}

interface HeatMapProps {
  users?: MapUser[]
  pois?: MapPOI[]
  selectedBorough?: string
  activeSkill?: SkillTag | 'All'
  onBoroughClick?: (name: string, users: MapUser[]) => void
}

const SKILL_COLORS: Record<SkillTag, string> = {
  Doctor:   '#22c55e',
  Engineer: '#3b82f6',
  Legal:    '#a855f7',
  Builder:  '#f59e0b',
  Nurse:    '#ec4899',
  Other:    '#6b7280',
}

const TIER_LABELS: Record<TrustTier, string> = {
  unverified:   'Unverified',
  verified:     'Verified',
  trusted:      'Trusted',
  gov_official: 'Gov Official',
}

const TIER_COLORS: Record<TrustTier, string> = {
  unverified:   '#6b7280',
  verified:     '#3b82f6',
  trusted:      '#22c55e',
  gov_official: '#ffffff',
}

const POI_COLORS: Record<MapPOI['type'], string> = {
  aid_hub:    '#b0c6ff',
  risk_alert: '#ffb4ab',
}

const VERIFIED_TIERS = new Set<TrustTier>(['verified', 'trusted', 'gov_official'])

// deterministic jitter in degrees (~1km scale for London)
function jitterDeg(index: number, range: number): number {
  return (Math.sin(index * 7.31 + 1.3) * 0.5) * range
}

type CentroidMap = Record<string, [number, number]>

export function HeatMap({
  users = [],
  pois = [],
  selectedBorough,
  activeSkill = 'All',
  onBoroughClick,
}: HeatMapProps) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const [centroids, setCentroids] = useState<CentroidMap>({})

  useEffect(() => {
    fetch('/london-boroughs.json')
      .then(r => r.json())
      .then((data: FeatureCollection) => {
        setGeojson(data)
        const map: CentroidMap = {}
        for (const f of data.features) {
          const name = (f.properties as Record<string, string>)['LAD13NM']
          if (!name) continue
          const [lng, lat] = d3.geoCentroid(f as d3.GeoPermissibleObjects)
          map[name] = [lat, lng]
        }
        setCentroids(map)
      })
      .catch((e: unknown) => { console.error('Failed to load london-boroughs.json', e) })
  }, [])

  const boroughCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const u of users) {
      if (u.borough && u.tier && VERIFIED_TIERS.has(u.tier)) {
        counts[u.borough] = (counts[u.borough] ?? 0) + 1
      }
    }
    return counts
  }, [users])

  const maxCount = useMemo(
    () => Math.max(...Object.values(boroughCounts), 1),
    [boroughCounts]
  )

  const colorScale = useMemo(
    () => d3.scalePow<string>()
      .exponent(0.45)
      .domain([0, maxCount])
      .range(['#0f172a', '#1d4ed8'])
      .clamp(true),
    [maxCount]
  )

  const boroughStyle = useCallback((feature: Feature | undefined): PathOptions => {
    const name = (feature?.properties as Record<string, string> | null)?.['LAD13NM'] ?? ''
    const count = boroughCounts[name] ?? 0
    const isSelected = name === selectedBorough
    const base = colorScale(count)
    return {
      fillColor: isSelected ? (d3.color(base)?.brighter(0.8)?.toString() ?? base) : base,
      fillOpacity: 0.88,
      color: isSelected ? '#60a5fa' : '#1e293b',
      weight: isSelected ? 2 : 0.8,
    }
  }, [boroughCounts, colorScale, selectedBorough])

  const onEachBorough = useCallback((feature: Feature, layer: Layer) => {
    const name = (feature.properties as Record<string, string>)['LAD13NM'] ?? ''
    const count = boroughCounts[name] ?? 0

    layer.bindTooltip(`${name} — ${count} verified`, { sticky: true })

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const path = e.target as { setStyle: (s: PathOptions) => void; bringToFront: () => void }
        path.setStyle({ color: '#3b82f6', weight: 1.8, fillOpacity: 0.95 })
        path.bringToFront()
      },
      mouseout: (e: LeafletMouseEvent) => {
        const path = e.target as { setStyle: (s: PathOptions) => void }
        path.setStyle(boroughStyle(feature))
      },
      click: () => {
        const boroughUsers = users.filter(
          u => u.borough === name && u.tier && VERIFIED_TIERS.has(u.tier)
        )
        onBoroughClick?.(name, boroughUsers)
      },
    })
  }, [boroughCounts, boroughStyle, users, onBoroughClick])

  const visiblePins = useMemo(
    () => users.filter(u =>
      u.borough && u.skill && u.tier && VERIFIED_TIERS.has(u.tier) &&
      (activeSkill === 'All' || u.skill === activeSkill)
    ),
    [users, activeSkill]
  )

  if (!geojson) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8c90a1', fontSize: 14 }}>
        Loading map...
      </div>
    )
  }

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={10}
      style={{ width: '100%', height: '100%', borderRadius: 8 }}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      {/* Borough choropleth — key forces re-render on selection change */}
      <GeoJSON
        key={selectedBorough ?? '__none__'}
        data={geojson}
        style={boroughStyle}
        onEachFeature={onEachBorough}
      />

      {/* User pins */}
      {visiblePins.map((u, i) => {
        const center = centroids[u.borough!]
        if (!center) return null
        const [lat, lng] = center
        const color = SKILL_COLORS[u.skill!]
        const tier = u.tier!
        const label = u.display_name ?? u.username ?? u.node_id ?? 'Unknown'
        return (
          <CircleMarker
            key={u.node_id ?? i}
            center={[lat + jitterDeg(i, 0.012), lng + jitterDeg(i + 17, 0.018)]}
            radius={tier === 'gov_official' ? 8 : 6}
            pathOptions={{
              fillColor: color,
              fillOpacity: 1,
              color: tier === 'gov_official' ? '#ffffff' : 'rgba(0,0,0,0.55)',
              weight: tier === 'gov_official' ? 2 : 1,
            }}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f1f5f9', marginBottom: 2 }}>{label}</div>
                {u.node_id && (
                  <div style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace', marginBottom: 6 }}>{u.node_id}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>{u.skill}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: TIER_COLORS[tier], display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>{TIER_LABELS[tier]}</span>
                </div>
                {u.borough && (
                  <div style={{ marginTop: 6, fontSize: 11, color: '#475569' }}>{u.borough}</div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}

      {/* POI markers */}
      {pois.map((poi, i) => {
        const center = centroids[poi.borough]
        if (!center) return null
        const [lat, lng] = center
        const color = POI_COLORS[poi.type]
        return (
          <CircleMarker
            key={`poi-${i}`}
            center={[lat + jitterDeg(i + 50, 0.008), lng + jitterDeg(i + 60, 0.012)]}
            radius={poi.type === 'risk_alert' ? 11 : 9}
            pathOptions={{
              fillColor: `${color}33`,
              fillOpacity: 1,
              color,
              weight: 1.8,
              dashArray: poi.type === 'risk_alert' ? '4 3' : undefined,
            }}
          >
            <Popup>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#f1f5f9', marginBottom: 2 }}>{poi.label}</div>
                <div style={{ fontSize: 11, color }}>
                  {poi.type === 'aid_hub' ? 'Aid Hub' : 'Risk Alert'}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
