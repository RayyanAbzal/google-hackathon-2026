# GDGC Hackathon 2026

Team project — GDGC @ UoA, 16-17 May 2026, GridAKL.

## Quick start

```bash
npm install
cp .env.example .env.local
# fill in .env.local with your API keys
npm run dev
```

## Docs

- [PLAN.md](./PLAN.md) — fill in at 9am Saturday with theme + idea
- [ROLES.md](./ROLES.md) — who owns what
- [CONTRIBUTING.md](./CONTRIBUTING.md) — branch strategy + commit rules

## Branch strategy

```
main  demo-ready only
  └── dev  integration (all PRs go here)
        └── feat/<yourname>-<what>
```

Never push to `main` directly.

## Inviting teammates

```bash
# Run for each teammate once you have their GitHub username
gh repo edit --add-collaborator <github-username>
```

Or via GitHub UI: Settings > Collaborators > Add people.

## Fallback mode

If any API fails during the demo, flip this in `.env.local`:

```
USE_FALLBACKS=true
```

Restart the dev server. Mock data kicks in instantly.
