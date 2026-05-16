'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet'
import type { Feature, FeatureCollection } from 'geojson'
import * as d3 from 'd3'
import 'leaflet/dist/leaflet.css'
import type { SkillTag } from '@/types'
import type { MapPOI, MapUser } from './map-data'
import { buildMapInsights } from './map-data'

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

function MapResizer({ sidebarWidth }: { sidebarWidth?: number }) {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 220)
    return () => clearTimeout(t)
  }, [map, sidebarWidth])
  return null
}

function MapFlyController({ borough, centroids }: { borough: string | null | undefined; centroids: CentroidMap }) {
  const map = useMap()
  useEffect(() => {
    if (!borough || !centroids[borough]) return
    map.flyTo(centroids[borough], 12, { duration: 0.8 })
  }, [borough, centroids, map])
  return null
}

interface HeatMapProps {
  users?: MapUser[]
  pois?: MapPOI[]
  selectedBorough?: string
  activeSkill?: SkillTag | 'All'
  onBoroughClick?: (name: string) => void
  sidebarWidth?: number
  focusedBorough?: string | null
  popupListing?: PopupListing | null
  onPopupClose?: () => void
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
  sidebarWidth,
  focusedBorough,
  popupListing,
  onPopupClose,
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
      .range(['#0b1220', '#7cc4ff'])
      .clamp(true),
    [maxWeightedCount]
  )

  const boroughStyle = useCallback((feature: Feature | undefined): PathOptions => {
    const name = (feature?.properties as Record<string, string> | null)?.['LAD13NM'] ?? ''
    const insight = lookup[name]
    const count = insight?.weightedCount ?? 0
    const isSelected = name === selectedBorough
    const base = heatColorScale(count)

    if (count === 0) {
      const dimmed = activeSkill !== 'All'
      return {
        fillColor: '#1a2235',
        fillOpacity: isSelected ? 0.7 : (dimmed ? 0.15 : 0.55),
        color: isSelected ? '#7dd3fc' : '#2a3550',
        weight: isSelected ? 2 : 0.6,
      }
    }

    return {
      fillColor: isSelected ? (d3.color(base)?.brighter(0.45)?.formatHex() ?? base) : base,
      fillOpacity: isSelected ? 0.94 : 0.88,
      color: isSelected ? '#7dd3fc' : '#1e293b',
      weight: isSelected ? 2 : 0.8,
    }
  }, [heatColorScale, lookup, selectedBorough, activeSkill])

  const onEachBorough = useCallback((feature: Feature, layer: Layer) => {
    const name = (feature.properties as Record<string, string>)['LAD13NM'] ?? ''

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const path = e.target as { setStyle: (s: PathOptions) => void; bringToFront: () => void }
        path.setStyle({ color: '#60a5fa', weight: 2 })
        path.bringToFront()
      },
      mouseout: (e: LeafletMouseEvent) => {
        const path = e.target as { setStyle: (s: PathOptions) => void }
        path.setStyle(boroughStyle(feature))
      },
      click: () => {
        onBoroughClick?.(name)
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

  return (
    <MapContainer
      center={[51.505, -0.09]}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      zoomControl
    >
      <MapResizer sidebarWidth={sidebarWidth} />
      <MapFlyController borough={focusedBorough} centroids={centroids} />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains="abcd"
        maxZoom={19}
      />

      <GeoJSON
        key={`${selectedBorough ?? '__none__'}__${activeSkill}`}
        data={geojson}
        style={boroughStyle}
        onEachFeature={onEachBorough}
      />


      {pois.map((poi, index) => {
        const center = centroids[poi.borough]
        if (!center) return null

        const [lat, lng] = center
        const color = POI_COLORS[poi.type]

        return (
          <CircleMarker
            key={`poi-${poi.borough}-${poi.type}-${index}`}
            center={[lat + jitterDeg(index + 50, 0.006), lng + jitterDeg(index + 60, 0.01)]}
            radius={poi.type === 'risk_alert' ? 11 : 10}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.85,
              color: '#ffffff',
              weight: 1.5,
              dashArray: poi.type === 'risk_alert' ? '4 3' : undefined,
            }}
          >
            <Tooltip permanent direction="right" opacity={0.92} offset={[8, 0]}>
              <span style={{ fontSize: 11, fontWeight: 600, color: poi.type === 'aid_hub' ? '#b0c6ff' : '#ffb4ab' }}>
                {poi.label}
              </span>
            </Tooltip>
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
      {popupListing && centroids[popupListing.borough] && (
        <Popup
          position={centroids[popupListing.borough]}
          eventHandlers={{ remove: () => onPopupClose?.() }}
          closeButton={false}
          autoPan={false}
        >
          <div style={{ minWidth: 200, fontFamily: 'inherit', background: '#181c22', color: '#dfe2eb', borderRadius: 8, padding: '12px 14px' }}>
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
            <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#8c90a1', marginBottom: 8, borderTop: '1px solid #2a3550', paddingTop: 7 }}>
              <span>Score <span style={{ color: '#dfe2eb', fontWeight: 700 }}>{popupListing.score}</span></span>
              <span style={{ color: '#424655' }}>·</span>
              <span>{popupListing.totalVouches} vouch{popupListing.totalVouches !== 1 ? 'es' : ''}</span>
              <span style={{ color: '#424655' }}>·</span>
              <span style={{ color: popupListing.availColor }}>{popupListing.avail}</span>
            </div>
            {popupListing.credentials.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {popupListing.credentials.map(c => (
                  <span key={c} style={{ fontSize: 9, padding: '2px 5px', borderRadius: 3, background: 'rgba(176,198,255,0.08)', border: '1px solid rgba(176,198,255,0.2)', color: '#b0c6ff' }}>
                    ✓ {CREDENTIAL_LABEL[c] ?? c}
                  </span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 10, color: '#8c90a1', marginBottom: 8, borderTop: '1px solid #2a3550', paddingTop: 6 }}>
              Contact via <span style={{ color: '#dfe2eb' }}>{getAidHub(popupListing.borough)}</span>
            </div>
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
    </MapContainer>
  )
}
