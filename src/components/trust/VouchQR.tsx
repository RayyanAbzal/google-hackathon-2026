'use client'

// Owner: Hemish
// Two modes: display (show QR of nodeId) + scan (camera scan)
// Uses qrcode for generation, html5-qrcode for scanning
// On successful scan: calls POST /api/vouch
// Props: { nodeId: string, onVouchComplete: (newScore: number) => void }
export function VouchQR({
  nodeId,
  onVouchComplete,
}: {
  nodeId: string
  onVouchComplete: (newScore: number) => void
}) {
  return <div>VouchQR {nodeId} — TODO (Hemish)</div>
}
