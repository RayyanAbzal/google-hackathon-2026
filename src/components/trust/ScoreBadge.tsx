'use client'

import type { TrustTier } from '@/types'

// Owner: Hemish
// Tier pill badge — Unverified=red, Verified=green, Trusted=amber, Gov=orange+icon
// Props: { tier: TrustTier }
export function ScoreBadge({ tier }: { tier: TrustTier }) {
  return <span>ScoreBadge {tier} — TODO (Hemish)</span>
}
