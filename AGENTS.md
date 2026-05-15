<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Hackathon AI Rules — GDGC 2026

All AI tools (Claude Code, Copilot, etc.) follow these rules in this repo.

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
main        — demo-ready, stable. Ray merges dev -> main before the demo.
dev         — integration branch. All feature branches merge here.
<name>/...  — working branch. Never commit directly to dev or main.
```

Just use your name as the prefix. Slug is optional.

| Person | Example branch |
|--------|----------------|
| Ray | `ray/homepage` |
| Aryan | `aryan/auth` |
| Hemish | `hemish/sidebar` |
| Maalav | `maalav/results-page` |

## Contribution workflow

1. Always branch off `dev` — never off `main`.
   ```
   git checkout dev && git pull && git checkout -b <name>/<slug>
   ```
2. Work only in your area (see layer ownership above).
3. Commit whatever — just make it clear enough that teammates understand what changed.
4. When done, merge back into `dev` directly:
   ```
   git checkout dev && git pull && git merge <name>/<slug> && git push
   ```
5. Delete your branch after merging.
6. Pull `dev` before starting the next branch.

Shared files (`src/types/`, `src/lib/`) — announce in group chat before touching to avoid conflicts.

## Demo-path-first

Every feature must connect to the runnable demo. If it cannot be shown in 4 minutes, do not build it.

## Commit format

Free-form is fine. Just describe what changed.

```
add search input
fix empty gemini response crash
install @google/generative-ai
```

## Fallback toggle

If an external API fails, set `USE_FALLBACKS=true` in `.env.local`.
Mock data is in `src/lib/fallbacks.ts` — keep it updated as features are added.
