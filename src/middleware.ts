// Owner: Tao
// Rate limiting middleware — runs before all /api/* routes
// Enforces:
//   - Max 5 vouches per user per 24h (check vouches table)
//   - Max 3 claim submissions per user per 10 min (check claims table)
// Return 429 + { success: false, error: 'Rate limit exceeded' } if breached
//
// Next.js requires this file at src/middleware.ts (not in a subdirectory).

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // TODO (Tao): implement rate limiting
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
