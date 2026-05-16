import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// POST /api/help  — Owner: Tao
// Input: { author_id, content, skill_tag, resource_tag, borough, urgency }
// Returns: { post_id }

// GET /api/help   — Owner: Tao
// Query params: borough?
// Returns: active (non-expired) help posts — requires auth
export async function POST(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}

export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
