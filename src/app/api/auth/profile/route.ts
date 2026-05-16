import { supabaseAdmin } from '@/lib/supabase'
import { verifyAuth } from '@/lib/auth'
import type { ApiResponse } from '@/types'

interface ProfileBody {
  display_name: string
}

export async function PATCH(request: Request): Promise<Response> {
  const user = await verifyAuth(request)
  if (!user) {
    return Response.json({ success: false, error: 'Unauthorized' } satisfies ApiResponse<never>, { status: 401 })
  }

  let body: ProfileBody
  try {
    body = await request.json()
  } catch {
    return Response.json({ success: false, error: 'Invalid JSON' } satisfies ApiResponse<never>, { status: 400 })
  }

  const displayName = body.display_name?.trim()
  if (!displayName) {
    return Response.json({ success: false, error: 'display_name is required' } satisfies ApiResponse<never>, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ display_name: displayName })
    .eq('id', user.id)

  if (error) {
    return Response.json({ success: false, error: 'Failed to update display name' } satisfies ApiResponse<never>, { status: 500 })
  }

  return Response.json({ success: true, data: { display_name: displayName } } satisfies ApiResponse<{ display_name: string }> )
}
