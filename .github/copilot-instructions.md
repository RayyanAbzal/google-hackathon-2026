# GitHub Copilot Instructions — GDGC Hackathon 2026

## Mode: HACKATHON — ship fast

Stack: Next.js 15 App Router, TypeScript strict, Tailwind v4, shadcn/ui, Gemini API, Supabase.

## Rules

- No test generation unless asked
- No refactoring code you did not touch
- No `any` — use typed alternatives
- shadcn/ui only — do not suggest custom UI primitives
- Tailwind v4 classes only — no inline styles or CSS modules

## Layer ownership — only suggest code for your area

| Area | Owner | Path |
|------|-------|------|
| AI / Gemini + Supabase + Vercel infra | Ray | `src/lib/` |
| Backend / API routes | Aryan | `src/app/api/` |
| Frontend / UI components | Hemish | `src/components/` |
| Pages / routing | Maalav | `src/app/` (non-API) |
| Shared types | All | `src/types/` |

## Commit suggestions

Format: `feat:`, `fix:`, `chore:` — imperative, lowercase, no period.

## Demo-path-first

If a feature cannot be shown in 4 minutes, do not suggest building it.
