<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Hackathon AI Rules — GDGC 2026

All AI tools (Claude Code, Copilot, Cursor, etc.) follow these rules in this repo.

## Mode: HACKATHON — speed over perfection

- No test coverage requirement
- No refactoring code you did not break
- No cleanup of pre-existing dead code
- No `any` — use typed alternatives
- shadcn/ui components only — do not build UI primitives from scratch
- Tailwind v4 utility classes — no inline styles

## Layer ownership

Only generate code in the assigned area. Ask before touching another owner's files.

| Area | Owner | Path |
|------|-------|------|
| AI / Gemini infra + Supabase + Vercel | Ray | `src/lib/` |
| Backend / API routes | Aryan | `src/app/api/` |
| Frontend / UI components | Hemish | `src/components/` |
| Pages / routing | Maalav | `src/app/` (non-API) |
| Shared types | All | `src/types/` |

## Demo-path-first

Every feature must connect to the runnable demo. If it cannot be shown in 4 minutes, do not build it.

## Commit format

```
feat: add search input
fix: handle empty gemini response
chore: install @google/generative-ai
```

Conventional commits. ASCII only. Imperative mood. No trailing period. No compound types.

## Fallback toggle

If an external API fails, set `USE_FALLBACKS=true` in `.env.local`.
Mock data is in `src/lib/fallbacks.ts` — keep it updated as features are added.
