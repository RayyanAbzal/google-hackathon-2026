interface EgoGraphProps {
  width?: number
  height?: number
  count?: number
  accent?: string
  highlight?: string
}

export default function EgoGraph({
  width = 360,
  height = 280,
  count = 7,
  accent = '#b0c6ff',
  highlight = '#40e56c',
}: EgoGraphProps) {
  const cx = width / 2
  const cy = height / 2
  const ring = Math.min(width, height) * 0.34
  const ring2 = Math.min(width, height) * 0.46
  const nodes: { x: number; y: number; hl: boolean }[] = []
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + 0.3
    const r = i % 3 === 0 ? ring2 : ring
    nodes.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, hl: i % 3 === 0 })
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
      <defs>
        <radialGradient id="egoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={highlight} stopOpacity="0.25" />
          <stop offset="100%" stopColor={highlight} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={ring} fill="none" stroke="#424655" strokeOpacity="0.5" strokeDasharray="2 4" />
      <circle cx={cx} cy={cy} r={ring2} fill="none" stroke="#424655" strokeOpacity="0.35" strokeDasharray="2 4" />
      {nodes.map((n, i) => (
        <line
          key={i}
          x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke={n.hl ? highlight : accent} strokeOpacity="0.45" strokeWidth="1"
        />
      ))}
      <circle cx={cx} cy={cy} r="32" fill="url(#egoGlow)" />
      <circle cx={cx} cy={cy} r="14" fill={highlight} />
      <circle cx={cx} cy={cy} r="20" fill="none" stroke={highlight} strokeOpacity="0.6" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill="#002d6f">YOU</text>
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.hl ? 8 : 6} fill={n.hl ? highlight : accent} />
          {n.hl && (
            <circle cx={n.x} cy={n.y} r="12" fill="none" stroke={highlight} strokeOpacity="0.4" />
          )}
        </g>
      ))}
    </svg>
  )
}
