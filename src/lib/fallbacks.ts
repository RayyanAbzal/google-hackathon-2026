import type { User, Claim, HelpPost, DocumentAnalysis } from '@/types'

export const USE_FALLBACKS = process.env.USE_FALLBACKS === 'true'

// ─── Fallback document analysis (used when Gemini API is down) ────────────────

export const FALLBACK_DOCUMENT_ANALYSIS: DocumentAnalysis = {
  extracted_name: 'Sarah Mitchell',
  doc_type: 'passport',
  confidence: 0.95,
  institution: null,
}

// ─── Fallback users (200 seeded — use seed script for the real thing) ─────────

export const FALLBACK_USERS: Partial<User>[] = [
  {
    node_id: 'BLK-00471-LDN',
    username: 'dr_osei',
    display_name: 'Dr. James Osei',
    skill: 'Doctor',
    score: 74,
    tier: 'verified',
    borough: 'Southwark',
  },
  {
    node_id: 'BLK-00001-LDN',
    username: 'nhs_admin',
    display_name: 'NHS Emergency Admin',
    skill: 'Doctor',
    score: 95,
    tier: 'gov_official',
    borough: 'Westminster',
  },
]

// ─── Fallback claims ──────────────────────────────────────────────────────────

export const FALLBACK_CLAIMS: Partial<Claim>[] = [
  {
    type: 'credential',
    status: 'verified',
    doc_type: 'degree',
    extracted_name: 'Dr. James Osei',
    extracted_institution: 'UCL Medicine',
    confidence: 0.92,
    vouches: 3,
    flags: 0,
  },
]

// ─── Fallback help posts ──────────────────────────────────────────────────────

export const FALLBACK_HELP_POSTS: Partial<HelpPost>[] = [
  {
    content: 'Need insulin — elderly neighbour, critical',
    skill_tag: 'Doctor',
    resource_tag: null,
    borough: 'Southwark',
    urgency: 'high',
  },
]

export function withFallback<T>(live: T, fallback: T): T {
  return USE_FALLBACKS ? fallback : live
}
