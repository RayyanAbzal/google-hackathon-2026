# API Routes — Aryan + Tao

## Owners
- **Aryan**: auth, claims, vouch, score + Supabase setup
- **Tao**: rate limiting, realtime subscriptions, find (Yellow Pages)
- **Ray**: Gemini Vision, seed script, heatmap components

## Route map

| Route | Owner | Purpose |
|---|---|---|
| `POST /api/auth/register` | Aryan | Create user + validate mandatory doc via Gemini |
| `POST /api/auth/login` | Aryan | Node ID or @username + password auth, return session |
| `PATCH /api/auth/username` | Aryan | Set @username after first login |
| `POST /api/claims` | Aryan | Submit new claim, trigger Gemini Vision |
| `GET /api/claims/[userId]` | Aryan | Get user's claims list |
| `POST /api/vouch` | Aryan | Mutual vouch — update both scores |
| `POST /api/vouch/flag` | Aryan | Flag a claim as fraudulent, trigger penalty |
| `GET /api/score/[userId]` | Aryan | Get current trust score + tier |
| `GET /api/users/[username]` | Aryan | Get public profile (requires auth) |
| `GET /api/find` | Tao | Yellow Pages search — skill OR resource, by borough |

## Rules
- Every route returns `ApiResponse<T>` from `src/types/index.ts`
- Use `src/lib/supabase.ts` for DB — do not create new clients
- Rate limit: 5 vouches per 24h, 3 claims per 10 min (Tao implements middleware)
- Never return raw Supabase errors to the client — wrap in `{ success: false, error: 'message' }`
- Validate input at route level

## Score calc
Use `calculateScore()` and `getTier()` from `src/types/index.ts`. Do not implement score logic inline.

Score thresholds: 0-29 Unverified, 30-49 Partial, 50-89 Verified, 90-94 Trusted, 95+ Gov Official

## Anti-scam (backend only)
- Name consistency: Gemini returns `extracted_name` — compare against `user.display_name`
- Doc dedup: hash claim content before insert, reject if hash exists for this user
- Penalty: when a claim is flagged, find all vouchers of that user and subtract 15pts each
