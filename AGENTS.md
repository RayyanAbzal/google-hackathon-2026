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
| Everything (full-stack lead) | Ray | all of `src/` |
| Backend / API routes | Aryan | `src/app/api/` |
| Frontend / UI components | Hemish | `src/components/` |
| Pages / routing | Maalav | `src/app/` (non-API) |
| Shared types | All | `src/types/` |

## Branch strategy

```
main                  — demo-ready, stable. Ray merges dev -> main before the demo.
dev                   — integration branch. All feature branches merge here.
feat/<prefix>-<slug>  — working branch. Never commit directly to dev or main.
```

Branch prefix per person:

| Person | Prefix |
|--------|--------|
| Ray | `feat/ray-` |
| Aryan | `feat/aryan-` |
| Hemish | `feat/hemish-` |
| Maalav | `feat/maalav-` |

Example branch names: `feat/aryan-add-auth-endpoint`, `feat/hemish-sidebar-nav`

## Contribution workflow

1. Always branch off `dev` — never off `main`.
   ```
   git checkout dev && git pull && git checkout -b feat/<prefix>-<slug>
   ```
2. Work only in your area (see layer ownership above).
3. Commit in conventional format (see below).
4. When done, merge back into `dev` directly:
   ```
   git checkout dev && git pull && git merge feat/<prefix>-<slug> && git push
   ```
5. Delete your branch after merging.
6. Pull `dev` before starting the next branch.

Shared files (`src/types/`, `src/lib/`) — announce in group chat before touching to avoid conflicts.

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
