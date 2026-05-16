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
