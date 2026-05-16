/**
 * Gemini integration test
 * Usage:
 *   npx tsx scripts/test-gemini.ts                                      # garbage-only test
 *   npx tsx scripts/test-gemini.ts <file> <doc_type> ["Your Name"]      # real file test
 *
 * Example:
 *   npx tsx scripts/test-gemini.ts passport.jpg passport "Aryan Shah"
 *   npx tsx scripts/test-gemini.ts passport.pdf passport "Aryan Shah"
 */

import * as fs from 'fs'
import * as path from 'path'

// Load .env.local before importing anything that reads process.env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DocumentAnalysis } from '../src/types'

// "hello" encoded — not a valid image at all
const GARBAGE_B64 = 'aGVsbG8='

function mimeTypeForFile(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  switch (ext) {
    case '.pdf': return 'application/pdf'
    case '.png': return 'image/png'
    case '.webp': return 'image/webp'
    case '.gif': return 'image/gif'
    default: return 'image/jpeg'
  }
}

// For PDFs and non-JPEG files we call Gemini directly with the correct MIME type
// (analyseDocument hardcodes image/jpeg which breaks PDFs)
async function analyseFile(fileBase64: string, mimeType: string, docType: string): Promise<DocumentAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are verifying a ${docType} document for a post-disaster identity system.
Extract the following fields exactly as they appear on the document:
- full_name: the person's full legal name
- institution: issuing institution or employer (null if not applicable)
- confidence: a float 0.0-1.0 indicating how clearly legible and authentic the document appears

Respond ONLY with valid JSON in this exact shape:
{"full_name": string | null, "institution": string | null, "confidence": number}

No other text.`

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: fileBase64 } },
  ])
  const raw = result.response.text().trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  console.log(`│  Raw Gemini response: ${raw.slice(0, 300)}`)
  const parsed = JSON.parse(raw) as { full_name: string | null; institution: string | null; confidence: number }
  return {
    extracted_name: parsed.full_name ?? null,
    doc_type: docType,
    institution: parsed.institution ?? null,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
  }
}

interface TestCase {
  name: string
  fileBase64: string
  mimeType: string
  docType: string
  simulatedUserName?: string
}

const cases: TestCase[] = [
  {
    name: 'Garbage bytes (not a real image)',
    fileBase64: GARBAGE_B64,
    mimeType: 'image/jpeg',
    docType: 'passport',
  },
]

// Args: <file_path> <doc_type> ["Simulated Name"]
const filePath = process.argv[2]
const docType = process.argv[3] ?? 'passport'
const simulatedName = process.argv[4]

if (filePath) {
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`)
    process.exit(1)
  }
  const fileBase64 = fs.readFileSync(abs).toString('base64')
  const mimeType = mimeTypeForFile(abs)
  console.log(`Loaded ${path.basename(abs)} — ${Math.round(fileBase64.length / 1024)}KB base64 (${mimeType})\n`)
  cases.push({
    name: `Real file: ${path.basename(abs)}`,
    fileBase64,
    mimeType,
    docType,
    simulatedUserName: simulatedName,
  })
}

function nameMatches(extracted: string | null, displayName: string): boolean {
  if (!extracted) return true // no name extracted → pass through, confidence decides
  const a = displayName.toLowerCase()
  const b = extracted.toLowerCase()
  return a.includes(b) || b.includes(a)
}

async function run() {
  console.log('=== Gemini document analysis tests ===\n')

  for (const tc of cases) {
    console.log(`┌─ ${tc.name}`)
    console.log(`│  doc_type : ${tc.docType}`)
    console.log(`│  mime     : ${tc.mimeType}`)

    const start = Date.now()
    try {
      const result = await analyseFile(tc.fileBase64, tc.mimeType, tc.docType)
      const ms = Date.now() - start

      console.log(`│  Gemini responded in ${ms}ms`)
      console.log(`│  extracted_name : ${result.extracted_name ?? '(null)'}`)
      console.log(`│  institution    : ${result.institution ?? '(null)'}`)
      console.log(`│  confidence     : ${result.confidence.toFixed(3)}`)

      const confOk = result.confidence >= 0.5
      const nameOk = tc.simulatedUserName
        ? nameMatches(result.extracted_name, tc.simulatedUserName)
        : true

      const verdict = confOk && nameOk ? '✓ ACCEPTED' : '✗ REJECTED'
      const reason = !confOk
        ? 'confidence < 0.5'
        : !nameOk
          ? `name mismatch ("${result.extracted_name}" vs "${tc.simulatedUserName}")`
          : ''

      console.log(`│  Claims verdict : ${verdict}${reason ? ` — ${reason}` : ''}`)
    } catch (e) {
      const ms = Date.now() - start
      console.log(`│  ERROR after ${ms}ms:`)
      console.log(`│  ${e instanceof Error ? e.stack ?? e.message : String(e)}`)
    }

    console.log('└─\n')
  }

  console.log('Done.')
}

run().catch((e) => {
  console.error('Fatal:', e)
  process.exit(1)
})
