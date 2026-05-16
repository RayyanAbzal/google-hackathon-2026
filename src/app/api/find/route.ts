import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types'

// GET /api/find
// Owner: Tao
// Query params: skill?, resource?, borough?
// Returns: [{ borough, skill, count, avg_score }] — no auth required
export async function GET(): Promise<NextResponse<ApiResponse<null>>> {
  return NextResponse.json({ success: false, data: null, error: 'Not implemented' }, { status: 501 })
}
