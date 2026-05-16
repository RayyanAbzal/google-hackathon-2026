# CivicTrust — Test Results (Session 16 · 2026-05-16)

## Summary

Full E2E demo path tested via API (curl) with `NEXT_PUBLIC_USE_FALLBACKS=true`.
TypeScript: clean (`tsc --noEmit` zero errors). Build: all 21 pages generated.

---

## API Route Tests

| Route | Method | Test | Result |
|---|---|---|---|
| `/api/auth/register` | POST | Register with display_name, password, doc_type, borough, skill | PASS — returns token + user_id + node_id |
| `/api/auth/login` | POST | Login via `@username` (dr_osei) | PASS — returns session with score + tier |
| `/api/auth/login` | POST | Login via node_id (BLK-10010-LDN) | PASS |
| `/api/auth/login` | POST | Login via username for seeded user (amara_c) | FAIL — seeded users have no username set, login by node_id only |
| `/api/claims` | POST | Submit claim with wrong `doc_type` field name | FAIL (expected) — returns 400 `type must be identity \| credential \| work` |
| `/api/claims` | POST | Submit claim with 1px dummy PNG (Gemini live) | FAIL (expected) — Gemini rejects unreadable doc, name mismatch |
| `/api/claims` | POST | Submit claim with unique image (USE_FALLBACKS=true) | PASS — claim verified, score recalculated |
| `/api/claims` | POST | Submit same image twice (global dedup) | FAIL (expected) — 409 `This document has already been registered` |
| `/api/score/[userId]` | GET | Get score after registration | PASS — score: 0, tier: unverified |
| `/api/score/[userId]` | GET | Get score after 1 claim | PASS — score: 19, tier: unverified (vouch gate active) |
| `/api/score/[userId]` | GET | Get score after 2 claims + 3 vouches | PASS — score: 50, tier: verified |
| `/api/vouch` | POST | Vouch with score < 20 user | FAIL (expected) — 403 `You must be Verified (score 20+) to vouch` |
| `/api/vouch` | POST | Vouch from Dr. Osei (score 70) | PASS — vouch recorded |
| `/api/vouch` | POST | Same user vouch twice (unique constraint) | FAIL (expected) — 409 `Already vouched for this user` |

---

## E2E Demo Path

Tested: register → 2 claims → 3 vouches → Verified

| Step | Action | Expected | Result |
|---|---|---|---|
| 1 | `POST /api/auth/register` | Node ID + token | PASS — BLK-10833-LDN |
| 2 | `GET /api/score/{id}` | 0, unverified | PASS |
| 3 | `POST /api/claims` (passport) | Verified claim | PASS (fallbacks on) |
| 4 | `GET /api/score/{id}` | 19, unverified (vouch gate: 1 doc needs 5 vouches) | PASS |
| 5 | `POST /api/claims` (degree) | Verified claim | PASS |
| 6 | `GET /api/score/{id}` | 19, unverified (vouch gate: 2 docs needs 3 vouches) | PASS |
| 7 | Vouch from BLK-10003-LDN (score 20) | Vouch recorded, score still 19 | PASS |
| 8 | Vouch from Dr. Osei (score 70) | Vouch recorded, score still 19 | PASS |
| 9 | Vouch from BLK-10010-LDN (score 94) | **Score 50, tier: verified** | PASS |

**Gate math confirmed:** 2 docs → minimum 3 vouches → score unlocks.

---

## Known Issues / Gotchas

| Issue | Severity | Notes |
|---|---|---|
| Seeded users have no username — login via node_id only | Low | Only `dr_osei` has username. For demo, use node_id: `BLK-10003-LDN` (score 20), `BLK-10010-LDN` (score 94) |
| Global doc dedup catches rejected claims too | Low | Same image bytes → 409 even if prior submission was rejected. Use unique images per claim in demo. |
| Build exits 137 (OOM) at finalization step | Low | `.next/` directory is fully populated — `npm start` and `npm run dev` both work. Trace write fails only. |
| `middleware` filename deprecated (Next 16 → use `proxy`) | Low | Warning only. Rate limiting still passes through. |
| QR vouch flow not tested in browser | Medium | Only tested via curl. Confirm Hemish's scanner works on mobile before demo. |

---

## Demo Credentials

| Account | Login | Password | Score | Tier |
|---|---|---|---|---|
| Dr. James Osei | `@dr_osei` or `BLK-00471-LDN` | `password123` | 70 | trusted |
| Gov anchor (NHS) | `BLK-00001-LDN` | `govpassword99` | 100 | gov_official |
| Vouch user A | `BLK-10003-LDN` | `password123` | 20 | verified |
| Vouch user B | `BLK-10010-LDN` | `password123` | 94 | trusted |

---

## Pre-Demo Checklist

- [ ] `npx tsx scripts/seed.ts --wipe` — reset DB to clean state
- [ ] Verify Dr. Osei score is 74 after seed
- [ ] Confirm heatmap populated before Sarah registers
- [ ] Keep `NEXT_PUBLIC_USE_FALLBACKS=false` for real Gemini (flip to `true` if Gemini fails)
- [ ] Test QR vouch flow on mobile (Hemish to confirm)
- [ ] `git merge dev → main` before submitting
