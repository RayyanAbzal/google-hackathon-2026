// Owner: Ray
// Run: npx tsx scripts/seed.ts
// Creates:
//   - 3 gov anchor accounts (L0 Emergency Coalition + L1 NHS/Police/Council)
//   - Dr. James Osei — score 74, Doctor, Southwark, pre-vouched
//   - 200 fake Londoners across all boroughs (scores 30-90, skill tags, vouch chains)
//
// Coordinate with scripts/seedGov.ts (Tao) — gov anchors must be created first.
// Run this before any demo. Check Supabase dashboard to verify rows appeared.

import { createClient } from '@supabase/supabase-js'
import { calculateScore, getTier } from '../src/types/index'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  // TODO (Ray): implement seed
  console.log('Seed script — TODO (Ray)')
}

seed().catch(console.error)
