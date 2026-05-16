// Validates calculateScore and getTier against Aryan's spec from api/CLAUDE.md
// Run: npx tsx scripts/test-score.ts

import { calculateScore, getTier } from '../src/types/index'

let passed = 0
let failed = 0

function assert(label: string, actual: number | string, expected: number | string) {
  if (actual === expected) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label} — got ${actual}, expected ${expected}`)
    failed++
  }
}

console.log('\n=== calculateScore ===\n')

// No docs → 0
assert('0 docs = 0', calculateScore({ passport_count: 0, other_doc_count: 0, vouches_received: 10, gov_vouched: false }), 0)

// 1 doc, below 5-vouch minimum → capped at 19
assert('1 doc, 4 vouches = capped at 19', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 4, gov_vouched: false }), 19)

// 1 passport, exactly 5 vouches → 20 + 25 = 45
assert('1 passport, 5 vouches = 45', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 5, gov_vouched: false }), 45)

// 2 docs, below 3-vouch minimum → capped at 19
assert('2 docs, 2 vouches = capped at 19', calculateScore({ passport_count: 1, other_doc_count: 1, vouches_received: 2, gov_vouched: false }), 19)

// 2 docs, exactly 3 vouches → 20 + 15 + 15 = 50
assert('2 docs (1 passport + 1 other), 3 vouches = 50', calculateScore({ passport_count: 1, other_doc_count: 1, vouches_received: 3, gov_vouched: false }), 50)

// 3 docs, 2 vouches → 20 + 15 + 15 + 10 = 60
assert('3 docs (1P+2O), 2 vouches = 60', calculateScore({ passport_count: 1, other_doc_count: 2, vouches_received: 2, gov_vouched: false }), 60)

// Cap at 90 without gov vouch — e.g. 3 passports (capped at 3 docs=60) + 10 vouches (50) = 110, capped at 90
assert('3 docs + 10 vouches (no gov) = 90 cap', calculateScore({ passport_count: 3, other_doc_count: 0, vouches_received: 10, gov_vouched: false }), 90)

// Gov vouch bonus — base 90 + 20 = 100
assert('3 docs + 10 vouches + gov vouch = 100', calculateScore({ passport_count: 3, other_doc_count: 0, vouches_received: 10, gov_vouched: true }), 100)

// Gov vouch on lower base — e.g. 1P + 5 vouches = 45, + 20 gov = 65
assert('1 passport, 5 vouches, gov vouch = 65', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 5, gov_vouched: true }), 65)

// Vouches capped at 10 — 15 vouches should count same as 10
assert('10+ vouches count same as 10', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 15, gov_vouched: false }), calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 10, gov_vouched: false }))

// Docs beyond 3 ignored
assert('4 passports counted same as 3', calculateScore({ passport_count: 4, other_doc_count: 0, vouches_received: 3, gov_vouched: false }), calculateScore({ passport_count: 3, other_doc_count: 0, vouches_received: 3, gov_vouched: false }))

console.log('\n=== getTier ===\n')

// Tier thresholds: 0-19 unverified, 20-54 verified, 55-90 trusted, 91-100 gov_official
assert('score 0 = unverified', getTier(0), 'unverified')
assert('score 19 = unverified', getTier(19), 'unverified')
assert('score 20 = verified', getTier(20), 'verified')
assert('score 54 = verified', getTier(54), 'verified')
assert('score 55 = trusted', getTier(55), 'trusted')
assert('score 90 = trusted', getTier(90), 'trusted')
assert('score 91 = gov_official', getTier(91), 'gov_official')
assert('score 100 = gov_official', getTier(100), 'gov_official')

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
