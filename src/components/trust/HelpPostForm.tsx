'use client'

// Owner: Hemish
// Text area + skill/resource selector + borough + urgency
// Calls POST /api/help on submit
// Props: { authorId: string, onSuccess: () => void }
export function HelpPostForm({
  authorId,
  onSuccess,
}: {
  authorId: string
  onSuccess: () => void
}) {
  return <div>HelpPostForm {authorId} — TODO (Hemish)</div>
}
