// Owner: Tao (coordinate with Ray's seed.ts)
// Run: npx tsx scripts/seedGov.ts
// Creates gov hierarchy anchor accounts:
//   L0 — 3 accounts, score 100, organisation: 'Emergency Coalition'
//   L1 — NHS admin (score 95), Met Police (score 95), London Council (score 95)
//
// IMPORTANT: Run this before seed.ts — vouch chains depend on L0/L1 existing.

import { createClient } from '@supabase/supabase-js'
import { getTier } from '../src/types/index'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seedGov() {
  // TODO (Tao): implement gov seeding
  console.log('SeedGov — TODO (Tao)')
}

seedGov().catch(console.error)
