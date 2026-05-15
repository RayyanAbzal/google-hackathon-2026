# Team Roles — GDGC Hackathon 2026

Fill in task assignments after the briefing.

## Who owns what

| Person | Role | Files you touch | Your branch prefix |
|--------|------|-----------------|--------------------|
| Ray | Full-stack lead — integration, AI, demo | all of `src/` | `feat/ray-` |
| Aryan | Backend + Supabase | `src/app/api/` | `feat/aryan-` |
| Hemish | Frontend / UI | `src/components/` | `feat/hemish-` |
| Maalav | Frontend support / Backend flex | `src/app/` (non-API) | `feat/maalav-` |

Ray can touch any file. Everyone else: stay in your area, or tell the owner before crossing.

Shared files (`src/types/`, `src/lib/`) — message the group chat before editing.

---

## How branches work

There are three levels:

```
main   — the clean, demo-ready version. Ray pushes here right before the demo.
dev    — where everyone's work comes together. You merge into this.
feat/  — YOUR branch. You create it, work on it, merge it back to dev when done.
```

Rule: never commit directly to `dev` or `main`. Always use your own branch.

---

## Step-by-step: starting a task

**Step 1 — get latest dev**
```bash
git checkout dev
git pull
```

**Step 2 — create your branch**

Replace `<what-you-built>` with a short description (no spaces, use dashes):

- Aryan: `git checkout -b feat/aryan-<what-you-built>`
- Hemish: `git checkout -b feat/hemish-<what-you-built>`
- Maalav: `git checkout -b feat/maalav-<what-you-built>`
- Ray: `git checkout -b feat/ray-<what-you-built>`

Examples:
```bash
git checkout -b feat/aryan-auth-endpoint
git checkout -b feat/hemish-sidebar-nav
git checkout -b feat/maalav-home-page
```

**Step 3 — do your work**

Write code. Commit often (see commit format below). Push your branch to keep it backed up:
```bash
git push -u origin feat/aryan-auth-endpoint   # first push (sets upstream)
git push                                        # every push after that
```

---

## Step-by-step: finishing a task

**Step 4 — merge your branch into dev**
```bash
git checkout dev
git pull                                        # get any changes teammates pushed
git merge feat/aryan-auth-endpoint             # replace with your branch name
git push
```

If git says there are conflicts, message Ray — he'll help resolve.

**Step 5 — delete your branch**
```bash
git branch -d feat/aryan-auth-endpoint         # delete local
git push origin --delete feat/aryan-auth-endpoint  # delete remote
```

**Step 6 — start your next task from Step 1 again**

---

## Commit format

Every commit message follows this pattern:
```
<type>: <short description>
```

Types:
- `feat` — new feature or UI
- `fix` — bug fix
- `chore` — installs, config, housekeeping

Examples:
```
feat: add auth endpoint
feat: add sidebar nav component
fix: handle empty API response
chore: install @google/generative-ai
```

Rules: lowercase, no trailing period, describe what it does in plain English, keep it short.

---

## If something breaks

- Merge conflict: message Ray, don't force push.
- API broken during demo: set `USE_FALLBACKS=true` in `.env.local` — mock data will load instead.
- Not sure what to touch: ask before you edit someone else's area.

---

## Day 1 tasks (fill in after briefing)

- Ray:
- Aryan:
- Hemish:
- Maalav:
