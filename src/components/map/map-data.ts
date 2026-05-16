import type { SkillTag, TrustTier } from '@/types'

export interface MapUser {
  node_id?: string
  username?: string | null
  display_name?: string | null
  skill?: SkillTag | null
  tier?: TrustTier
  borough?: string | null
}

export interface MapPOI {
  borough: string
  type: 'aid_hub' | 'risk_alert'
  label: string
}

export interface BoroughInsight {
  borough: string
  verifiedCount: number
  weightedCount: number
  people: MapUser[]
  topSkills: Array<{ skill: SkillTag; count: number }>
  aidHubs: MapPOI[]
  riskAlerts: MapPOI[]
}

const VERIFIED_TIERS = new Set<TrustTier>(['verified', 'trusted', 'gov_official'])

const TIER_WEIGHT: Record<Exclude<TrustTier, 'unverified'>, number> = {
  verified: 1,
  trusted: 1.35,
  gov_official: 1.7,
}

const SKILL_ORDER: SkillTag[] = ['Doctor', 'Nurse', 'Engineer', 'Legal', 'Builder', 'Other']

interface BoroughAggregate {
  borough: string
  verifiedCount: number
  weightedCount: number
  people: MapUser[]
  skillCounts: Partial<Record<SkillTag, number>>
  aidHubs: MapPOI[]
  riskAlerts: MapPOI[]
}

function getSkill(user: MapUser): SkillTag {
  return user.skill ?? 'Other'
}

export function aggregateMapInsights(users: MapUser[], pois: MapPOI[], activeSkill: SkillTag | 'All'): BoroughInsight[] {
  const buckets = new Map<string, BoroughAggregate>()

  for (const user of users) {
    if (!user.borough || !user.tier || !VERIFIED_TIERS.has(user.tier)) continue
    if (activeSkill !== 'All' && user.skill !== activeSkill) continue

    const skill = getSkill(user)
    const existing = buckets.get(user.borough)
    const bucket: BoroughAggregate = existing ?? {
      borough: user.borough,
      verifiedCount: 0,
      weightedCount: 0,
      people: [],
      skillCounts: {},
      aidHubs: [],
      riskAlerts: [],
    }

    bucket.verifiedCount += 1
    bucket.weightedCount += TIER_WEIGHT[user.tier as Exclude<TrustTier, 'unverified'>]
    bucket.people.push(user)
    bucket.skillCounts[skill] = (bucket.skillCounts[skill] ?? 0) + 1

    if (!existing) {
      buckets.set(user.borough, bucket)
    }
  }

  for (const poi of pois) {
    const existing = buckets.get(poi.borough)
    const bucket: BoroughAggregate = existing ?? {
      borough: poi.borough,
      verifiedCount: 0,
      weightedCount: 0,
      people: [],
      skillCounts: {},
      aidHubs: [],
      riskAlerts: [],
    }
    
    if (poi.type === 'aid_hub') bucket.aidHubs.push(poi)
    if (poi.type === 'risk_alert') bucket.riskAlerts.push(poi)
    
    if (!existing) {
      buckets.set(poi.borough, bucket)
    }
  }

  return Array.from(buckets.values())
    .map(bucket => ({
      borough: bucket.borough,
      verifiedCount: bucket.verifiedCount,
      weightedCount: bucket.weightedCount,
      people: bucket.people,
      topSkills: SKILL_ORDER
        .map(skill => ({ skill, count: bucket.skillCounts[skill] ?? 0 }))
        .filter(entry => entry.count > 0)
        .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill)),
      aidHubs: bucket.aidHubs,
      riskAlerts: bucket.riskAlerts,
    }))
    .sort((a, b) => b.weightedCount - a.weightedCount || a.borough.localeCompare(b.borough))
}

export function buildMapInsights(users: MapUser[], pois: MapPOI[], activeSkill: SkillTag | 'All') {
  const insights = aggregateMapInsights(users, pois, activeSkill)
  const lookup = Object.fromEntries(insights.map(insight => [insight.borough, insight])) as Record<string, BoroughInsight>

  return {
    insights,
    lookup,
    maxWeightedCount: Math.max(...insights.map(insight => insight.weightedCount), 1),
  }
}
