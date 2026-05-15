# Team Roles — GDGC Hackathon 2026

Fill in task assignments after the briefing.

## Ownership

| Person | Role | Owns | Branch prefix |
|--------|------|------|---------------|
| Ray | Full-stack lead — frontend, backend, infra, AI, demo | all of `src/` | `feat/ray-` |
| Aryan | Backend + Supabase | `src/app/api/` | `feat/aryan-` |
| Hemish | Frontend / UI | `src/components/` | `feat/hemish-` |
| Maalav | Frontend support / Backend flex | `src/app/` (non-API) | `feat/maalav-` |

Ray is the integration point. Others own their area; Ray can touch any file.

## Branch strategy

```
main  — demo-ready, stable. Only Ray merges here, right before the demo.
dev   — integration branch. All feature branches target this.
feat/<prefix>-<slug>  — your working branch.
```

Never commit directly to `dev` or `main`. Always work on a feature branch.

## Contribution steps

1. Start from `dev`:
   ```
   git checkout dev && git pull && git checkout -b feat/<your-prefix>-<what-you-built>
   ```
2. Work in your area only (see ownership table above).
3. Commit early and often using the format below.
4. When done, merge back into `dev` directly:
   ```
   git checkout dev && git pull && git merge feat/<your-prefix>-<what-you-built> && git push
   ```
5. Delete your branch after merging.
6. Pull `dev` before starting the next branch.

Shared files (`src/types/`, `src/lib/`) — announce in group chat before editing.

## Commit format

```
feat: add sidebar nav
fix: handle null gemini response
chore: install @google/generative-ai
```

Conventional commits. ASCII only. Imperative mood. No trailing period.

## Day 1 tasks (fill in after briefing)

- Ray:
- Aryan:
- Hemish:
- Maalav:
