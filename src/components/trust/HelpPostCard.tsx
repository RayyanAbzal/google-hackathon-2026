'use client'

import type { HelpPost } from '@/types'

// Owner: Hemish
// Post card: content, tags, area, urgency badge, time
// "Respond" button shown only if canRespond (score >= 50)
// Props: { post: HelpPost, canRespond: boolean }
export function HelpPostCard({ post, canRespond }: { post: HelpPost; canRespond: boolean }) {
  return <div>HelpPostCard {post.borough} {canRespond ? '(can respond)' : ''} — TODO (Hemish)</div>
}
