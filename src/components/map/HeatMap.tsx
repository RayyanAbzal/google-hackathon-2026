'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer } from 'react-leaflet'
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet'
import type { Feature, FeatureCollection } from 'geojson'
import * as d3 from 'd3'
import 'leaflet/dist/leaflet.css'
import type { SkillTag } from '@/types'
import type { MapPOI, MapUser } from './map-data'
import { buildMapInsights } from './map-data'

interface HeatMapProps {
  users?: MapUser[]
  pois?: MapPOI[]
  selectedBorough?: string
  activeSkill?: SkillTag | 'All'
  onBoroughClick?: (name: string, users: MapUser[]) => void
}

const SKILL_COLORS: Record<SkillTag, string> = {
  Doctor: '#22c55e',
  Engineer: '#3b82f6',
  Legal: '#a855f7',
  Builder: '#f59e0b',
  Nurse: '#ec4899',
  Other: '#6b7280',
}

const POI_COLORS: Record<MapPOI['type'], string> = {
  aid_hub: '#b0c6ff',
  risk_alert: '#ffb4ab',
}

type CentroidMap = Record<string, [number, number]>

function jitterDeg(index: number, range: number): number {
  return (Math.sin(index * 7.31 + 1.3) * 0.5) * range
}

export function HeatMap({
  users = [],
  pois = [],
  selectedBorough,
  activeSkill = 'All',
  onBoroughClick,
}: HeatMapProps) {
  const [geojson, setGeojson] = useState<FeatureCollection | null>(null)
  const [centroids, setCentroids] = useState<CentroidMap>({})
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/london-boroughs.json')
      .then(r => r.json())
      .then((data: FeatureCollection) => {
        setMapError(null)
        setGeojson(data)
        const map: CentroidMap = {}
        for (const feature of data.features) {
          const name = (feature.properties as Record<string, string>)['LAD13NM']
          if (!name) continue
          const [lng, lat] = d3.geoCentroid(feature as d3.GeoPermissibleObjects)
          map[name] = [lat, lng]
        }
        setCentroids(map)
      })
      .catch((error: unknown) => {
        console.error('Failed to load london-boroughs.json', error)
        setMapError('Unable to load borough map data.')
      })
  }, [])

  const { insights, lookup, maxWeightedCount } = useMemo(
    () => buildMapInsights(users, pois, activeSkill),
    [users, pois, activeSkill]
  )

  const heatColorScale = useMemo(
    () => d3.scaleLinear<string>()
      .domain([0, maxWeightedCount])
      .range(['#0b1220', '#17346a'])
      .clamp(true),
    [maxWeightedCount]
  )

  const boroughStyle = useCallback((feature: Feature | undefined): PathOptions => {
    const name = (feature?.properties as Record<string, string> | null)?.['LAD13NM'] ?? ''
    const insight = lookup[name]
    const count = insight?.weightedCount ?? 0
    const isSelected = name === selectedBorough
    const base = heatColorScale(count)

    return {
      fillColor: isSelected ? (d3.color(base)?.brighter(0.8)?.formatHex() ?? base) : base,
      fillOpacity: count > 0 ? (isSelected ? 0.94 : 0.88) : 0.22,
      color: isSelected ? '#7dd3fc' : '#1e293b',
      weight: isSelected ? 2 : 0.8,
    }
  }, [heatColorScale, lookup, selectedBorough])

  const onEachBorough = useCallback((feature: Feature, layer: Layer) => {
    const name = (feature.properties as Record<string, string>)['LAD13NM'] ?? ''
    const insight = lookup[name]
    const count = insight?.verifiedCount ?? 0

    layer.bindTooltip(`${name} — ${count} verified`, { sticky: true })

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const path = e.target as { setStyle: (s: PathOptions) => void; bringToFront: () => void }
        path.setStyle({ color: '#60a5fa', weight: 1.8, fillOpacity: 0.95 })
        path.bringToFront()
      },
      mouseout: (e: LeafletMouseEvent) => {
        const path = e.target as { setStyle: (s: PathOptions) => void }
        path.setStyle(boroughStyle(feature))
      },
      click: () => {
        const people = insight?.people ?? []
        onBoroughClick?.(name, people)
      },
    })
  }, [boroughStyle, lookup, onBoroughClick])

  if (!geojson) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-slate-700/70 bg-slate-950/80 px-6 text-center">
        <div>
          <div className="text-sm font-medium text-slate-200">
            {mapError ?? 'Loading map...'}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            The summary panel still works while the London borough layer loads.
          </div>
        </div>
      </div>
    )
  }

  const heatColor = activeSkill === 'All' ? '#3b82f6' : SKILL_COLORS[activeSkill]

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={10}
      className="h-full w-full overflow-hidden rounded-xl"
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <GeoJSON
        key={selectedBorough ?? '__none__'}
        data={geojson}
        style={boroughStyle}
        onEachFeature={onEachBorough}
      />

      {insights.map((insight, index) => {
        const center = centroids[insight.borough]
        if (!center || insight.weightedCount <= 0) return null

        const [lat, lng] = center
        const radius = 14 + Math.sqrt(insight.weightedCount) * 6.5
        const auraRadius = radius + 11
        const coreRadius = Math.max(8, radius * 0.58)
        const isSelected = insight.borough === selectedBorough
        const auraOpacity = isSelected ? 0.16 : 0.1
        const coreOpacity = isSelected ? 0.98 : 0.9

        const position = [lat + jitterDeg(index, 0.005), lng + jitterDeg(index + 9, 0.008)] as [number, number]

        return (
          <Fragment key={`heat-${insight.borough}`}>
            <CircleMarker
              key={`heat-aura-${insight.borough}`}
              center={position}
              radius={auraRadius}
              interactive={false}
              pathOptions={{
                fillColor: heatColor,
                fillOpacity: auraOpacity,
                color: heatColor,
                weight: 0.4,
              }}
            />
            <CircleMarker
              key={`heat-body-${insight.borough}`}
              center={position}
              radius={radius}
              interactive={false}
              pathOptions={{
                fillColor: heatColor,
                fillOpacity: isSelected ? 0.28 : 0.2,
                color: heatColor,
                weight: 1,
              }}
            />
            <CircleMarker
              key={`heat-core-${insight.borough}`}
              center={position}
              radius={coreRadius}
              interactive={false}
              pathOptions={{
                fillColor: heatColor,
                fillOpacity: coreOpacity,
                color: isSelected ? '#dbeafe' : 'rgba(255,255,255,0.55)',
                weight: isSelected ? 2 : 1,
              }}
            />
          </Fragment>
        )
      })}

      {pois.map((poi, index) => {
        const center = centroids[poi.borough]
        if (!center) return null

        const [lat, lng] = center
        const color = POI_COLORS[poi.type]

        return (
          <CircleMarker
            key={`poi-${poi.borough}-${poi.type}-${index}`}
            center={[lat + jitterDeg(index + 50, 0.006), lng + jitterDeg(index + 60, 0.01)]}
            radius={poi.type === 'risk_alert' ? 10 : 8}
            pathOptions={{
              fillColor: `${color}22`,
              fillOpacity: 1,
              color,
              weight: 1.8,
              dashArray: poi.type === 'risk_alert' ? '4 3' : undefined,
            }}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#f8fafc', marginBottom: 2 }}>{poi.label}</div>
                <div style={{ fontSize: 11, color }}>
                  {poi.type === 'aid_hub' ? 'Aid hub' : 'Risk alert'}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
