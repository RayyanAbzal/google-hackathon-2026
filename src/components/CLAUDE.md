# Components — Hemish

## Owner: Hemish
All reusable UI components live here. Pages (Maalav) import from here.

## Components to build

| Component | File | Purpose |
|---|---|---|
| TrustRing | `trust/TrustRing.tsx` | Animated SVG score ring. Prop: `score: number`. Animates on change. |
| ScoreBadge | `trust/ScoreBadge.tsx` | Tier badge — Unverified/Partial/Verified/Trusted/Gov Official |
| ProfileCard | `trust/ProfileCard.tsx` | User card: username, score ring, tier badge, skill tag, claim list |
| ClaimCard | `claims/ClaimCard.tsx` | Single claim with vouch count, status badge, flag button |
| ClaimForm | `claims/ClaimForm.tsx` | Upload doc form. File input + claim type selector. |
| VouchQR | `trust/VouchQR.tsx` | Shows QR for user's node ID. Also has scanner mode. |
| SkillPin | `map/SkillPin.tsx` | D3 pin for map — skill icon + colour by type |

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
6. SkillPin (needed for map — coordinate with Ray)

## The score ring
This is the most important component. Score animates from old value to new value on update.
Use Framer Motion for the animation. SVG circle with stroke-dasharray.
Colour by tier: red = Unverified (<30), orange = Partial (30-49), green = Verified (50-89), amber = Trusted (90-94), gold = Gov Official (95+).

## Score tiers (for badge colours)
0-29 Unverified, 30-49 Partial, 50-89 Verified, 90-94 Trusted, 95+ Gov Official
Use `getTier()` from `src/types/index.ts` — never hardcode tier thresholds.
