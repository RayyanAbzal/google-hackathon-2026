import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// POST /api/vouch
// Owner: Aryan
// Input: { voucher_id, vouchee_id }
// Returns: { voucher_score, vouchee_score }
export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
