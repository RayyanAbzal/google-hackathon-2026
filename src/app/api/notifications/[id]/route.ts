import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { ApiResponse, Notification } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const { data: notification } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (!notification || notification.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' } as ApiResponse<never>,
        { status: 404 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to update notification' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data as Notification,
    } as ApiResponse<Notification>)
  } catch (err) {
    console.error('Error updating notification:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } as ApiResponse<never>,
        { status: 401 }
      )
    }

    const { data: notification } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (!notification || notification.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' } as ApiResponse<never>,
        { status: 404 }
      )
    }

    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete notification' } as ApiResponse<never>,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: null,
    } as ApiResponse<null>)
  } catch (err) {
    console.error('Error deleting notification:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' } as ApiResponse<never>,
      { status: 500 }
    )
  }
}
