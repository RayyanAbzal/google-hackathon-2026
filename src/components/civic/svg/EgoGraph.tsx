'use client'

import { useState } from 'react'

interface VoucherNode {
  type: 'gov' | 'community'
  display_name?: string
  username?: string | null
  tier?: string
  vouched_at?: string
}

interface TooltipData {
  x: number
  y: number
  node: VoucherNode
}

interface EgoGraphProps {
  width?: number
  height?: number
  /** Real voucher nodes from /api/network. Falls back to count-based if omitted. */
  vouchers?: VoucherNode[]
  /** Fallback: number of nodes to generate when vouchers not provided */
  count?: number
}

// 4 rings matching the landing page "Four rings of trust"
const RINGS = [
  { tier: 'gov_official', factor: 0.15, stroke: '#40e56c', opacity: 0.6, dash: undefined },
  { tier: 'trusted',      factor: 0.26, stroke: '#40e56c', opacity: 0.45, dash: '2 5' },
  { tier: 'verified',     factor: 0.37, stroke: '#b0c6ff', opacity: 0.45, dash: '2 5' },
  { tier: 'unverified',   factor: 0.46, stroke: '#8c90a1', opacity: 0.30, dash: '2 5' },
]

function ringForTier(tier?: string): number {
  if (tier === 'gov_official') return 0
  if (tier === 'trusted') return 1
  if (tier === 'verified') return 2
  return 3
}

function nodeColor(tier?: string): string {
  if (tier === 'gov_official' || tier === 'trusted') return '#40e56c'
  if (tier === 'verified') return '#b0c6ff'
  return '#8c90a1'
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return '1 day ago'
  if (diffDays < 30) return `${diffDays} days ago`
  const months = Math.floor(diffDays / 30)
  return months === 1 ? '1 month ago' : `${months} months ago`
}

function tierLabel(tier: string): string {
  if (tier === 'gov_official') return 'Gov. Official'
  if (tier === 'trusted') return 'Trusted'
  if (tier === 'verified') return 'Verified'
  return 'Unverified'
}

export default function EgoGraph({
  width = 360,
  height = 280,
  vouchers,
  count = 7,
}: EgoGraphProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const cx = width / 2
  const cy = height / 2
  const base = Math.min(width, height)

  const ringRadii = RINGS.map((r) => base * r.factor)

  // Group vouchers by which ring they belong to so angular spacing is per-ring
  const sourceList: VoucherNode[] = vouchers ?? Array.from({ length: count }, (_, i) => ({
    type: (i % 3 === 0 ? 'gov' : (i % 3 === 1 ? 'community' : 'community')) as 'gov' | 'community',
    tier: i % 4 === 0 ? 'gov_official' : i % 4 === 1 ? 'trusted' : i % 4 === 2 ? 'verified' : 'unverified',
  }))

  // Assign each node to a ring and compute position within that ring
  const ringBuckets: VoucherNode[][] = [[], [], [], []]
  sourceList.forEach((v) => ringBuckets[ringForTier(v.tier)].push(v))

  const nodes: { x: number; y: number; data: VoucherNode; color: string; isGov: boolean }[] = []
  ringBuckets.forEach((bucket, ri) => {
    const r = ringRadii[ri]
    bucket.forEach((v, i) => {
      const a = (i / Math.max(bucket.length, 1)) * Math.PI * 2 + 0.3 + ri * 0.5
      nodes.push({
        x: cx + Math.cos(a) * r,
        y: cy + Math.sin(a) * r,
        data: v,
        color: nodeColor(v.tier),
        isGov: v.tier === 'gov_official',
      })
    })
  })

  function toPercent(svgX: number, svgY: number) {
    return { left: (svgX / width) * 100, top: (svgY / height) * 100 }
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        style={{ display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <radialGradient id="egoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#40e56c" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#40e56c" stopOpacity="0" />
          </radialGradient>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Four tier rings */}
        {RINGS.map((ring, i) => (
          <circle
            key={ring.tier}
            cx={cx} cy={cy}
            r={ringRadii[i]}
            fill="none"
            stroke={ring.stroke}
            strokeOpacity={ring.opacity}
            strokeDasharray={ring.dash}
            strokeWidth={i === 0 ? 1.5 : 1}
          />
        ))}

        {/* Edges */}
        {nodes.map((n, i) => (
          <line
            key={i}
            x1={cx} y1={cy} x2={n.x} y2={n.y}
            stroke={n.color}
            strokeOpacity={tooltip?.node === n.data ? 0.8 : 0.4}
            strokeWidth={tooltip?.node === n.data ? 1.5 : 1}
            style={{ transition: 'stroke-opacity 0.15s, stroke-width 0.15s' }}
          />
        ))}

        {/* Center YOU node */}
        <circle cx={cx} cy={cy} r="32" fill="url(#egoGlow)" />
        <circle cx={cx} cy={cy} r="14" fill="#40e56c" />
        <circle cx={cx} cy={cy} r="20" fill="none" stroke="#40e56c" strokeOpacity="0.6" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#002d6f">YOU</text>

        {/* Voucher nodes */}
        {nodes.map((n, i) => {
          const isHovered = tooltip?.node === n.data
          const r = n.isGov ? 8 : 6
          return (
            <g key={i} style={{ cursor: 'pointer' }} onMouseEnter={() => setTooltip({ x: n.x, y: n.y, node: n.data })} onMouseLeave={() => setTooltip(null)}>
              {isHovered && (
                <circle cx={n.x} cy={n.y} r={r + 7} fill={n.color} fillOpacity="0.12" filter="url(#nodeGlow)" />
              )}
              <circle
                cx={n.x} cy={n.y}
                r={isHovered ? r + 2 : r}
                fill={n.color}
                style={{ transition: 'r 0.12s' }}
              />
              {n.isGov && (
                <circle
                  cx={n.x} cy={n.y}
                  r={isHovered ? 15 : 12}
                  fill="none"
                  stroke={n.color}
                  strokeOpacity={isHovered ? 0.7 : 0.4}
                  style={{ transition: 'r 0.12s, stroke-opacity 0.12s' }}
                />
              )}
            </g>
          )
        })}
      </svg>

      {tooltip && (() => {
        const pos = toPercent(tooltip.x, tooltip.y)
        const node = tooltip.node
        const tc = nodeColor(node.tier)
        const flipX = pos.left > 65
        const flipY = pos.top > 60

        return (
          <div
            style={{
              position: 'absolute',
              left: `${pos.left}%`,
              top: `${pos.top}%`,
              transform: `translate(${flipX ? 'calc(-100% - 10px)' : '12px'}, ${flipY ? 'calc(-100% - 4px)' : '-50%'})`,
              background: '#181c22',
              border: `1px solid ${tc}55`,
              borderRadius: 10,
              padding: '10px 14px',
              minWidth: 160,
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 0 1px ${tc}22`,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 13, color: '#dfe2eb', marginBottom: 2 }}>
              {node.display_name ?? 'Unknown'}
            </div>
            {node.username && (
              <div style={{ fontSize: 11, color: '#8c90a1', marginBottom: 6 }}>@{node.username}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: node.vouched_at ? 6 : 0 }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: tc,
                background: `${tc}1a`,
                border: `1px solid ${tc}44`,
              }}>
                {node.tier ? tierLabel(node.tier) : (node.type === 'gov' ? 'Gov. Official' : 'Community')}
              </span>
            </div>
            {node.vouched_at && (
              <div style={{ fontSize: 11, color: '#8c90a1' }}>
                Vouched {relativeTime(node.vouched_at)}
              </div>
            )}
          </div>
        )
      })()}
    </div>
  )
}
