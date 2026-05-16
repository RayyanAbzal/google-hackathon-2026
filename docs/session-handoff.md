# Session Handoff Template

Paste a filled copy of this at the start of each new session to restore context fast.
Current state lives in `WORKLOG.md`.

---

## Current state

**Branch:** `<branch>`
**Last commit:** `<hash> <message>`
**Demo status:** `<what works end-to-end / what is broken>`
**Vercel:** `<live URL or "not deployed">`

## Completed since last session

- 

## In progress / blocked

| Person | Status | Task |
|--------|--------|------|
|        | 🔴     |      |
|        | 🟡     |      |
|        | 🟢     |      |

## Next action (first thing in new session)

1. 

## Known issues / watch-outs

- 

## Seed status

- [ ] Seed run against current DB
- Seed order: `npx tsx scripts/seedGov.ts` THEN `npx tsx scripts/seed.ts`
- Wipe and re-seed: `npx tsx scripts/seed.ts --wipe`
- Demo passwords: `password123` (seed users) / `govpassword99` (gov accounts)

## Fallback toggle

`USE_FALLBACKS=true` in `.env.local` — flip if Gemini or Supabase fails during demo.
