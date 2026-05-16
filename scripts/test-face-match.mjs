/**
 * Tests whether Gemini Vision can reliably match a face on a photo ID
 * against a selfie. Run this before committing to face-match as a feature.
 *
 * Usage:
 *   1. Add GEMINI_API_KEY to .env.local
 *   2. Place two test images in scripts/test-images/:
 *      - id-photo.jpg  (a face on a passport/ID-style photo)
 *      - selfie.jpg    (a selfie of the same person)
 *      - other-face.jpg (a different person — tests rejection)
 *   3. node scripts/test-face-match.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load API key from .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const env = fs.existsSync(envPath)
  ? Object.fromEntries(
      fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => l.split('=').map(s => s.trim()))
    )
  : {}

const API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY

if (!API_KEY) {
  console.error('❌  GEMINI_API_KEY not set in .env.local')
  process.exit(1)
}

const IMAGES_DIR = path.join(__dirname, 'test-images')

if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
  console.log(`📁  Created ${IMAGES_DIR}`)
  console.log('    Add these files then re-run:')
  console.log('    - scripts/test-images/id-photo.jpg   (face on ID doc)')
  console.log('    - scripts/test-images/selfie.jpg     (same person selfie)')
  console.log('    - scripts/test-images/other-face.jpg (different person)')
  process.exit(0)
}

function imageToBase64(filename) {
  const filePath = path.join(IMAGES_DIR, filename)
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️   Missing: ${filename} — skipping this test`)
    return null
  }
  return fs.readFileSync(filePath).toString('base64')
}

async function compareFaces(label, idImageB64, selfieB64) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

  const body = {
    contents: [{
      parts: [
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: idImageB64
          }
        },
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: selfieB64
          }
        },
        {
          text: `Image 1 is a government-issued photo ID document (passport or driving licence). Image 2 is a selfie photo.

Do these two images appear to show the same person?

Respond with JSON only, no markdown:
{
  "match": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "brief explanation"
}`
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  return JSON.parse(text)
}

async function run() {
  console.log('\n🔬  CivicTrust — Gemini Face-Match Test\n')
  console.log('  Threshold for acceptance: confidence > 0.75')
  console.log('  ─────────────────────────────────────────\n')

  const idPhoto   = imageToBase64('id-photo.jpg')
  const selfie    = imageToBase64('selfie.jpg')
  const otherFace = imageToBase64('other-face.jpg')

  let passed = 0
  let failed = 0
  let skipped = 0

  // Test 1: Same person — should match
  if (idPhoto && selfie) {
    process.stdout.write('  Test 1: Same person (ID photo vs selfie) ... ')
    try {
      const result = await compareFaces('same-person', idPhoto, selfie)
      const pass = result.match === true && result.confidence >= 0.75
      console.log(pass ? '✅  PASS' : '❌  FAIL')
      console.log(`    match=${result.match}  confidence=${result.confidence}`)
      console.log(`    reason: ${result.reason}`)
      pass ? passed++ : failed++
    } catch (e) {
      console.log(`💥  ERROR: ${e.message}`)
      failed++
    }
  } else {
    console.log('  Test 1: Skipped (missing images)')
    skipped++
  }

  console.log()

  // Test 2: Different person — should NOT match
  if (idPhoto && otherFace) {
    process.stdout.write('  Test 2: Different person (should be rejected) ... ')
    try {
      const result = await compareFaces('different-person', idPhoto, otherFace)
      const pass = result.match === false || result.confidence < 0.75
      console.log(pass ? '✅  PASS (correctly rejected)' : '❌  FAIL (false positive)')
      console.log(`    match=${result.match}  confidence=${result.confidence}`)
      console.log(`    reason: ${result.reason}`)
      pass ? passed++ : failed++
    } catch (e) {
      console.log(`💥  ERROR: ${e.message}`)
      failed++
    }
  } else {
    console.log('  Test 2: Skipped (missing other-face.jpg)')
    skipped++
  }

  console.log()
  console.log('  ─────────────────────────────────────────')
  console.log(`  Results: ${passed} passed, ${failed} failed, ${skipped} skipped`)
  console.log()

  if (failed === 0 && passed > 0) {
    console.log('  ✅  Face-match looks viable. Build it.')
    console.log('     Recommendation: ship face-match as a feature.')
  } else if (failed > 0) {
    console.log('  ⚠️   Face-match unreliable. Consider fallback.')
    console.log('     Fallback: Gemini extracts name from doc, check it matches registered name.')
    console.log('     Simpler, reliable, still impressive.')
  } else {
    console.log('  ⚠️   No tests ran. Add images to scripts/test-images/ and re-run.')
  }

  console.log()
}

run().catch(e => {
  console.error('Fatal:', e.message)
  process.exit(1)
})
