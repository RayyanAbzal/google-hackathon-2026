import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// POST /api/auth/login
// Owner: Aryan
// Input: { identifier, pin } — identifier is node_id OR @username
// Returns: { node_id, username, display_name, score, tier, skill }
export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
