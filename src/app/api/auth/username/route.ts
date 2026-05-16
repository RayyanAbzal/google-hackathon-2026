import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// PATCH /api/auth/username
// Owner: Aryan
// Input: { node_id, username } — requires auth
// Returns: { username }
export async function PATCH(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
