# Scripts — Owner: Ray (seed.ts) + Tao (seedGov.ts)

## Run order (critical)

1. `npx tsx scripts/seedGov.ts` — creates L0/L1 gov anchors first
2. `npx tsx scripts/seed.ts` — creates 200 fake Londoners, vouch chains depend on gov anchors

## seed.ts (Ray)

Creates:
- 3 L0 Emergency Coalition accounts (score 100)
- L1 accounts: NHS admin, Met Police, London Council (score 95)
- Dr. James Osei — node_id BLK-00471-LDN, score 74, Doctor, Southwark, pre-vouched
- 200 fake Londoners across all 32 London boroughs
  - Scores 30-90, all skill types
  - Vouch chains so map looks populated
  - Pre-built vouch relationships

## seedGov.ts (Tao)

Creates only L0 + L1 accounts (extracted from seed.ts to avoid conflict).
Coordinate with Ray — gov IDs need to be stable so vouch chains reference them.

## Env vars required

Script needs `SUPABASE_SERVICE_ROLE_KEY` (not anon key) — add to `.env.local`.
Run with: `npx tsx scripts/seed.ts` (tsx reads .env.local automatically via next/env).

## Demo prep

Re-run seed script with `--wipe` flag before demo to reset to clean state.
Check Supabase dashboard: users table should show 200+ rows.
