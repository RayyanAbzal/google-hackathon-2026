// Owner: Ray
// Run: npx tsx scripts/seed.ts
// Run with --wipe to reset first: npx tsx scripts/seed.ts --wipe
//
// Creates:
//   - Gov anchors (via seedGov.ts)
//   - Dr. James Osei — BLK-00471-LDN, score 74, Doctor, Southwark
//   - 200 fake Londoners across 20 boroughs (scores 0-94, all skill types)
//
// All seed accounts password: password123 | Gov accounts password: govpassword99

import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes, scryptSync } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { getTier } from '../src/types/index'
import { seedGovAnchors } from './seedGov'

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
  const salt = randomBytes(16).toString('hex')
  const key = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${key}`
}

function nodeId(n: number): string {
  return `BLK-${String(n).padStart(5, '0')}-LDN`
}

function contentHash(userId: string, docType: string, n: number): string {
  return createHash('sha256').update(`${userId}:${docType}:${n}`).digest('hex')
}

const DEMO_PASSWORD = hashPassword('password123')

// borough -> target user count. Variation drives heatmap density contrast.
const BOROUGH_DENSITY: Record<string, number> = {
  // Inner / hot (dense central London)
  'Westminster': 48,
  'Camden': 42,
  'Tower Hamlets': 40,
  'Hackney': 38,
  'Southwark': 36,
  'Lambeth': 34,
  'Islington': 32,
  'Kensington and Chelsea': 28,
  // Mid (inner ring + busy outer)
  'Newham': 24,
  'Hammersmith and Fulham': 22,
  'Wandsworth': 22,
  'Lewisham': 20,
  'Haringey': 18,
  'Greenwich': 18,
  'Waltham Forest': 16,
  'Brent': 16,
  'Ealing': 16,
  'Barnet': 14,
  'Croydon': 14,
  // Low (outer suburbs)
  'Enfield': 10,
  'Redbridge': 9,
  'Hounslow': 8,
  'Merton': 7,
  'Richmond upon Thames': 6,
  'Hillingdon': 6,
  'Bromley': 6,
  'Harrow': 5,
  'Barking and Dagenham': 5,
  'Kingston upon Thames': 4,
  'Sutton': 4,
  'Bexley': 4,
  'Havering': 3,
  'City of London': 3,
}

const BOROUGHS: string[] = Object.keys(BOROUGH_DENSITY)

type Skill = 'Doctor' | 'Engineer' | 'Legal' | 'Builder' | 'Nurse' | 'Other'

const FIRST_NAMES = [
  'James', 'Sarah', 'Michael', 'Fatima', 'David', 'Priya', 'John', 'Amara',
  'Richard', 'Zoe', 'Emmanuel', 'Chloe', 'Kwame', 'Lucy', 'Marcus', 'Aisha',
  'Oliver', 'Nadia', 'Thomas', 'Grace', 'Daniel', 'Yemi', 'Robert', 'Helena',
  'Samuel', 'Mei', 'Christopher', 'Fatou', 'Andrew', 'Iris',
]

const LAST_NAMES = [
  'Mitchell', 'Osei', 'Patel', 'Williams', 'Ahmed', 'Thompson', 'Clarke',
  'Johnson', 'Adeyemi', 'Brown', 'Singh', 'Davies', 'Okonkwo', 'Taylor',
  'Chen', 'Anderson', 'Mensah', 'Wilson', 'Sharma', 'Moore',
  'Diallo', 'Martin', 'Park', 'White', 'Harris', 'Lewis', 'Jackson',
]

const DOC_TYPES = ['passport', 'degree', 'employer_letter', 'nhs_card', 'driving_licence']

// Per-borough recipe: deterministic skill + score mix so every borough
// renders with full skill variety and a trusted/verified/unverified spread.
interface Slot { skill: Skill; score: number }

// Pool of slot templates. Per-borough we sample N from this pool so that:
//   - small boroughs still get >=1 trusted + variety
//   - large boroughs scale up across all skills/tiers proportionally
const SLOT_POOL: Slot[] = [
  // trusted (>=55) — 19% of pool
  { skill: 'Doctor',   score: 72 },
  { skill: 'Nurse',    score: 64 },
  { skill: 'Legal',    score: 60 },
  { skill: 'Doctor',   score: 58 },
  // verified (20-54) — 44% of pool
  { skill: 'Builder',  score: 42 },
  { skill: 'Engineer', score: 48 },
  { skill: 'Other',    score: 28 },
  { skill: 'Other',    score: 35 },
  { skill: 'Builder',  score: 24 },
  { skill: 'Engineer', score: 52 },
  { skill: 'Nurse',    score: 46 },
  { skill: 'Legal',    score: 38 },
  { skill: 'Doctor',   score: 30 },
  // unverified (0-19) — 38% of pool
  { skill: 'Other',    score: 0 },
  { skill: 'Other',    score: 5 },
  { skill: 'Builder',  score: 10 },
  { skill: 'Engineer', score: 15 },
  { skill: 'Legal',    score: 18 },
  { skill: 'Doctor',   score: 12 },
  { skill: 'Nurse',    score: 8 },
]

function slotsForBorough(count: number): Slot[] {
  const out: Slot[] = []
  // Guarantee >=1 trusted Doctor in any borough with count >= 1
  if (count > 0) out.push({ skill: 'Doctor', score: 72 })
  if (count > 2) out.push({ skill: 'Nurse',  score: 64 })
  if (count > 4) out.push({ skill: 'Legal',  score: 60 })
  while (out.length < count) {
    out.push(SLOT_POOL[out.length % SLOT_POOL.length])
  }
  return out.slice(0, count)
}

function claimsForScore(score: number): number {
  return Math.min(5, Math.ceil(score / 15))
}

async function insertUser(globalIdx: number, borough: string, slot: Slot): Promise<void> {
  const i       = globalIdx
  const first   = FIRST_NAMES[i % FIRST_NAMES.length]
  const last    = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length]
  const skill   = slot.skill
  const score   = slot.score
  const tier    = getTier(score)

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      node_id:       nodeId(10001 + i),
      display_name:  `${first} ${last}`,
      skill,
      password_hash: DEMO_PASSWORD,
      score,
      tier,
      borough,
    })
    .select('id')
    .single()

  if (error || !user) { console.error(`  Failed user ${i}:`, error?.message); return }

  const numClaims = claimsForScore(score)
  for (let c = 0; c < numClaims; c++) {
    const docType = DOC_TYPES[c % DOC_TYPES.length]
    await supabase.from('claims').insert({
      user_id:        user.id,
      type:           c === 0 ? 'identity' : c === 1 ? 'credential' : 'work',
      status:         'verified',
      doc_type:       docType,
      extracted_name: `${first} ${last}`,
      confidence:     0.95,
      content_hash:   contentHash(user.id, docType, c),
    })
  }
}

async function seedDrOsei(): Promise<void> {
  console.log('  Seeding Dr. James Osei...')
  await supabase.from('users').delete().eq('node_id', 'BLK-00471-LDN')

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      node_id:       'BLK-00471-LDN',
      username:      'dr_osei',
      display_name:  'Dr. James Osei',
      skill:         'Doctor',
      password_hash: DEMO_PASSWORD,
      score:         74,
      tier:          getTier(74),
      borough:       'Southwark',
    })
    .select('id')
    .single()

  if (error || !user) { console.error('  Failed Dr. Osei:', error?.message); return }

  const docs = ['passport', 'degree', 'employer_letter', 'nhs_card']
  for (let i = 0; i < docs.length; i++) {
    await supabase.from('claims').insert({
      user_id:        user.id,
      type:           i === 0 ? 'identity' : i === 1 ? 'credential' : 'work',
      status:         'verified',
      doc_type:       docs[i],
      extracted_name: 'Dr. James Osei',
      confidence:     0.97,
      content_hash:   contentHash(user.id, docs[i], i),
    })
  }
  console.log('  ✓ Dr. James Osei (BLK-00471-LDN, Southwark, score 74)')
}

async function seed(): Promise<void> {
  const wipe = process.argv.includes('--wipe')
  console.log('🌱 CivicTrust seed starting...')

  if (wipe) {
    console.log('  --wipe: clearing all data...')
    await supabase.from('gov_officials').delete().not('id', 'is', null)
    await supabase.from('vouches').delete().not('id', 'is', null)
    await supabase.from('claims').delete().not('id', 'is', null)
    await supabase.from('users').delete().not('id', 'is', null)
    console.log('  Wiped.')
  }

  await seedGovAnchors()
  await seedDrOsei()

  let idx = 0
  const jobs: Array<{ borough: string; slot: Slot; idx: number }> = []
  for (const borough of BOROUGHS) {
    const count = BOROUGH_DENSITY[borough]
    for (const slot of slotsForBorough(count)) {
      jobs.push({ borough, slot, idx: idx++ })
    }
  }
  const total = jobs.length
  console.log(`  Seeding ${total} Londoners across ${BOROUGHS.length} boroughs (density-weighted)...`)
  const BATCH = 20
  for (let i = 0; i < jobs.length; i += BATCH) {
    const chunk = jobs.slice(i, i + BATCH)
    await Promise.all(chunk.map((j) => insertUser(j.idx, j.borough, j.slot)))
    process.stdout.write(`  ${Math.min(i + BATCH, jobs.length)}/${jobs.length}\r`)
  }
  console.log(`  ✓ ${total} Londoners seeded.          `)

  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
  console.log(`\n✅ Done — ${count} total users in DB`)
  console.log('   Demo passwords: seed users = password123 | gov accounts = govpassword99')
}

seed().catch((e) => { console.error(e); process.exit(1) })
