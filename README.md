# GDGC Hackathon 2026

Team project — GDGC @ UoA, 16-17 May 2026, GridAKL.

**New? Read [ROLES.md](./ROLES.md) first — it covers who owns what, how branches work, and how to contribute.**

## Quick start

```bash
npm install
cp .env.example .env.local
# fill in .env.local with your API keys
npm run dev
```

## Docs

- [ROLES.md](./ROLES.md) — who owns what, branch workflow, contribution steps
- [PLAN.md](./PLAN.md) — fill in at 9am Saturday with theme + idea

## Branch strategy

```
main  demo-ready only
  └── dev  integration (all branches merge here)
        └── feat/<yourname>-<what>  your working branch
```

Never push to `main` or `dev` directly. Always use a `feat/` branch.

## Inviting teammates

```bash
gh repo edit --add-collaborator <github-username>
```

Or via GitHub UI: Settings > Collaborators > Add people.

## Fallback mode

If any API fails during the demo, flip this in `.env.local`:

```
USE_FALLBACKS=true
```

Restart the dev server. Mock data kicks in instantly.
