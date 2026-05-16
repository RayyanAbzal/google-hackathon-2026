// Owner: Ray/Tao shared
// Exported helper used by scripts/seed.ts
// Do not run separately unless debugging gov anchors only.

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
  env.SUPABASE_SERVICE_ROLE_KEY!,
  { realtime: { transport: class {} as unknown as typeof WebSocket } }
)

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

function nodeId(n: number): string {
  return `BLK-${String(n).padStart(5, '0')}-LDN`
}

const GOV_PASSWORD = hashPassword('govpassword99')

const L0_ACCOUNTS = [
  { node: 1, name: 'Emergency Coalition Alpha', username: 'coalition_a' },
  { node: 2, name: 'Emergency Coalition Beta',  username: 'coalition_b' },
  { node: 3, name: 'Emergency Coalition Gamma', username: 'coalition_c' },
]

const L1_ACCOUNTS = [
  { node: 10, name: 'NHS Emergency Admin',    username: 'nhs_admin',      org: 'NHS' },
  { node: 11, name: 'Met Police Command',     username: 'met_police',     org: 'Met Police' },
  { node: 12, name: 'London Council Office',  username: 'london_council', org: 'London Council' },
]

export async function seedGovAnchors(): Promise<void> {
  console.log('  Seeding gov anchors...')

  await supabase.from('gov_officials').delete().not('id', 'is', null)
  await supabase.from('users').delete().in('node_id', [
    ...L0_ACCOUNTS.map(a => nodeId(a.node)),
    ...L1_ACCOUNTS.map(a => nodeId(a.node)),
  ])

  // ─── L0 Emergency Coalition ────────────────────────────────────────────
  for (const acc of L0_ACCOUNTS) {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        node_id:       nodeId(acc.node),
        username:      acc.username,
        display_name:  acc.name,
        skill:         'Other',
        password_hash: GOV_PASSWORD,
        score:         100,
        tier:          'gov_official',
        borough:       'Westminster',
      })
      .select('id')
      .single()

    if (error || !user) { console.error(`  Failed L0 ${acc.name}:`, error?.message); continue }
    await supabase.from('gov_officials').insert({ user_id: user.id, level: 0, organisation: 'Emergency Coalition' })
    console.log(`  ✓ L0 ${acc.name} (${nodeId(acc.node)})`)
  }

  // ─── L1 Institutional ──────────────────────────────────────────────────
  for (const acc of L1_ACCOUNTS) {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        node_id:       nodeId(acc.node),
        username:      acc.username,
        display_name:  acc.name,
        skill:         'Other',
        password_hash: GOV_PASSWORD,
        score:         95,
        tier:          'gov_official',
        borough:       'Westminster',
      })
      .select('id')
      .single()

    if (error || !user) { console.error(`  Failed L1 ${acc.name}:`, error?.message); continue }
    await supabase.from('gov_officials').insert({ user_id: user.id, level: 1, organisation: acc.org })
    console.log(`  ✓ L1 ${acc.name} (${nodeId(acc.node)})`)
  }
}

// Standalone runner
if (process.argv[1]?.endsWith('seedGov.ts')) {
  seedGovAnchors()
    .then(() => { console.log('Gov seed complete.'); process.exit(0) })
    .catch((e) => { console.error(e); process.exit(1) })
}
