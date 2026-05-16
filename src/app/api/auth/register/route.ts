import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// POST /api/auth/register
// Owner: Aryan
// Input: { display_name, pin, skill, doc_image_base64, doc_type }
// Returns: { node_id, display_name, score: 0 }
export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
