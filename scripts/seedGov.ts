// Owner: Tao (coordinate with Ray's seed.ts)
// Run: npx tsx scripts/seedGov.ts
// Creates gov hierarchy anchor accounts:
//   L0 — 3 accounts, score 100, organisation: 'Emergency Coalition'
//   L1 — NHS admin (score 95), Met Police (score 95), London Council (score 95)
//
// IMPORTANT: Run this before seed.ts — vouch chains depend on L0/L1 existing.

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { getTier } from '../src/types/index'

function loadEnv(): Record<string, string> {
  const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  const env: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnv()
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

function nodeId(n: number): string {
  return `BLK-${String(n).padStart(5, '0')}-LDN`
}

const GOV_PIN = hashPin('9999')

const L0_ACCOUNTS = [
  { node: 1, name: 'Emergency Coalition Alpha', username: 'coalition_a' },
  { node: 2, name: 'Emergency Coalition Beta',  username: 'coalition_b' },
  { node: 3, name: 'Emergency Coalition Gamma', username: 'coalition_c' },
]

const L1_ACCOUNTS = [
  { node: 10, name: 'NHS Emergency Admin',     username: 'nhs_admin',      org: 'NHS' },
  { node: 11, name: 'Met Police Command',      username: 'met_police',     org: 'Met Police' },
  { node: 12, name: 'London Council Office',   username: 'london_council', org: 'London Council' },
]

export async function seedGovAnchors(): Promise<void> {
  console.log('  Seeding gov anchors...')

  // Wipe existing gov data to allow re-runs
  await supabase.from('gov_anchors').delete().not('id', 'is', null)
  await supabase.from('users').delete().in('node_id', [
    ...L0_ACCOUNTS.map(a => nodeId(a.node)),
    ...L1_ACCOUNTS.map(a => nodeId(a.node)),
  ])

  for (const acc of L0_ACCOUNTS) {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        node_id:      nodeId(acc.node),
        username:     acc.username,
        display_name: acc.name,
        skill:        'Other',
        pin_hash:     GOV_PIN,
        score:        100,
        tier:         'gov_official',
        borough:      'Westminster',
      })
      .select('id')
      .single()

    if (error || !user) { console.error(`  Failed L0 ${acc.name}:`, error?.message); continue }
    await supabase.from('gov_anchors').insert({ user_id: user.id, level: 0, organisation: 'Emergency Coalition' })
    console.log(`  ✓ L0 ${acc.name} (${nodeId(acc.node)})`)
  }

  for (const acc of L1_ACCOUNTS) {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        node_id:      nodeId(acc.node),
        username:     acc.username,
        display_name: acc.name,
        skill:        'Other',
        pin_hash:     GOV_PIN,
        score:        95,
        tier:         'gov_official',
        borough:      'Westminster',
      })
      .select('id')
      .single()

    if (error || !user) { console.error(`  Failed L1 ${acc.name}:`, error?.message); continue }
    await supabase.from('gov_anchors').insert({ user_id: user.id, level: 1, organisation: acc.org })
    console.log(`  ✓ L1 ${acc.name} (${nodeId(acc.node)})`)
  }
}

// Standalone runner
if (process.argv[1]?.endsWith('seedGov.ts')) {
  seedGovAnchors()
    .then(() => { console.log('Gov seed complete.'); process.exit(0) })
    .catch((e) => { console.error(e); process.exit(1) })
}
