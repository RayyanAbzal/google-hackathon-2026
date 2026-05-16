// ─── Unions ───────────────────────────────────────────────────────────────────

export type TrustTier = 'unverified' | 'verified' | 'trusted' | 'gov_official'

export type Skill = 'Doctor' | 'Engineer' | 'Legal' | 'Builder'

export type ClaimType = 'identity' | 'credential' | 'work'

export type DocType =
  | 'passport'
  | 'driving_licence'
  | 'degree'
  | 'medical_licence'
  | 'employer_letter'
  | 'company_id'
  | 'national_id'

export type Urgency = 'low' | 'medium' | 'high'

export type ClaimStatus = 'pending' | 'verified' | 'rejected'

// ─── DB Interfaces (mirror SQL schema exactly) ────────────────────────────────

export interface User {
  id: string
  node_id: string
  username: string | null
  display_name: string
  skill: Skill
  pin_hash: string
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
  doc_type: DocType
  extracted_name: string | null
  extracted_institution: string | null
  confidence: number | null
  content_hash: string | null
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
  author_id: string
  content: string
  skill_tag: Skill | null
  resource_tag: string | null
  borough: string
  urgency: Urgency
  expires_at: string
  created_at: string
}

export interface GovAnchor {
  id: string
  user_id: string
  level: number
  organisation: string
}

// ─── API envelope ─────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: string | null
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number
    page: number
    limit: number
  }
}

// ─── Client session (stored in localStorage as civictrust_session) ────────────

export interface Session {
  node_id: string
  username: string | null
  display_name: string
  score: number
  tier: TrustTier
  skill: Skill
}

// ─── Gemini document analysis result ─────────────────────────────────────────

export interface DocumentAnalysis {
  extracted_name: string | null
  doc_type: DocType
  confidence: number
  institution: string | null
}

// ─── Score logic (single source of truth — import from here, never redefine) ──

export function calculateScore(claimsVerified: number, vouchesReceived: number): number {
  return Math.min(100, claimsVerified * 15 + vouchesReceived * 10)
}

export function getTier(score: number): TrustTier {
  if (score >= 95) return 'gov_official'
  if (score >= 90) return 'trusted'
  if (score >= 50) return 'verified'
  return 'unverified'
}
