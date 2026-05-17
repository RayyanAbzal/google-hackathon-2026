import { supabaseAdmin } from '@/lib/supabase'
import type { ApiResponse } from '@/types'

export interface YPListingRow {
  nodeId: string
  username: string | null
  skill: string
  borough: string
  tier: string
  score: number
  credentials: string[]
  totalVouches: number
  claimCount: number
}

const PROFESSIONAL_DOC_TYPES = new Set(['degree', 'nhs_card', 'employer_letter', 'professional_cert'])

interface ClaimRow {
  doc_type: string
  status: string
  vouches: number
}

interface RawUserRow {
  node_id: string
  username: string | null
  skill: string | null
  borough: string | null
  tier: string | null
  score: number | null
  claims: ClaimRow[]
}

export async function GET(): Promise<Response> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('node_id, username, skill, borough, tier, score, claims(doc_type, status, vouches)')
    .in('tier', ['trusted', 'gov_official'])
    .neq('borough', '')
    .neq('skill', 'Other')
    .limit(1000)

  if (error) {
    return Response.json(
      { success: false, error: 'Failed to fetch listings' } satisfies ApiResponse<YPListingRow[]>,
      { status: 500 }
    )
  }

  const rows: YPListingRow[] = (data as RawUserRow[]).map(u => {
    const verifiedClaims = (u.claims ?? []).filter(c => c.status === 'verified')
    const credentials = [...new Set(
      verifiedClaims.map(c => c.doc_type).filter(d => PROFESSIONAL_DOC_TYPES.has(d))
    )]
    const totalVouches = verifiedClaims.reduce((sum, c) => sum + (c.vouches ?? 0), 0)

    return {
      nodeId: u.node_id,
      username: u.username,
      skill: u.skill ?? 'Other',
      borough: u.borough ?? '',
      tier: u.tier ?? 'verified',
      score: u.score ?? 0,
      credentials,
      totalVouches,
      claimCount: verifiedClaims.length,
    }
  })

  return Response.json({ success: true, data: rows } satisfies ApiResponse<YPListingRow[]>)
}
