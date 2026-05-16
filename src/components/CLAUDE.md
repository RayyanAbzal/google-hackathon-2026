# Components — Owner: Hemish

## Priority order (build top to bottom)

1. `trust/TrustRing.tsx` — THE hero visual. Score ring with Framer Motion animation.
2. `trust/ScoreBadge.tsx` — Tier pill badge.
3. `trust/ProfileCard.tsx` — Full profile: TrustRing + ScoreBadge + buttons.
4. `claims/ClaimCard.tsx` — Single claim with flag button.
5. `claims/ClaimForm.tsx` — Doc upload form, calls POST /api/claims.
6. `trust/VouchQR.tsx` — QR display + camera scan. Add `html5-qrcode` when you need it.
7. `trust/HelpPostCard.tsx` + `HelpPostForm.tsx`

## Visual rules (20pts of rubric — make it beautiful)

- Dark theme: background `#0a0a0f`, cards `#111118`
- shadcn/ui components only — no primitives from scratch
- Tailwind v4 utility classes — no inline styles
- Mobile-first responsive
- All components under 200 lines — extract if larger
- Score ring is the most important visual

## Import rules

- All types from `src/types/index.ts` — never define types in component files
- Use `src/lib/supabase.ts` if you need DB access (prefer passing data via props)
- `framer-motion` is installed — use for TrustRing animation
- `qrcode` is installed — use for QR generation in VouchQR
- `html5-qrcode` — install yourself when you build the scan mode
