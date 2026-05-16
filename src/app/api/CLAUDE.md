# API Routes — Backend Owners: Aryan + Tao

## Aryan owns (core auth + identity)
- `auth/register/` `auth/login/` `auth/username/`
- `claims/` `claims/[userId]/`
- `vouch/` `vouch/flag/`
- `users/[username]/`
- `score/[userId]/`

## Tao owns (features + rate limiting)
- `find/`
- `help/`
- Rate limiting via `src/middleware.ts` (must stay at that path for Next.js to pick it up)

## Rules — apply to every route

- Return envelope always: `{ success: boolean, data: T | null, error: string | null }`
- Use `calculateScore()` and `getTier()` from `src/types/index.ts` — never redefine
- Use `supabase` from `src/lib/supabase.ts` — never create a new client
- Never expose raw Supabase errors — catch and return `{ success: false, error: 'Something went wrong' }`
- All write routes require auth (check session header or body — coordinate with Maalav)
- `zod` for input validation at every route boundary

## Dependency chain

1. Ray creates DB schema + env vars (do this first — everyone else is blocked)
2. Aryan implements auth routes (register, login)
3. Maalav can build register/login pages once step 2 is done
4. Tao can implement rate limiting middleware once Aryan's routes exist
