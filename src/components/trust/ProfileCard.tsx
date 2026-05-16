'use client'

import type { User, Claim } from '@/types'

// Owner: Hemish
// Profile card: username, display_name, TrustRing, ScoreBadge, skill, claims/vouches count
// "Add claim" + "Vouch / QR" buttons
// Props: { user: User, claims: Claim[] }
export function ProfileCard({ user, claims }: { user: User; claims: Claim[] }) {
  return <div>ProfileCard {user.display_name} ({claims.length} claims) — TODO (Hemish)</div>
}
