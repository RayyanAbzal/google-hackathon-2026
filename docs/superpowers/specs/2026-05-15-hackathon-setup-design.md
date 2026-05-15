# GDGC Hackathon 2026 - Setup Design

**Date:** 2026-05-15  
**Event:** GDGC Hackathon @ UoA, GridAKL, 16-17 May 2026  
**Team:** 5 members, 36 hours build time, demo deadline 3:30pm Sunday

---

## Context

Theme revealed 10am Saturday. Repo scaffold created tonight (empty scaffold is legal per rules).
Coding starts 10am Saturday. Submission = repo link + form by 3:30pm Sunday. Demo = 4 minutes.

---

## Stack

- Next.js 15 App Router + TypeScript (strict)
- Tailwind v4 + shadcn/ui
- Gemini API (Google hackathon — judges notice)
- Supabase (DB + auth)
- Vercel (deployment)

---

## Repo Structure

```
google-hackathon/
├── .claude/
│   └── settings.json
├── src/
│   ├── app/                 Next.js App Router pages + API routes
│   ├── components/          shared UI components
│   ├── lib/
│   │   ├── gemini.ts        Gemini client stub (ready to fill at 10am)
│   │   ├── supabase.ts      Supabase client
│   │   └── fallbacks.ts     mock/seeded data — toggle when API fails
│   └── types/               shared TypeScript interfaces
├── public/
├── .env.example
├── .gitignore
├── CLAUDE.md
├── CONTRIBUTING.md
├── PLAN.md
├── ROLES.md
└── README.md
```

---

## Branch Strategy

```
main   demo-ready only. team lead merges dev here at agreed checkpoints.
  └── dev   integration branch. all PRs target here.
        └── feat/<name>-<feature>   individual work branches.
```

Rules:
- Never push directly to `main`
- Always pull `dev` into your branch before opening a PR
- PRs require one approval (30-second "does it run?" check)
- `dev` → `main` only when team agrees it is demo-ready

---

## Team Roles

| Person | Primary Role | Owns |
|--------|-------------|------|
| Ray | Lead + AI/Gemini infra + demo | `src/lib/`, demo script |
| Aryan | Backend + Supabase | `src/app/api/` |
| Hemish | Frontend | `src/components/` |
| Maalav | Frontend support / Backend flex | TBD at 10am |
| 5th member | TBD | TBD at 10am |

Rule: do not modify files outside your ownership area without telling the owner first.

---

## CONTRIBUTING.md Rules

1. Branch naming: `feat/<yourname>-<what>` e.g. `feat/ray-auth`
2. Commits: conventional format — `feat:`, `fix:`, `chore:` — imperative, lowercase, no period
3. PRs always target `dev`, never `main`
4. One approval minimum before merge (just "does it run?")
5. Pull `dev` into your branch before you PR — not after
6. Demo-path-first: first commit from each person must connect to the runnable demo path

---

## CLAUDE.md (Hackathon Mode)

Overrides global config for this project:
- Ship speed over code quality
- No 80% test coverage requirement
- No refactoring code you did not break
- No cleanup of pre-existing dead code
- `any` still banned — use typed alternatives
- Only touch files in your ownership area unless explicitly asked
- Commit format: conventional commits, ASCII, imperative mood

---

## PLAN.md Template (fill in 9am Saturday)

```
One-liner: "This app helps [user] do [X] by [mechanism]"

Core feature (must demo):
Wow feature (the "dayumm" moment):
Cut if time runs out:

Who builds what today:
  Ray:
  Aryan:
  Hemish:
  Maalav:
  5th:

Demo flow (4 mins):
  0:00 - 0:30  hook / problem statement
  0:30 - 2:30  live demo
  2:30 - 3:30  wow feature
  3:30 - 4:00  wrap / what's next

Sunday checkpoints:
  12:30pm  full demo runnable? if not, cut scope NOW
  01:15pm  checkpoint — cut anything non-critical
  02:00pm  checkpoint — polish only from here
  02:45pm  final cut — no new features
  03:00pm  FREEZE. no new code. demo prep only.
```

---

## Fallback Strategy

`src/lib/fallbacks.ts` contains seeded/mock data for every external dependency.
One-line toggle per service. If Gemini rate-limits or Supabase flakes mid-demo, flip the flag.
Best teams plan for failure.

---

## Pre-hackathon Checklist (tonight)

- [ ] Scaffold repo created and pushed
- [ ] `main` and `dev` branches exist
- [ ] Branch protection on `main` (no direct push)
- [ ] All 4 teammates invited as collaborators
- [ ] `.env.example` committed with all expected keys
- [ ] Gemini client stub wired and importable
- [ ] Supabase client stub wired and importable
- [ ] Fallbacks skeleton in place
- [ ] ROLES.md, CONTRIBUTING.md, PLAN.md, CLAUDE.md all committed
