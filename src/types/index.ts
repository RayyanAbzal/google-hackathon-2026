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

// Score thresholds: 0-19 Unverified, 20-54 Verified, 55-90 Trusted, 91-100 Gov Official
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

// ─── API response wrapper ──────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; data?: T }

// ─── Score logic ───────────────────────────────────────────────────────────

export interface ScoreInput {
  passport_count: number    // 20 pts each
  other_doc_count: number   // 15 pts each (driving_licence, degree, employer_letter, nhs_card)
  vouches_received: number  // 5 pts each, max 10 counted
  gov_vouched: boolean      // +20 bonus, can push past 90 cap
}

const MAX_DOCS = 3
const MAX_VOUCHES = 10
const USER_SCORE_CAP = 90

// Minimum vouches required to unlock Verified, based on doc count
// More docs = fewer vouches needed. 0 docs = impossible.
const MIN_VOUCHES_FOR_DOCS: Record<number, number> = { 1: 5, 2: 3, 3: 2 }

export function calculateScore(input: ScoreInput): number {
  const totalDocs = Math.min(input.passport_count + input.other_doc_count, MAX_DOCS)

  // Must have at least 1 doc and minimum vouches for that doc count
  if (totalDocs === 0) return 0
  const minVouches = MIN_VOUCHES_FOR_DOCS[totalDocs] ?? 1
  if (input.vouches_received < minVouches) {
    // Show partial progress but keep them unverified (cap at 19)
    const partialScore = Math.min(input.passport_count, totalDocs) * 20 +
      (totalDocs - Math.min(input.passport_count, totalDocs)) * 15 +
      Math.min(input.vouches_received, MAX_VOUCHES) * 5
    return Math.min(19, partialScore)
  }

  const passports = Math.min(input.passport_count, totalDocs)
  const others = totalDocs - passports
  const docScore = passports * 20 + others * 15
  const vouchScore = Math.min(input.vouches_received, MAX_VOUCHES) * 5
  const base = Math.min(USER_SCORE_CAP, docScore + vouchScore)
  return input.gov_vouched ? Math.min(100, base + 20) : base
}

export function getTier(score: number): TrustTier {
  if (score >= 91) return 'gov_official'
  if (score >= 55) return 'trusted'
  if (score >= 20) return 'verified'
  return 'unverified'
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
}

// ─── Gemini document analysis ──────────────────────────────────────────────

// Shape returned by analyseDocument() in src/lib/gemini.ts
export interface DocumentAnalysis {
  extracted_name: string | null
  doc_type: DocType | string
  country?: string | null
  institution: string | null
  confidence: number
}
