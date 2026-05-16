# Session Handoff

Copy this block at the start of each new session to restore context fast.

---

## Current state

**Branch:** dev
**Last commit:** `fix(scripts): correct gov_anchors table name in seed scripts`
**Demo status:** Backend API done, all 10 pages built, wiring tasks + seed remaining
**Vercel:** Live at https://google-hackathon-gamma.vercel.app (all env vars set, auto-deploys on push to dev)

## What was completed (sessions 1–11)

- DB schema live: `users`, `claims`, `vouches`, `gov_anchors` (all RLS enabled)
- All 9 Aryan API routes implemented and merged to dev
- All 10 frontend pages built (Tactical Resilience dark theme, inline SVG, shadcn/ui)
- D3 heatmap + skill pins implemented
- Gemini integration: `analyseDocument()` in `src/lib/gemini.ts`
- `scripts/seed.ts` + `scripts/seedGov.ts` written and fixed (gov_anchors correct)
- RLS policies confirmed active (Ray via Supabase MCP, 2026-05-16)
- Architecture, decisions, and CI docs added

## What is in progress / blocked

- **Maalav** 🔴: auth guards on protected pages + real session data in pages (anyone can access /dashboard now)
- **Tao** 🔴: `GET /api/find` not started (blocks Yellow Pages demo step)
- **Hemish** 🟡: wire dashboard evidence cards → `GET /api/claims/[userId]`; wire vouch confirm → `POST /api/vouch`
- **Maalav** 🟡: wire add-evidence submit → `POST /api/claims`
- **Aryan** 🟡: enable Realtime on `users` table in Supabase dashboard
- **Ray** 🟡: run seed scripts (waiting on Aryan enabling Realtime first)

## Next action (first thing to do in new session)

1. Check if Aryan enabled Realtime — Supabase dashboard > Database > Replication > Tables > users
2. If yes: `npx tsx scripts/seedGov.ts && npx tsx scripts/seed.ts`
3. Verify 200+ rows in Supabase dashboard and Dr. Osei (BLK-00471-LDN) present

## Known issues / watch-outs

- Table name is `gov_anchors` NOT `gov_officials` — both seed scripts and migration are now aligned; do not revert
- Pages use inline styles for colours (`#b0c6ff`, `#40e56c`) — do not switch to Tailwind classes for colour values
- Hardcoded session data: "Sarah Mitchell / BLK-0471-LDN / score 55" everywhere — Maalav must wire real session before demo
- GEMINI_API_KEY is in `.env.local` (not committed) — confirm it is present before seeding

## Seed status

- [ ] Seed run against current DB
- Seed order: `npx tsx scripts/seedGov.ts` THEN `npx tsx scripts/seed.ts`
- Wipe and re-seed: `npx tsx scripts/seed.ts --wipe`
- Verify: Dr. Osei node_id `BLK-00471-LDN`, score 74, borough Southwark
- Demo passwords: `password123` (seed users) / `govpassword99` (gov accounts)

## Fallback toggle

`USE_FALLBACKS=true` in `.env.local` — flip if Gemini or Supabase fails during demo.
Mock data in `src/lib/fallbacks.ts` covers all external services.
