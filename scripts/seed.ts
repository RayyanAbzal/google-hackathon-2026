// Owner: Ray
// Run: npx tsx scripts/seed.ts
// Run with --wipe to reset first: npx tsx scripts/seed.ts --wipe
//
// Creates:
//   - Gov anchors (via seedGov.ts)
//   - Dr. James Osei — BLK-00471-LDN, score 74, Doctor, Southwark
//   - 200 fake Londoners across 20 boroughs (scores 0-94, all skill types)
//
// All seed accounts PIN: 0000 | Gov accounts PIN: 9999

import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
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
  env.SUPABASE_SERVICE_ROLE_KEY!
)

function hashPin(pin: string): string {
  return createHash('sha256').update(pin).digest('hex')
}

function nodeId(n: number): string {
  return `BLK-${String(n).padStart(5, '0')}-LDN`
}

function contentHash(userId: string, docType: string, n: number): string {
  return createHash('sha256').update(`${userId}:${docType}:${n}`).digest('hex')
}

const DEMO_PIN = hashPin('0000')

const BOROUGHS = [
  'Southwark', 'Westminster', 'Hackney', 'Tower Hamlets', 'Lewisham',
  'Greenwich', 'Lambeth', 'Islington', 'Camden', 'Haringey',
  'Newham', 'Wandsworth', 'Bromley', 'Croydon', 'Ealing', 'Enfield',
  'Barnet', 'Brent', 'Waltham Forest', 'Hounslow',
]

const SKILLS = ['Doctor', 'Engineer', 'Legal', 'Builder', 'Nurse', 'Other'] as const

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

function targetScore(i: number): number {
  const bucket = i % 10
  if (bucket < 3) return (i % 3) * 10        // 0, 10, 20 — unverified
  if (bucket < 5) return 30 + (i % 20)        // 30-49 — partial
  if (bucket < 8) return 50 + (i % 35)        // 50-84 — verified
  return 90 + (i % 5)                          // 90-94 — trusted
}

function claimsForScore(score: number): number {
  return Math.min(5, Math.ceil(score / 15))
}

async function insertUser(i: number): Promise<void> {
  const first   = FIRST_NAMES[i % FIRST_NAMES.length]
  const last    = LAST_NAMES[(i * 7 + 3) % LAST_NAMES.length]
  const borough = BOROUGHS[i % BOROUGHS.length]
  const skill   = SKILLS[(i * 3) % SKILLS.length]
  const score   = targetScore(i)
  const tier    = getTier(score)

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      node_id:      nodeId(10001 + i),
      display_name: `${first} ${last}`,
      skill,
      pin_hash:     DEMO_PIN,
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
      node_id:      'BLK-00471-LDN',
      username:     'dr_osei',
      display_name: 'Dr. James Osei',
      skill:        'Doctor',
      pin_hash:     DEMO_PIN,
      score:        74,
      tier:         'verified',
      borough:      'Southwark',
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
    await supabase.from('gov_anchors').delete().not('id', 'is', null)
    await supabase.from('vouches').delete().not('id', 'is', null)
    await supabase.from('claims').delete().not('id', 'is', null)
    await supabase.from('users').delete().not('id', 'is', null)
    console.log('  Wiped.')
  }

  await seedGovAnchors()
  await seedDrOsei()

  console.log('  Seeding 200 Londoners...')
  const BATCH = 20
  for (let i = 0; i < 200; i += BATCH) {
    await Promise.all(
      Array.from({ length: Math.min(BATCH, 200 - i) }, (_, j) => insertUser(i + j))
    )
    process.stdout.write(`  ${Math.min(i + BATCH, 200)}/200\r`)
  }
  console.log('  ✓ 200 Londoners seeded.          ')

  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true })
  console.log(`\n✅ Done — ${count} total users in DB`)
  console.log('   Demo PINs: seed users = 0000 | gov accounts = 9999')
}

seed().catch((e) => { console.error(e); process.exit(1) })
