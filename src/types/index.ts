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

// Score thresholds: 0-29 Unverified, 30-49 Partial, 50-89 Verified, 90-94 Trusted, 95+ Gov Official
export type TrustTier = 'unverified' | 'partial' | 'verified' | 'trusted' | 'gov_official'
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

export interface GovOfficial {
  id: string
  user_id: string
  level: 0 | 1
  organisation: string
}
export type GovAnchor = GovOfficial  // DB table is gov_anchors

// ─── API response wrapper ──────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ─── Score logic ───────────────────────────────────────────────────────────

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

export function getTier(score: number): TrustTier {
  if (score >= 95) return 'gov_official'
  if (score >= 90) return 'trusted'
  if (score >= 50) return 'verified'
  if (score >= 30) return 'partial'
  return 'unverified'
}

// ─── Session (stored in localStorage) ─────────────────────────────────────

export interface Session {
  token: string
  user_id: string
  node_id: string
  username: string | null
  display_name: string
  score: number
  tier: TrustTier
}

// ─── Gemini document analysis ──────────────────────────────────────────────

// Shape returned by analyseDocument() in src/lib/gemini.ts
export interface DocumentAnalysis {
  extracted_name: string | null
  doc_type: DocType | string
  institution: string | null
  confidence: number
}
