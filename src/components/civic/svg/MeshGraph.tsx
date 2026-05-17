interface MeshGraphProps {
  width?: number
  height?: number
  dense?: boolean
  accent?: string
  highlight?: string
  seed?: number
}

export default function MeshGraph({
  width = 640,
  height = 420,
  dense = false,
  accent = '#a00020',
  highlight = '#00b860',
  seed = 1,
}: MeshGraphProps) {
  const r2 = (n: number) => Math.round(n * 100) / 100
  const rand = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280
    return x - Math.floor(x)
  }
  const N = dense ? 38 : 22
  const nodes: { x: number; y: number; r: number; kind: string }[] = []
  for (let i = 0; i < N; i++) {
    nodes.push({
      x: r2(40 + rand(i) * (width - 80)),
      y: r2(40 + rand(i + 100) * (height - 80)),
      r: r2(2 + rand(i + 200) * 3),
      kind: rand(i + 300) > 0.78 ? 'hl' : rand(i + 400) > 0.4 ? 'mid' : 'dim',
    })
  }
  const edges: [number, number, number][] = []
  nodes.forEach((a, i) => {
    const dists = nodes
      .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
      .filter(x => x.j !== i)
    dists.sort((p, q) => p.d - q.d)
    dists.slice(0, 2).forEach(({ j, d }) => {
      if (d < (dense ? 130 : 180) && i < j) edges.push([i, j, d])
    })
  })

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ display: 'block' }}>
      <defs>
        <radialGradient id={`glow-${seed}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={highlight} stopOpacity="0.3" />
          <stop offset="100%" stopColor={highlight} stopOpacity="0" />
        </radialGradient>
      </defs>
      {edges.map(([i, j, d], k) => {
        const a = nodes[i], b = nodes[j]
        const op = r2(Math.max(0.05, 0.35 - d / 600))
        return (
          <line
            key={k}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke={accent} strokeOpacity={op} strokeWidth="1"
          />
        )
      })}
      {nodes.map((n, i) => {
        const color = n.kind === 'hl' ? highlight : n.kind === 'mid' ? accent : '#6a6a70'
        return (
          <g key={i}>
            {n.kind === 'hl' && (
              <circle cx={n.x} cy={n.y} r={n.r * 4} fill={`url(#glow-${seed})`} />
            )}
            <circle
              cx={n.x} cy={n.y} r={n.r}
              fill={color} fillOpacity={n.kind === 'dim' ? 0.55 : 1}
            />
            {n.kind === 'hl' && (
              <circle cx={n.x} cy={n.y} r={n.r + 3} fill="none" stroke={highlight} strokeOpacity="0.4" />
            )}
          </g>
        )
      })}
    </svg>
  )
}
