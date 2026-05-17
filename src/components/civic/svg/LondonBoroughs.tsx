interface Borough {
  name: string
  d: string
}

interface Pin {
  x: number
  y: number
  color: string
}

interface LondonBoroughsProps {
  width?: number
  height?: number
  highlights?: string[]
  pins?: Pin[]
  onBoroughClick?: (name: string) => void
}

const BOROUGHS: Borough[] = [
  { name: 'Hackney',     d: 'M 320 80 L 380 90 L 400 130 L 360 170 L 310 160 L 290 120 Z' },
  { name: 'Lambeth',     d: 'M 200 230 L 250 220 L 290 260 L 290 320 L 240 340 L 190 310 Z' },
  { name: 'Southwark',   d: 'M 280 200 L 340 200 L 360 250 L 340 300 L 290 310 L 270 260 Z' },
  { name: 'Westminster', d: 'M 130 180 L 200 170 L 220 220 L 200 250 L 150 250 L 110 220 Z' },
  { name: 'Tower H.',    d: 'M 360 170 L 420 175 L 440 220 L 410 250 L 360 240 L 350 200 Z' },
  { name: 'Camden',      d: 'M 130 80 L 200 85 L 230 120 L 210 170 L 150 175 L 100 140 Z' },
  { name: 'Islington',   d: 'M 220 100 L 280 90 L 310 130 L 290 170 L 230 175 L 210 145 Z' },
  { name: 'Newham',      d: 'M 440 200 L 500 200 L 510 250 L 480 280 L 430 260 Z' },
  { name: 'Greenwich',   d: 'M 370 270 L 430 270 L 460 320 L 410 350 L 370 320 Z' },
  { name: 'Wandsworth',  d: 'M 80 230 L 140 230 L 170 270 L 150 320 L 100 330 L 60 290 Z' },
]

export default function LondonBoroughs({
  width = 520,
  height = 360,
  highlights = ['Southwark'],
  pins = [],
  onBoroughClick,
}: LondonBoroughsProps) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      style={{ display: 'block', position: 'absolute', inset: 0 }}
    >
      <path
        d="M -20 230 Q 80 215 180 245 T 360 250 T 540 240 L 540 280 Q 360 290 200 275 T -20 265 Z"
        fill="#121214"
        stroke="#a00020"
        strokeOpacity="0.25"
      />
      {BOROUGHS.map((b) => {
        const active = highlights.includes(b.name)
        const match = b.d.match(/(\d+)\s+(\d+)/)
        const tx = match ? Number(match[1]) + 30 : 0
        const ty = match ? Number(match[2]) + 30 : 0
        return (
          <g key={b.name} onClick={() => onBoroughClick?.(b.name)} style={{ cursor: onBoroughClick ? 'pointer' : 'default' }}>
            <path
              d={b.d}
              fill={active ? 'rgba(160,0,32,0.18)' : '#121214'}
              stroke={active ? '#a00020' : '#28282c'}
              strokeWidth={active ? 1.5 : 0.7}
            />
            <text
              x={tx}
              y={ty}
              fontFamily="JetBrains Mono, ui-monospace, monospace"
              fontSize="9"
              fill={active ? '#a00020' : '#6a6a70'}
              opacity={active ? 1 : 0.6}
            >
              {b.name.toUpperCase()}
            </text>
          </g>
        )
      })}
      {pins.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="14" fill={p.color} fillOpacity="0.18" />
          <circle cx={p.x} cy={p.y} r="6" fill={p.color} stroke="#070708" strokeWidth="1.5" />
        </g>
      ))}
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#28282c" strokeOpacity="0.2" strokeDasharray="2 4" />
      <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#28282c" strokeOpacity="0.2" strokeDasharray="2 4" />
      <text
        x="6"
        y={height - 8}
        fontFamily="JetBrains Mono, ui-monospace, monospace"
        fontSize="9"
        fill="#6a6a70"
      >
        51.5074°N · 0.1278°W
      </text>
    </svg>
  )
}
