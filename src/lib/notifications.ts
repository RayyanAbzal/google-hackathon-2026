import { CreateNotificationPayload, Notification } from '@/types'
import { supabaseAdmin } from '@/lib/supabase'

export async function createNotification(
  payload: CreateNotificationPayload
): Promise<Notification | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        detail: payload.detail,
        icon: payload.icon,
        color: payload.color,
        related_user_id: payload.related_user_id || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return null
    }

    return data as Notification
  } catch (err) {
    console.error('Error creating notification:', err)
    return null
  }
}
