import type { TrustTier } from '@/types'

interface TierBadgeProps {
  tier: TrustTier
  className?: string
}

const TIER_MAP: Record<TrustTier, { cls: string; label: string }> = {
  unverified:   { cls: 'tier-0', label: 'Tier 0 · Unverified' },
  partial:      { cls: 'tier-1', label: 'Tier 1 · Partial' },
  verified:     { cls: 'tier-2', label: 'Tier 2 · Community' },
  trusted:      { cls: 'tier-3-outline', label: 'Tier 3 · Trusted' },
  gov_official: { cls: 'tier-3', label: 'Gov Official' },
}

export default function TierBadge({ tier, className = '' }: TierBadgeProps) {
  const { cls, label } = TIER_MAP[tier]
  return (
    <span className={`tier-badge ${cls} ${className}`}>{label}</span>
  )
}
