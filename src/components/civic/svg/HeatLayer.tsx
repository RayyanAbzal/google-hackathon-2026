interface HeatPoint {
  x: number
  y: number
  r?: number
  color: string
  intensity?: number
}

interface HeatLayerProps {
  points?: HeatPoint[]
  width?: number
  height?: number
}

export default function HeatLayer({ points = [], width = 620, height = 720 }: HeatLayerProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
      }}
    >
      <defs>
        {points.map((p, i) => (
          <radialGradient key={i} id={`heat-${i}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={p.color} stopOpacity={p.intensity ?? 0.65} />
            <stop offset="55%" stopColor={p.color} stopOpacity={(p.intensity ?? 0.65) * 0.4} />
            <stop offset="100%" stopColor={p.color} stopOpacity="0" />
          </radialGradient>
        ))}
      </defs>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r ?? 90} fill={`url(#heat-${i})`} />
      ))}
    </svg>
  )
}
