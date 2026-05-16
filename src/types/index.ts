// CivicTrust — shared types
// All team members import from here. Do not define types elsewhere.

export type SkillTag = 'Doctor' | 'Engineer' | 'Legal' | 'Builder' | 'Nurse' | 'Other'

export type DocType = 'passport' | 'driving_licence' | 'degree' | 'employer_letter' | 'nhs_card'

export interface DocumentAnalysis {
  extracted_name: string | null
  doc_type: DocType | string
  confidence: number
  institution: string | null
}

export type ClaimType = 'identity' | 'credential' | 'work'

export type ClaimStatus = 'pending' | 'verified' | 'rejected'

export type TrustTier = 'unverified' | 'partial' | 'verified' | 'trusted' | 'gov_official'

export interface User {
  id: string
  node_id: string          // BLK-XXXXX-LDN
  username: string | null  // @handle, set after first login
  display_name: string
  skill: SkillTag
  score: number            // 0–100
  tier: TrustTier
  borough: string | null
  created_at: string
}

export interface Claim {
  id: string
  user_id: string
  type: ClaimType
  status: ClaimStatus
  doc_type: string         // 'passport' | 'degree' | 'employer_letter' etc.
  extracted_name: string   // from Gemini Vision
  extracted_institution: string | null
  confidence: number       // 0–1 from Gemini
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

export interface GovOfficial {
  id: string
  user_id: string
  level: 0 | 1             // 0 = coalition seed, 1 = institutional
  organisation: string     // 'NHS' | 'Met Police' | 'London Council'
}

// API response envelope — use for all API routes
export interface ApiResponse<T = null> {
  success: boolean
  data: T | null
  error: string | null
}

// Trust score calculation
export interface ScoreInput {
  claims_verified: number
  vouches_received: number
  gov_vouched: boolean
}

export function calculateScore(input: ScoreInput): number {
  const base = input.claims_verified * 15 + input.vouches_received * 10
  const govBonus = input.gov_vouched ? 20 : 0
  return Math.min(100, base + govBonus)
}

// Score thresholds: 0-29 Unverified, 30-49 Partial, 50-89 Verified, 90-94 Trusted, 95+ Gov Official
export function getTier(score: number): TrustTier {
  if (score >= 95) return 'gov_official'
  if (score >= 90) return 'trusted'
  if (score >= 50) return 'verified'
  if (score >= 30) return 'partial'
  return 'unverified'
}
