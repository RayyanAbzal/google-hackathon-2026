'use client'

import type { Claim } from '@/types'

// Owner: Hemish
// Claim card: type icon, status badge, vouch count, flag button
// Props: { claim: Claim, onFlag?: () => void }
export function ClaimCard({ claim, onFlag }: { claim: Claim; onFlag?: () => void }) {
  return <div>ClaimCard {claim.type} {claim.status} — TODO (Hemish)</div>
}
