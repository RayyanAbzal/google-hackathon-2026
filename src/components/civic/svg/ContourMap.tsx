interface ContourMapProps {
  width?: number
  height?: number
  opacity?: number
  seed?: number
}

export default function ContourMap({ width = 800, height = 500, opacity = 1, seed = 1 }: ContourMapProps) {
  const lines: string[] = []
  for (let i = 0; i < 14; i++) {
    const yBase = 60 + i * 32
    const amp = 12 + (i % 3) * 6
    const phase = i * 0.7 + seed
    const path: string[] = []
    for (let x = -40; x <= width + 40; x += 20) {
      const y =
        yBase +
        Math.sin((x + phase * 30) / 70) * amp +
        Math.sin((x + phase * 11) / 130) * amp * 0.5
      path.push(`${x === -40 ? 'M' : 'L'} ${x} ${y}`)
    }
    lines.push(path.join(' '))
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={{ display: 'block', opacity, position: 'absolute', inset: 0 }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`carto-fade-${seed}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b0c6ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#b0c6ff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {lines.map((p, i) => (
        <path
          key={i}
          d={p}
          fill="none"
          stroke="#b0c6ff"
          strokeOpacity={0.06 + (i % 4) * 0.03}
          strokeWidth={i % 3 === 0 ? 1.2 : 0.7}
        />
      ))}
    </svg>
  )
}
