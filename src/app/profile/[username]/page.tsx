import { redirect } from 'next/navigation'

// Profile is now the Dashboard — redirect for backwards compat
export default function ProfilePage() {
  redirect('/dashboard')
}
