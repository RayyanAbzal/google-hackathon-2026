# CivicTrust — Project Context

Post-BLACKOUT identity/trust system. Physical docs + community vouching replace destroyed digital records. Trust score (0-100) gates access. London borough heatmap shows community trust density.

See `docs/architecture.md` for stack and layer ownership. See `docs/decisions.md` for ADRs.

## Module map

| Path | CLAUDE.md |
|------|-----------|
| `src/app/` | `src/app/CLAUDE.md` — pages, routing, layout |
| `src/app/api/` | `src/app/api/CLAUDE.md` — API routes, auth, Supabase |
| `src/components/` | `src/components/CLAUDE.md` — UI components |
| `src/lib/` | `src/lib/CLAUDE.md` — scoring, Gemini, Supabase client |
| `scripts/` | `scripts/CLAUDE.md` — seed scripts |

## Hackathon mode

Speed over perfection. See `AGENTS.md` for full rules. Key constraints:
- No test coverage requirement
- shadcn/ui only — no hand-rolled primitives
- `USE_FALLBACKS=true` in `.env.local` if external APIs fail (see `src/lib/fallbacks.ts`)

## Skills — trigger phrases

- "ready to commit" / "final check" / "can I deploy" → `ship-check`
- "review this" / "check my code" → `code-review`
- "adding auth" / "touching RLS" / "new API route" → `security-review`
- "add endpoint" / "create route" / "new API" → `add-api-route`
- "record decision" / "add ADR" → `documentation-and-adrs`

## Token efficiency

Disable `claude-plugins-official` for research-only sessions (saves ~40 skills from context).

---

## ✅ SESSION HANDOFF — Aryan (backend)

### Branch state
- Current branch: `aryan` — fully in sync with `dev` as of this session
- All commits pushed to both `aryan` and `dev`

### What was done this session
- **Gemini fixed**: model updated `gemini-2.0-flash` → `gemini-2.5-flash` (old model deprecated); markdown fence stripping added to JSON parse
- **Trust score integrated**: dashboard now fetches live score from `/api/score/[userId]` on mount — catches vouches received since last login
- **Borough added to Session type** and returned by login route — dashboard no longer hardcodes "Southwark, London"
- **Evidence section**: removed fake `FALLBACK_EVIDENCE`, shows real claims or empty state for new users
- **Add-evidence**: step 3 shows real session name, step 4 shows correct points (+20 passport, +15 others)
- **Register route**: skill + borough now optional with defaults (Other/Westminster) — form doesn't send them
- **`HelpPost` type error** fixed in `fallbacks.ts` (was breaking build)
- **Font fix**: Material Symbols loaded via `<link>` tags in `layout.tsx` — removes CSS `@import` ordering error in Turbopack dev server
- **MeshGraph hydration fix**: coordinates rounded to 2dp so SSR and client produce identical values
- **`GET /api/users/node/[nodeId]`**: new route for vouch page to resolve scanned node IDs (merged conflict with Maalav who added same route)
- **All 10 routes smoke tested** end-to-end and passing

### What's next for Aryan (pick one)
1. **Score breakdown endpoint** — extend `/api/score/[userId]` to return `{ score, tier, passport_count, other_doc_count, vouches_received, gov_vouched }` so dashboard can show "how" the score is calculated
2. **Fix double-request auth** — `protectedFetch` in `src/app/_lib/session.ts` sends `user_id` first (→ 401), then retries with token. Change to send token directly to halve API call count
3. **Lower `/api/find` threshold** — currently `score >= 50` (excludes verified users 20–49). Lower to `>= 20` for more Yellow Pages results

### Key facts
- `USE_FALLBACKS=false` in `.env.local` — Gemini is live
- Seed user: `BLK-00471-LDN` / `password123` (Dr. Osei, score 55, Southwark)
- `protectedFetch` always makes 2 requests per protected call (known issue, not yet fixed)
- Notifications backend exists (`/api/notifications`) but frontend not wired — someone else is on it
