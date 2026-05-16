# CivicTrust — Implementation Plan

> BLACKOUT · GDGC UOA 2026 · Hackathon mode: speed > perfection

## The idea

After the solar flare wiped every digital record, anyone can lie about who they are. CivicTrust lets people rebuild identity from physical documents — submit a passport or driving licence, get vouched by the community, earn a trust score. Anyone can search a public map and directory (like Yellow Pages) to find verified doctors, engineers, and lawyers nearby.

**Lore anchor:** CivicTrust was deployed at T+6h post-flare by an emergency coalition. It didn't exist before — that's why its database wasn't wiped.

---

## Problems solved

| Problem | How |
|---|---|
| P01 Identity without records | Trust score + username = new identity |
| P03 Trust without authority | Community vouching replaces institutions |
| P04 Credentials without verification | Gemini Vision reads physical docs |
| P07 Information without truth | Only Verified users can post to network |
| P08 Resources without coordination | Yellow Pages matches supply/demand |

---

## Score thresholds

| Score | Status | Unlocks |
|---|---|---|
| 0–49 | Unverified (default) | View map, search Yellow Pages |
| 50–89 | Verified | Vouch others, appear on map |
| 90–94 | Trusted | Higher vouch weight, community leader |
| 95–100 | Gov Official | Pre-seeded NHS/Police/Council. 2× vouch weight. GOV badge. |

**Formula (build version):**
```
score = min(100, claims_verified * 15 + vouches_received * 10)
// penalty: vouchers.forEach(v => v.score -= 15)
```

---

## Auth — node ID + PIN, no email, no facial recognition

- Registration: name + 4-digit PIN + skill tag + mandatory doc (passport or driving licence)
- System issues temp node ID (BLK-XXXXX-LDN) immediately
- After first login: user sets a unique @username
- Login: node ID (or @username) + PIN
- Session stored on device
- No email. No password reset. No facial recognition. No biometrics.

---

## Claim types (3 for MVP)

| Type | Evidence | Points |
|---|---|---|
| Identity | Passport, national ID | +15 |
| Credential | Degree, medical licence | +15 |
| Work | Employer letter, company ID | +15 |

---

## Features

### Screen 1 — Register / Login
- Name + PIN + skill tag + mandatory doc upload
- Gemini Vision reads doc, checks name matches
- Node ID issued → set @username

### Screen 2 — Profile
- Animated trust score ring
- List of submitted claims with vouch counts
- Add claim button, QR vouch button
- Flag claims from others

### Screen 3 — Map
- D3 choropleth heatmap of London
- Skill pins (Doctor/Engineer/Legal/Builder)
- Click pin → view profile (requires login)
- Live counter: "X / 9,000,000 verified"

### Screen 4 — /find (Yellow Pages, public)
- Search by skill (Doctor) OR resource (insulin, water)
- Results: area + count. No names.
- Map + list view
- Login required to view individual profiles

---

## Anti-scam (backend only, no UI)

- **Name consistency**: Gemini reads name from every doc. All must match registered name.
- **Doc dedup**: same doc content submitted twice = rejected silently
- **Penalty cascade**: vouch a fraudster = -15pts. Drop below 50 = lose Verified.
- **Rate limiting**: max 5 vouches/24h, 3 claim submissions/10 min
- **Gov anchor roots**: score above 90 requires trust path to L0 anchor within 3 hops

---

## Government hierarchy

- **Level 0** — Emergency Coalition (3 hardcoded seed accounts, score 100, T+6h)
- **Level 1** — Gov Officials (NHS admin, Met Police, council — pre-seeded at 95)
- **Level 2** — Trusted (90+, vouched by L1 or 3+ L2 nodes)
- **Level 3** — Verified (50+, general public)

---

## Demo data — all fake, pre-seeded

The seed script creates:
- 3 gov anchor nodes (L0 + L1)
- 200 fake Londoners across boroughs (scores 30–90, skill tags, vouch chains)
- Dr. Osei — score 74, Doctor, Southwark (used in demo vouch moment)
- Fake documents for Sarah's demo: degree, passport, employer letter
- Fake bad-actor doc (mismatched name) for showing rejection

**Run seed script before anything is demoed.**

---

## Build phases

| Phase | What | Est. | Who |
|---|---|---|---|
| 1 | Seed script + DB schema + register + login | ~3h | Ray + Aryan |
| 2 | Claims + Gemini Vision + score + profile UI | ~4h | Ray + Aryan + Hemish |
| 3 | QR vouch + Yellow Pages | ~3h | Tao + Hemish + Maalav |
| 4 | Heatmap + map pins + counter + polish + demo | ~4h | Ray + Maalav + Hemish |

**Total: ~14h. Hackathon has 28h. Realistic.**

---

## Team roles

| Person | Role | Owns |
|---|---|---|
| Ray | Full-stack lead | All of `src/`, architecture, Gemini, seed script, heatmap |
| Aryan | Backend | `src/app/api/` — register, login, claim, vouch, flag, score + Supabase setup |
| Tao | Backend | `src/app/api/` (shared) — rate limiting, realtime, Yellow Pages API |
| Hemish | Frontend | `src/components/` — score ring, profile card, forms, QR UI, polish |
| Maalav | Frontend/Pages | `src/app/` (non-API) — onboarding, profile page, map page, /find |

---

## What is NOT being built

- Facial recognition / biometrics / Face ID / device fingerprinting
- Dispute mechanic (vouch + flag only)
- Post for help / help requests
- Score decay
- Offline / PWA
- P05 currency
- External database checks (all databases wiped in scenario)

---

## Marking schema reference

| Category | Points | Our answer |
|---|---|---|
| Technical | 35 | Gemini Vision live, realtime Supabase, D3 heatmap, trust graph architecture |
| Idea | 30 | Physical→digital inversion, zero-institution trust, Yellow Pages, 5 problems solved |
| Design | 20 | Dark UI, score ring animation, skill pins, zero-friction Yellow Pages |
| Presentation | 15 | Open with lore, show rejection, happy path, emotional close |

**Priority: get every flow working first (Technical 35pts). Polish after.**

---

## Demo path (4 minutes)

1. **0:00** — Open with lore: "It's T+14h. Sarah is a surgeon. Her hospital locked her out."
2. **0:30** — Sarah registers. Name + PIN + Doctor. Submits passport. Gets BLK-00471-LDN. Score: 0.
3. **1:00** — Submits medical degree. Gemini reads "UCL Medicine, Dr. Sarah Mitchell." Score: 15.
4. **1:30** — Submits NHS employer letter. Score: 30. Still Unverified.
5. **2:00** — Dr. Osei (pre-seeded, 74) sees Sarah in area. QR vouch. Sarah → 40pts. Still not Verified.
   *Show a rejection: bad actor submits mismatched passport → name doesn't match → rejected.*
6. **2:30** — A second vouch from the community → Sarah hits 50 → **Verified** → Doctor pin appears on map.
7. **3:00** — Map view. 200 Londoners visible. Counter: 1,847 / 9,000,000.
8. **3:45** — Close: "142 are doctors. The first hospital ward reopens tomorrow because the staff list rebuilt itself. Not from a server. From people."
