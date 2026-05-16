import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// GET /api/claims/[userId]
// Owner: Aryan
// Returns: all claims for a user with vouch counts — requires auth
export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
