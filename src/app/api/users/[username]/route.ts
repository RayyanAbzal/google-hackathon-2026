import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// GET /api/users/[username]
// Owner: Aryan
// Returns: public profile — requires auth
export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
