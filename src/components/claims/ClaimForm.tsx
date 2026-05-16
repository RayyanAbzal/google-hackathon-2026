'use client'

// Owner: Hemish
// Claim type selector + file input for doc photo
// Converts to base64, calls POST /api/claims
// Shows loading while Gemini processes
// Shows success (score rose) or error (name mismatch)
// Props: { userId: string, onSuccess: (newScore: number) => void }
export function ClaimForm({
  userId,
  onSuccess,
}: {
  userId: string
  onSuccess: (newScore: number) => void
}) {
  void onSuccess
  return <div>ClaimForm {userId} — TODO (Hemish)</div>
}
