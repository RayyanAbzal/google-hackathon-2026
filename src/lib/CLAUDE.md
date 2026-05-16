# Lib — Ray (owner)

## Owner: Ray
Shared utilities and service integrations. All team members can read. Only Ray modifies.

## Files

| File | Purpose |
|---|---|
| `supabase.ts` | Supabase client. Ray sets up schema + RLS. Do not create new clients. |
| `gemini.ts` | Gemini Vision integration. Document reading + name extraction. |
| `trust.ts` | Trust score utilities — wraps types/index.ts helpers |
| `fallbacks.ts` | Mock data for USE_FALLBACKS=true. Keep updated as features are added. |
| `utils.ts` | Generic utils (cn, formatDate, etc.) |
| `seed.ts` | Demo seed script — Ray runs before demo. Produces 200 fake users + gov anchors. |

## Gemini Vision — how to call

```typescript
import { analyseDocument } from '@/lib/gemini'

const result = await analyseDocument(imageBase64, 'passport')
// returns: { extracted_name, doc_type, confidence, institution }
```

## Supabase — tables (Ray creates these)

- `users` — id, node_id, username, display_name, skill, score, tier, borough, pin_hash, created_at
- `claims` — id, user_id, type, status, doc_type, extracted_name, confidence, vouches, flags
- `vouches` — id, voucher_id, vouchee_id, created_at
- `help_posts` — id, author_id, content, skill_tag, resource_tag, borough, urgency, expires_at
- `gov_anchors` — id, user_id, level, organisation

## Fallbacks
Toggle `USE_FALLBACKS=true` in `.env.local` if Gemini or Supabase is down during demo.
Mock data in `fallbacks.ts` must match real data shapes.
