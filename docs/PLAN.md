# CivicTrust — Implementation Plan

> BLACKOUT · GDGC UOA 2026 · Hackathon mode: speed > perfection

## The idea

After the solar flare wiped every digital record, anyone can lie about who they are. CivicTrust lets people rebuild identity from physical evidence — submit documents, get them vouched by the community, earn a trust score. Anyone in London can also search a public directory — like Yellow Pages — to find verified doctors, engineers, and lawyers near them. No account needed to search.

**Lore anchor:** CivicTrust was deployed at T+6h post-flare by an emergency coalition. It didn't exist before — that's why its database wasn't wiped.

---

## Two types of users

**Registered user — builds trust score**
Creates an account, submits claims with evidence, gets vouched by people who know them. Earns a trust score. Appears on the map and Yellow Pages as a verified skilled person.
Goal: get Verified (score 50+) and be found by people who need their skills.

**Public visitor — finds help, must verify to view records**
Opens the app, searches for "doctor near Southwark." Sees a map and counts of verified doctors in that area — no login needed for search. Viewing individual profiles or records requires logging in.
Goal: find a verified professional near them as quickly as possible.

---

## Problems solved — 7 of 8

| Problem | How |
|---|---|
| P01 Identity without records | Trust score + node ID is the new identity |
| P02 Ownership without proof | Document claims prove what you own or are |
| P03 Trust without authority | Community vouching replaces institutions |
| P04 Credentials without verification | Gemini Vision reads physical credential documents |
| P06 Decisions without governance | Trust score determines who has standing |
| P07 Information without truth | Only Verified users can post to the network |
| P08 Resources without coordination | Yellow Pages shows verified skills by area |
| ~~P05~~ | Exchange without currency — out of scope |

---

## Score thresholds

| Score | Status | Unlocks |
|---|---|---|
| 0–29 | Unverified | View only. Can submit claims. Cannot vouch others. |
| 30–49 | Partial | Can request vouches. Getting there. |
| 50–89 | Verified | Can vouch others. Appear on map + Yellow Pages. |
| 90–94 | Trusted | Gov anchor eligible. 2x vouch weight. |
| 95+ | Gov Official | Pre-seeded NHS/Police/Council. GOV badge on map. |

**How score is built:**

| Action | Points |
|---|---|
| Submit verified claim | +15 |
| Receive a vouch | +10 |
| Gov anchor vouches you | +20 |
| Vouched fraud is flagged | -15 |

**Formula (build version):**
```
score = min(100, claims_verified * 15 + vouches_received * 10)
// penalty: vouchers.forEach(v => v.score -= 15)
```

---

## User flows

**Flow 1 — New user registration (~2 minutes)**
Open app → Enter name → Set PIN (4-digit, no email needed) → Pick skill (Doctor/Engineer/Lawyer/Builder) → Upload mandatory doc (passport OR driving licence) → Node ID issued (BLK-XXXXX-LDN, score 0, tier: Unverified)
After first login: user sets a unique @username.

**Flow 2 — Submit a claim + evidence (raises trust score)**
Choose claim type → Photograph doc → AI reads it (Gemini extracts name, doc type, institution) → Consistency check (name must match across all docs) → Score rises (+15 per verified claim)

Claim types: Identity (passport, ID card), Credential (degree, licence), Work (employer letter)

**Flow 3 — Vouching (mutual trust boost)**
Open profile → Show QR code → Other person scans it → Both confirm "Yes, I know this person in real life" → Both scores rise (+10 each, mutual boost)
Warning: if the person you vouch is later found to be fraudulent, your score drops 15pts. Vouching = responsibility.

**Flow 4 — Yellow Pages (search public, profiles need login)**
Open /find (public page, no login) → Search skill ("Doctor"/"Engineer") OR resource ("insulin"/"water") → Filter by area (Southwark/Hackney/etc.) → See results (map + list, no names shown) → Found: "3 verified doctors nearby"
Viewing individual profiles requires login. Privacy: no names shown in public search. Only skill + area + count. Anonymous pins on map.

**Flow 5 — Login (no email, no password)**
Enter node ID (BLK-XXXXX-LDN) → Enter PIN (4 digits set on registration) → Authenticated. Session stored on device.

---

## 3 screens + 1 public page

1. **Register / Login** — name, PIN, skill, mandatory doc upload. Node ID issued at signup. Set @username after first login. Already registered? Log in with node ID (or @username) + PIN.
2. **Profile** — animated score ring, claims list, add claim button, QR vouch button
3. **Map** — D3 choropleth heatmap of London, skill pins, live counter "X / 9,000,000 verified"
4. **Find (public)** — search by skill or area, results grouped by borough, no login required

---

## Anti-scam (backend only, no UI)

