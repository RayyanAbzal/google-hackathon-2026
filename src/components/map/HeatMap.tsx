'use client'

import { useEffect, useState } from 'react'
import * as d3 from 'd3'
import type { SkillTag, TrustTier } from '@/types'

interface MapUser {
  node_id?: string
  username?: string | null
  skill?: SkillTag | null
  tier?: TrustTier
  borough?: string | null
}

interface BoroughPath {
  id: string
  name: string
  d: string
  centroid: [number, number]
  count: number
}

const SVG_W = 800
const SVG_H = 620

const SKILL_COLORS: Record<SkillTag, string> = {
  Doctor:   '#22c55e',
  Engineer: '#3b82f6',
  Legal:    '#a855f7',
  Builder:  '#f59e0b',
  Nurse:    '#ec4899',
  Other:    '#6b7280',
}

const VERIFIED_TIERS = new Set<TrustTier>(['verified', 'trusted', 'gov_official'])

function jitter(index: number, range: number): number {
  return (Math.sin(index * 7.31 + 1.3) * 0.5) * range
}

export function HeatMap({ users = [] }: { users: MapUser[] }) {
  const [paths, setPaths] = useState<BoroughPath[]>([])
  const [maxCount, setMaxCount] = useState(1)

  useEffect(() => {
    fetch('/london-boroughs.json')
      .then(r => r.json())
      .then((geojson: d3.ExtendedFeatureCollection) => {
        const proj = d3.geoMercator().fitSize([SVG_W, SVG_H], geojson)
        const pathGen = d3.geoPath().projection(proj)

        const boroughCounts: Record<string, number> = {}
        for (const u of users) {
          if (u.borough && u.tier && VERIFIED_TIERS.has(u.tier)) {
            boroughCounts[u.borough] = (boroughCounts[u.borough] ?? 0) + 1
          }
        }

        const computed: BoroughPath[] = geojson.features.map((f: d3.ExtendedFeature) => {
          const props = f.properties as Record<string, string>
          const name: string = props['LAD13NM'] ?? ''
          const raw = proj(d3.geoCentroid(f))
          return {
            id: props['LAD13CD'] ?? name,
            name,
            d: pathGen(f) ?? '',
            centroid: raw ? [raw[0], raw[1]] : [0, 0],
            count: boroughCounts[name] ?? 0,
          }
        })

        const top = Math.max(...computed.map(p => p.count), 1)
        setMaxCount(top)
        setPaths(computed)
      })
      .catch(() => { /* GeoJSON load failed — silent */ })
  }, [users])

  const colorScale = d3.scaleLinear<string>()
    .domain([0, maxCount])
    .range(['#0f172a', '#1d4ed8'])
    .clamp(true)

  const verifiedPins = users.filter(
    u => u.borough && u.skill && u.tier && VERIFIED_TIERS.has(u.tier)
  )

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full h-full"
      aria-label="London trust heatmap"
    >
      {paths.map(p => (
        <path
          key={p.id}
          d={p.d}
          fill={colorScale(p.count)}
          stroke="#1e293b"
          strokeWidth={0.8}
        />
      ))}
      {verifiedPins.map((u, i) => {
        const bp = paths.find(p => p.name === u.borough)
        if (!bp) return null
        const [cx, cy] = bp.centroid
        return (
          <circle
            key={u.node_id ?? i}
            cx={cx + jitter(i, 18)}
            cy={cy + jitter(i + 17, 14)}
            r={u.tier === 'gov_official' ? 7 : 5}
            fill={SKILL_COLORS[u.skill!]}
            opacity={0.88}
            className="cursor-pointer"
          />
        )
      })}
    </svg>
  )
}
