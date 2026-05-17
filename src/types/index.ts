// CivicTrust — shared types
// All team members import from here. Do not define types elsewhere.

// ─── Skill + document tags ─────────────────────────────────────────────────

export type SkillTag = 'Doctor' | 'Engineer' | 'Legal' | 'Builder' | 'Nurse' | 'Other'
export type Skill = SkillTag  // alias used by map components

export type DocType = 'passport' | 'driving_licence' | 'degree' | 'employer_letter' | 'nhs_card'

// Docs accepted at registration (mandatory, min 1)
export type MandatoryDocType = 'passport' | 'driving_licence'

// ─── Database row types ────────────────────────────────────────────────────

export type ClaimType = 'identity' | 'credential' | 'work'
export type ClaimStatus = 'pending' | 'verified' | 'rejected'

// Score thresholds after eligibility: 0-19 Unverified, 20-54 Verified,
// 55-90 Trusted, 100 Gov Official. Government status is set manually.
export type TrustTier = 'unverified' | 'verified' | 'trusted' | 'gov_official'
export type Tier = TrustTier  // alias — prefer TrustTier in new code

export interface User {
  id: string
  node_id: string
  username: string | null
  display_name: string
  skill: SkillTag | null
  score: number
  tier: TrustTier
  borough: string | null
  created_at: string
}

export interface Claim {
  id: string
  user_id: string
  type: ClaimType
  status: ClaimStatus
  doc_type: string
  extracted_name: string | null  // nullable — Gemini can fail to read
  extracted_institution: string | null
  confidence: number | null
  content_hash: string | null  // for per-user dedup, stored in DB
  vouches: number
  flags: number
  created_at: string
}

export interface Vouch {
  id: string
  voucher_id: string
  vouchee_id: string
  created_at: string
}

export interface HelpPost {
  id: string
  user_id: string
  content: string
  skill_tag: SkillTag | null
  resource_tag: string | null
  borough: string
  urgency: 'low' | 'medium' | 'high'
  created_at: string
}

export interface GovOfficial {
  id: string
  user_id: string
  level: 0 | 1
  organisation: string
}
export type GovAnchor = GovOfficial

export type NotificationType = 'vouch_received' | 'claim_verified' | 'tier_changed' | 'account_created'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  detail: string | null
  icon: string
  color: string
  read: boolean
  related_user_id: string | null
  created_at: string
}

export interface CreateNotificationPayload {
  user_id: string
  type: NotificationType
  title: string
  detail: string | null
  icon: string
  color: string
  related_user_id?: string | null
}

export interface NotificationPreferences {
  vouch_received: boolean
  claim_verified: boolean
  tier_changed: boolean
  account_created: boolean
}

// ─── API response wrapper ──────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T }

// ─── Score logic ───────────────────────────────────────────────────────────

export interface ScoreInput {
  passport_count: number    // 20 pts each
  other_doc_count: number   // 15 pts each (driving_licence, degree, employer_letter, nhs_card)
  vouches_received: number  // number of eligible vouches received
  weighted_vouch_points?: number // verified=5, trusted=6.25, gov=10; max 40 counted
  gov_vouched: boolean      // kept for API compatibility; gov status is manual, not auto-granted
}

const MAX_DOCS = 3
const MAX_VOUCH_POINTS = 40
const USER_SCORE_CAP = 90
export const MIN_VOUCHES_FOR_VERIFIED = 2

export function calculateScore(input: ScoreInput): number {
  const totalDocs = Math.min(input.passport_count + input.other_doc_count, MAX_DOCS)
  const weightedVouchPoints = input.weighted_vouch_points ?? input.vouches_received * 5

  if (totalDocs === 0) return 0

  const passports = Math.min(input.passport_count, totalDocs)
  const others = totalDocs - passports
  const docScore = passports * 20 + others * 15
  const vouchScore = Math.min(weightedVouchPoints, MAX_VOUCH_POINTS)
  return Math.min(USER_SCORE_CAP, Math.round(docScore + vouchScore))
}

export function getTier(score: number): TrustTier {
  if (score >= 100) return 'gov_official'
  if (score >= 55) return 'trusted'
  if (score >= 20) return 'verified'
  return 'unverified'
}

export function getEligibleTier(score: number, verifiedDocCount: number, eligibleVouches: number): TrustTier {
  if (verifiedDocCount < 1 || eligibleVouches < MIN_VOUCHES_FOR_VERIFIED) return 'unverified'
  const tier = getTier(score)
  return tier === 'gov_official' ? 'trusted' : tier
}

// ─── Session (stored in localStorage) ─────────────────────────────────────

export interface Session {
  token: string
  user_id: string
  node_id: string
  username: string | null
  display_name: string
  skill: SkillTag | null
  score: number
  tier: TrustTier
  borough: string | null
}

// ─── Gemini document analysis ──────────────────────────────────────────────

// Shape returned by analyseDocument() in src/lib/gemini.ts
export interface DocumentAnalysis {
  extracted_name: string | null
  doc_type: DocType | string
  document_id?: string | null
  document_category?: 'passport' | 'driving_licence' | 'other' | null
  expiry_date?: string | null
  country?: string | null
  institution: string | null
  confidence: number
}
