# Contributing — GDGC Hackathon 2026

## Branch strategy

```
main   demo-ready only. team lead (Ray) merges dev here at checkpoints.
  └── dev   integration. all PRs target here.
        └── feat/<yourname>-<what>   your work branch.
```

Example: `feat/ray-auth`, `feat/aryan-api`, `feat/hemish-dashboard`

## The 6 rules

1. **Branch naming** — `feat/<yourname>-<what>` always
2. **Commits** — conventional format, imperative, lowercase, no period
   ```
   feat: add search input
   fix: handle empty api response
   chore: update env example
   ```
3. **PRs always target `dev`** — never `main`
4. **One approval minimum** — 30-second check: "does it run on dev?"
5. **Pull `dev` into your branch before you PR** — prevents conflicts at merge time
6. **Demo-path-first** — your first commit must connect to something demoable

## Merging `dev` → `main`

Team lead (Ray) only. Happens at agreed checkpoints, not ad-hoc.

## Conflict prevention

- Pull `dev` into your branch every ~2 hours
- Keep PRs small — one feature per PR
- Do not touch files outside your ownership area (see ROLES.md)
- Talk before you restructure shared files (`src/types/`, `src/lib/`)

## Never do

- Push directly to `main`
- Force push to any shared branch
- Commit `.env.local` or any secrets
- Leave a merge conflict marker in a PR (`<<<<<<<`, `=======`, `>>>>>>>`)
