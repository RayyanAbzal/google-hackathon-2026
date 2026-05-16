import { supabase } from '@/lib/supabase'
import type { TrustTier } from '@/types'

export interface ScoreUpdate {
  score: number
  tier: TrustTier
}

// Subscribe to score/tier changes for a specific user.
// Returns an unsubscribe function — call it on component unmount.
export function subscribeToUserScore(
  userId: string,
  onUpdate: (update: ScoreUpdate) => void
): () => void {
  const channel = supabase
    .channel(`user-score-${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`,
      },
      (payload) => {
        const row = payload.new as { score: number; tier: TrustTier }
        onUpdate({ score: row.score, tier: row.tier })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
