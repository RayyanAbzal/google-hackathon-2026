import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// POST /api/vouch/flag
// Owner: Aryan
// Input: { claim_id, flagger_id }
// Returns: { affected_vouchers: number }
export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
