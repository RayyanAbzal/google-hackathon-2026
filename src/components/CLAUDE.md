# Components — Hemish

## Owner: Hemish
All reusable UI components live here. Pages (Maalav) import from here.

## Components to build

| Component | File | Purpose |
|---|---|---|
| TrustRing | `trust/TrustRing.tsx` | Animated SVG score ring. Prop: `score: number`. Animates on change. |
| ProfileCard | `trust/ProfileCard.tsx` | User card: username, score ring, tier badge, skill tag, claim list |
| ClaimCard | `claims/ClaimCard.tsx` | Single claim with vouch count, status badge, flag button |
| ClaimForm | `claims/ClaimForm.tsx` | Upload doc form. File input + claim type selector. |
| VouchQR | `trust/VouchQR.tsx` | Shows QR for user's node ID. Also has scanner mode. |
| SkillPin | `map/SkillPin.tsx` | D3 pin for map — skill icon + colour by type |
| HelpPostCard | `trust/HelpPostCard.tsx` | Help request card — content, skill/resource tag, urgency, respond button |
| ScoreBadge | `trust/ScoreBadge.tsx` | Verified / Unverified / Trusted / Gov badge |

## Rules
- shadcn/ui components only — do not build primitives from scratch
- Tailwind v4 utility classes only — no inline styles
- All components under 200 lines — extract if larger
- Import types from `src/types/index.ts`
- No API calls inside components — accept data via props
- Hemish owns the visual language. Make it dark, clean, premium.

## Priority order
1. TrustRing (needed on profile page — demo hero visual)
2. ProfileCard
3. ClaimCard + ClaimForm
4. VouchQR
5. ScoreBadge
6. HelpPostCard
7. SkillPin (needed for map — coordinate with Ray)

## The score ring
This is the most important component. Score animates from old value to new value on update.
Use Framer Motion for the animation. SVG circle with stroke-dasharray.
Colour: green for Verified, amber for Partial, red for Unverified.
