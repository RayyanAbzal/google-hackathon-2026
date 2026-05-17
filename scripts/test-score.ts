// Validates calculateScore and getTier against current CivicTrust scoring rules
// Run: npx tsx scripts/test-score.ts

import { calculateScore, getTier } from '../src/types/index'

let passed = 0
let failed = 0

function assert(label: string, actual: number | string, expected: number | string) {
  if (actual === expected) {
    console.log(`  PASS  ${label}`)
    passed++
  } else {
    console.error(`  FAIL  ${label} - got ${actual}, expected ${expected}`)
    failed++
  }
}

console.log('\n=== calculateScore ===\n')

assert('0 docs = 0', calculateScore({ passport_count: 0, other_doc_count: 0, vouches_received: 10, gov_vouched: false }), 0)
assert('1 passport, 0 vouches = 20', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 0, gov_vouched: false }), 20)
assert('1 passport, 5 vouches = 45', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 5, gov_vouched: false }), 45)
assert('1 passport + 1 other, 0 vouches = 35', calculateScore({ passport_count: 1, other_doc_count: 1, vouches_received: 0, gov_vouched: false }), 35)
assert('2 docs (1 passport + 1 other), 3 vouches = 50', calculateScore({ passport_count: 1, other_doc_count: 1, vouches_received: 3, gov_vouched: false }), 50)
assert('3 docs (1P+2O), 2 vouches = 60', calculateScore({ passport_count: 1, other_doc_count: 2, vouches_received: 2, gov_vouched: false }), 60)
assert('3 docs + 10 vouches (no gov) = 90 cap', calculateScore({ passport_count: 3, other_doc_count: 0, vouches_received: 10, gov_vouched: false }), 90)
assert('3 docs + 10 vouches + gov_vouched flag = 90 cap', calculateScore({ passport_count: 3, other_doc_count: 0, vouches_received: 10, gov_vouched: true }), 90)
assert('1 passport, 5 default vouches, gov_vouched flag only = 45', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 5, gov_vouched: true }), 45)
assert('10+ vouches count same as 10', calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 15, gov_vouched: false }), calculateScore({ passport_count: 1, other_doc_count: 0, vouches_received: 10, gov_vouched: false }))
assert('4 passports counted same as 3', calculateScore({ passport_count: 4, other_doc_count: 0, vouches_received: 3, gov_vouched: false }), calculateScore({ passport_count: 3, other_doc_count: 0, vouches_received: 3, gov_vouched: false }))

console.log('\n=== getTier ===\n')

assert('score 0 = unverified', getTier(0), 'unverified')
assert('score 19 = unverified', getTier(19), 'unverified')
assert('score 20 = verified', getTier(20), 'verified')
assert('score 54 = verified', getTier(54), 'verified')
assert('score 55 = trusted', getTier(55), 'trusted')
assert('score 90 = trusted', getTier(90), 'trusted')
assert('score 91 = trusted', getTier(91), 'trusted')
assert('score 100 = gov_official', getTier(100), 'gov_official')

console.log(`\n${passed} passed, ${failed} failed\n`)
if (failed > 0) process.exit(1)
