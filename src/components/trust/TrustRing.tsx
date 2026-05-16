'use client'

// Owner: Hemish
// SVG score ring with Framer Motion animation
// Colours: green (>=50), amber (30-49), red (<30)
// Props: { score: number, size?: number }
export function TrustRing({ score, size = 120 }: { score: number; size?: number }) {
  return <div style={{ width: size, height: size }}>TrustRing {score} — TODO (Hemish)</div>
}
