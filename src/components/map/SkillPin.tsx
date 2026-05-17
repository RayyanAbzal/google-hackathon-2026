'use client'

import type { SkillTag } from '@/types'

export const SKILL_COLORS: Record<SkillTag, string> = {
  Doctor:   '#00b860',
  Engineer: '#cc7700',
  Legal:    '#d2d2d6',
  Builder:  '#a00020',
  Nurse:    '#a85a6f',
  Other:    '#6a6a70',
}

// SVG circle rendered inside HeatMap's <svg>. x/y are projected SVG coordinates.
// isGov adds a gold ring. Used by HeatMap — can also be rendered standalone.
export function SkillPin({
  skill,
  x,
  y,
  username,
  isGov = false,
}: {
  skill: SkillTag
  x: number
  y: number
  username: string
  isGov?: boolean
}) {
  const r = isGov ? 7 : 5
  const color = SKILL_COLORS[skill]

  return (
    <g role="img" aria-label={`${skill} ${username}`}>
      <circle cx={x} cy={y} r={r} fill={color} opacity={0.88} className="cursor-pointer" />
      {isGov && (
        <circle cx={x} cy={y} r={r + 2} fill="none" stroke="#cc7700" strokeWidth={1.5} opacity={0.7} />
      )}
    </g>
  )
}
