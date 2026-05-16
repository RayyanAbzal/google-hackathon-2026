# Components — Hemish

## Owner: Hemish

All reusable UI components live here. Pages (Maalav) import from here.

## CURRENT STATE (2026-05-16)

The civic design system is shipped. Most planned components are now superseded by inline implementations in the pages. Hemish should focus on wiring real data, not rebuilding the visual layer.

## Already built — src/components/civic/

| Component | File                  | Notes                                |
| --------- | --------------------- | ------------------------------------ |
| TopBar    | `civic/TopBar.tsx`    | Done. Notifications + avatar popups. |
| Sidebar   | `civic/Sidebar.tsx`   | Done. Identity card + nav.           |
| TierBadge | `civic/TierBadge.tsx` | Done. Replaces ScoreBadge.           |
| Icon      | `civic/Icon.tsx`      | Done. Material Symbols wrapper.      |

## Still useful — these exist but may need connecting to real data

| Component | File                   | Status                                               |
| --------- | ---------------------- | ---------------------------------------------------- |
| SkillPin  | `map/SkillPin.tsx`     | Exists — coordinate with Ray for map wiring          |
| HeatMap   | `map/HeatMap.tsx`      | Exists — Ray owns, used in `/map`                    |
| ClaimCard | `claims/ClaimCard.tsx` | Exists stub — update if dashboard/evidence needs it  |
| ClaimForm | `claims/ClaimForm.tsx` | Exists stub — the add-evidence page has its own flow |

## Superseded — do NOT rebuild these

- `TrustRing` — score ring SVG is inline in `dashboard/page.tsx`
- `ScoreBadge` — replaced by `TierBadge` in `civic/`
- `ProfileCard` — the Dashboard page is the profile now
- `VouchQR` — QR is inline in `vouch/page.tsx`

## Rules

- Import types from `src/types/index.ts`
- No API calls inside components — accept data via props
- Design token colours: use the same inline style pattern as the civic components (`#10141a`, `#b0c6ff` etc)
- `getTier()` from `src/types/index.ts` — never hardcode tier thresholds

## Score tiers

0-29 Unverified, 30-49 Partial, 50-89 Verified, 90-94 Trusted, 95+ Gov Official
