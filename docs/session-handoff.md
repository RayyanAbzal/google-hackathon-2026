# Session Handoff Template

Copy this block at the start of each new session to restore context fast.

---

## Current state

**Branch:** [branch name]
**Last commit:** [message]
**Demo status:** [phases complete / phases remaining]

## What was completed this session

- [task 1]
- [task 2]

## What is in progress / blocked

- [task] — blocked on: [reason]

## Next action (first thing to do in new session)

1. [specific file:line or command]

## Known issues / watch-outs

- [thing to not break]
- [API key / env var that needs checking]

## Seed status

- [ ] Seed run against current DB
- Seed command: `npx tsx scripts/seed.ts`
- Gov seed: `npx tsx scripts/seedGov.ts`
- Demo passwords: `password123` (users) / `govpassword99` (gov accounts)

## Fallback toggle

`USE_FALLBACKS=true` in `.env.local` — flip if Gemini or Supabase fails during demo.
