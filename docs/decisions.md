# CivicTrust — Architecture Decision Records

## ADR-001: Auth via node ID + password (no email)

**Decision:** Users authenticate with a system-generated node ID (BLK-XXXXX-LDN) and a password. No email, no phone.

**Context:** Post-BLACKOUT — email servers are wiped. We need zero external dependency. Facial recognition was proposed and cut (see ADR-004).

**Consequences:** Node IDs are memorable enough for demo but unfamiliar. Mitigated by @username alias set after first login.

**Note:** Originally designed as 4-digit PIN. Changed to password during session 4 for better security posture.

---

## ADR-002: Score formula — additive, integer, capped at 100

**Decision:** `score = min(100, claims_verified * 15 + vouches_received * 10)`. Gov voucher adds +20. Penalty: vouch a fraudster = -15 to the voucher.

**Context:** Needed a simple formula the judges could see update live. Floating-point decay was cut (28h window — irrelevant). Score is recalculated on every claim/vouch event.

**Consequences:** Score can max out at ~7 verified claims. Gov pathway needed to push beyond 90.

---

## ADR-003: Gemini 2.0 Flash for document analysis

**Decision:** Use Gemini Vision (`analyseDocument()` in `src/lib/gemini.ts`) to extract name, doc type, institution from uploaded images.

**Context:** Judges expect live AI integration. Gemini Flash is fast enough for demo latency. OCR-only alternatives would not score on the Technical rubric.

**Consequences:** Fallback in `src/lib/fallbacks.ts` if Gemini quota exceeded during demo — toggle `USE_FALLBACKS=true`.

---

## ADR-004: No facial recognition

**Decision:** Facial recognition is cut. Confirmed. Not building.

**Context:** Accuracy risk (false rejects during demo), device camera variance, time budget. Community vouching is the trust primitive instead.

**Consequences:** Users can submit fake docs but name consistency check + dedup + penalty cascade mitigate fraud.

---

## ADR-005: Yellow Pages is public — profiles need Verified status

**Decision:** `/find` page requires no login to search. Viewing individual profiles requires login AND Verified (score 25+).

**Context:** Public search maximises reach (any survivor can find a doctor). Profile privacy prevents mass scraping.

**Consequences:** Unverified users who log in are redirected to their profile with a "submit a claim" prompt instead of the profile they tried to view.

---

## ADR-006: Confirmed cuts

The following were proposed and cut to hit the 28h budget and 4-min demo path:

| Feature | Reason |
|---|---|
| Facial recognition | Accuracy risk + time |
| Device fingerprinting / Face ID | Time |
| Dispute mechanism | Vouch + flag is enough |
| Resource / Information claims | Not in demo path |
| Score decay over time | 28h window — irrelevant |
| Offline / PWA | Internet works in scenario |
| P05 currency / exchange | Out of scope |
| Post for help / help requests | Team decision |
| Skill selection at registration | Defaults to 'Other', set via profile |
| National ID card at signup | Only passport or driving_licence |

---

## ADR-007: All demo data pre-seeded, no live sign-ups required

**Decision:** Ray runs `scripts/seed.ts` before demo. 200 fake Londoners + 3 Gov Officials + Dr. James Osei (BLK-00471-LDN, score 74) are pre-loaded.

**Context:** Live registration during a 4-min demo is too risky. Pre-seeded data guarantees the vouch moment and map density.

**Consequences:** Seed must be re-run if DB is wiped. Demo passwords: `password123` (seed users), `govpassword99` (gov accounts).