- **Name consistency** — all docs must have matching name. Mismatch = rejected.
- **Doc dedup** — same doc submitted twice = silently rejected.
- **Penalty cascade** — vouch a fraudster = -15pts. Drop below 50 = lose Verified.
- **Rate limiting** — max 5 vouches per 24h, 3 claim submissions per 10 min.
- **Gov anchor roots** — trust above 90 requires trust path to L0 anchor within 3 hops.

---

## Government hierarchy — pre-seeded, no UI needed

- **Level 0 — Seed:** 3 hardcoded accounts. Emergency Coalition. Score 100. Trust roots. Deployed T+6h. No UI — seed script only.
- **Level 1 — Gov Anchors:** NHS admin, Met Police, council lead. Pre-seeded. Score 100. GOV badge on map. Vouches carry 2x weight.
- **Level 2 — Trusted:** Score 90+. Vouched by L1 or 3+ L2 nodes. Trust path traces to L0 within 3 hops. Senior professionals.
- **Level 3 — Verified:** Score 50+. General public. Vouched by any Verified user. Appear on map with skill pin.

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
| 3 | QR vouch flow + vouch/flag + penalty logic | ~3h | Tao + Hemish + Maalav |
| 4 | Heatmap + map pins + Yellow Pages + polish + demo | ~4h | Ray + Maalav + Hemish |

**Total: ~14h. Hackathon budget: 28h. Real coding time: ~15-18h. Realistic.**

---

## Team roles

| Person | Role | Owns |
|---|---|---|
| Ray | Full-stack lead | All of `src/`, Gemini Vision + AI, seed script, London heatmap (D3), QR vouch glue, architecture + merges |
| Aryan | Backend | `src/app/api/` — Supabase schema + RLS, register, login, claims, vouch, flag, trust score logic, penalty cascade |
| Tao | Backend | `src/app/api/` (shared) — rate limiting, realtime subscriptions, Yellow Pages API, gov hierarchy seeding |
| Hemish | Frontend | `src/components/` — score ring (animated), profile + claims card, claim form UI, vouch + flag buttons, QR display + scan, visual polish |
| Maalav | Frontend/Pages | `src/app/` (non-API) — onboarding page, profile page layout, map page layout, Yellow Pages /find, navigation + routing |

---

## Not building — confirmed cuts

| Cut | Reason |
|---|---|
| Facial recognition | Cut. Confirmed. |
| Device fingerprinting / Face ID | Cut. Confirmed. |
| Dispute mechanism | Vouch + flag is enough. Adds complexity. |
| Resource claims | Not in 4-min demo path. |
| Information claims | Not in 4-min demo path. |
| Score decay over time | 28h window — irrelevant. |
| Offline / PWA | Internet works in the scenario. |
| P05 currency / exchange | Out of scope entirely. |
| External database checks | All databases are wiped in scenario. |
| Post for help / help requests | Cut by team decision. |

## Stretch — only if everything else ships

- Vouch arc animation on map
- Area drill-down on heatmap click
- How-to guide / onboarding tips

---

## Stack

Next.js 15, Tailwind v4, shadcn/ui, D3.js, Supabase, Gemini 2.0 Flash, qrcode.js, html5-qrcode

---

## Marking schema

| Category | Points | Our answer |
|---|---|---|
| Technical | 35 | Gemini Vision reads physical docs live. Realtime Supabase score updates. D3 heatmap with live pins. QR vouch flow. Trust graph architecture. |
| Idea | 30 | Physical → digital inversion. Zero-institution trust. Yellow Pages for 9M people. Solves 7/8 problems. Deployed at T+6h lore. |
| Design | 20 | Dark UI, animated score ring, skill pins on map, live counter, 3 clicks to Verified. Yellow Pages needs zero login. |
| Presentation | 15 | Open with lore. Show rejection. Show success. Close: "142 doctors. First ward reopens tomorrow." |

**Priority #1: ship working flows first. Polish second. Never the other way around.**

---

## Demo path (4 minutes)

1. **0:00** — Open with lore: "It's T+14h. Sarah is a surgeon. Her hospital locked her out."
2. **0:30** — Sarah registers. Name + PIN + Doctor. Gets BLK-00471-LDN. Score: 0.
3. **1:00** — Submits medical degree. Gemini reads "UCL Medicine, Dr. Sarah Mitchell." Score: 15.
4. **1:30** — Submits NHS employer letter. Score: 30. Now Partial.
5. **2:00** — Dr. Osei (pre-seeded, 74) sees Sarah in area. QR vouch. Sarah → 40pts. Still Partial.
   *Show a rejection: bad actor submits mismatched passport → name doesn't match → rejected.*
6. **2:30** — A second vouch from the community → Sarah hits 50 → **Verified** → Doctor pin appears on map.
7. **3:00** — Map view. 200 Londoners visible. Counter: 1,847 / 9,000,000.
8. **3:45** — Close: "142 are doctors. The first hospital ward reopens tomorrow because the staff list rebuilt itself. Not from a server. From people."
