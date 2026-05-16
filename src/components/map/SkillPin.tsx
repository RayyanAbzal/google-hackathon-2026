'use client'

import type { Skill } from '@/types'

// Owner: Ray
// Coloured circle per skill: green=Doctor, blue=Engineer, purple=Legal, amber=Builder
// Click -> opens profile card (if logged in)
// Props: { skill: Skill, lat: number, lng: number, username: string }
export function SkillPin({
  skill,
  username,
}: {
  skill: Skill
  lat: number
  lng: number
  username: string
}) {
  return <div>SkillPin {skill} {username} — TODO (Ray)</div>
}
