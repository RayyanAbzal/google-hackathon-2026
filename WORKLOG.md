# WORKLOG

**Updated:** 2026-05-17 — evidence/claims document verification session

## Active task
Add-evidence page: document ID extraction, expiry date check, strict name matching — all wired end-to-end

## Phase
testing

## Files changed this session
- `src/lib/gemini.ts` — prompt now extracts `document_id`, `expiry_date`, `document_category`; all three returned in analysis object
- `src/types/index.ts` — `DocumentAnalysis` gains `document_id`, `expiry_date`, `document_category`; `Claim` gains `document_id`, `expiry_date`
- `src/app/api/claims/route.ts` — added `namesMatch()` (strict word-by-word token check), `isExpired()`, document_id global dedup (409 if same doc ID on another account), expiry reject, `expired` rejection reason, both new fields stored in DB inserts
- `src/lib/fallbacks.ts` — fallback analysis updated with `document_id: null`, `expiry_date: null`, `document_category`
- `src/app/api/auth/register/route.ts` — fallback analysis updated with `document_id: null`
- `src/app/add-evidence/page.tsx` — analysis grid shows Document ID + Expiry date cards; expiry shown red if past; `expired` rejection message added; `ClaimResult.rejection_reason` union extended
- `scripts/test-gemini.ts` — updated to parse/return `document_id`

## Next step
Manual test: log in as "Rayyan Abzal" (node BLK-64065-LDN, password test1234), submit driver's licence photo on /add-evidence, verify Document ID and Expiry date appear in analysis grid

## Open questions
- Test suite: 9/12 tests fail due to Node.js 21 missing native WebSocket — pre-existing, not caused by this session, left unfixed (2.5hrs to presentation, too risky to change Node version)
- Scoring formula multipliers still not tuned (carried over from previous session)

## Key decisions
- Strict name check: every word in `display_name` must appear as exact uppercase token in `extracted_name`. Extra middle names on doc OK; one letter substituted = fail. Advisor confirmed this is correct — loosening the gate defeats identity verification.
- Document ID dedup: hard 409 if same `document_id` appears on a different account (scammer signal). Same account re-submission: blocked by content_hash check first.
- Expiry check: `isExpired(expiryDate)` — if doc has expiry and it's in the past, reject with `expired` reason. Docs without expiry (degree, utility bill) pass this check automatically (null = not expired).
- `document_category` added by Maalav in his pull; `document_id` + expiry wiring was missing from his version — added in this session.
- Test account created: display_name "Rayyan Abzal", password "test1234", node BLK-64065-LDN
- DB migrations applied: `claims.document_id` (text, indexed), `claims.expiry_date` (date)
