import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// POST /api/claims
// Owner: Aryan
// Input: { user_id, type, doc_image_base64, doc_type }
// Returns: { claim_id, score, tier }
export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
