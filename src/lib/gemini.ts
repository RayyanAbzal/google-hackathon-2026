import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import type { DocumentAnalysis } from '@/types'

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0,
    },
  })
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY // service role to bypass RLS
  if (!url || !key) throw new Error('Supabase env vars not set')
  return createClient(url, key)
}

function normalizeMimeType(mimeType: string): string {
  if (mimeType === 'image/jpg') return 'image/jpeg'
  return mimeType || 'image/jpeg'
}

function toTitleCase(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel()
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function analyseDocument(
  imageBase64: string,
  docType: string,
  mimeType = 'image/jpeg',
  userId?: string  // pass this in from your calling code
): Promise<DocumentAnalysis> {
  const model = getGeminiModel()

  const prompt = `You are a careful OCR and identity-document extraction engine.
The expected broad document category is: ${docType}.

IMPORTANT: Extract the FULL name of the person on this document. Look for:
1. Printed name fields on the document
2. MRZ (Machine Readable Zone) at the bottom for passports/visas
3. Any name printed on the front/back of the document

For MRZ: If document has an MRZ like P<NZLWHAKAAHUA<<AROHA<MARY<RAUMATI..., extract "AROHA MARY RAUMATI WHAKAAHUA" (convert spaces correctly).

Extract these fields:
- full_name: the complete legal name exactly as shown on the document (REQUIRED - do not leave null if any name is visible)
- document_type: the specific document type with country (e.g. "UK Passport", "US Driving Licence")
- country: issuing country if visible
- institution: issuing institution/employer (if applicable, else null)
- confidence: 0.0-1.0 score for name legibility

Respond ONLY with valid JSON:
{"full_name": string | null, "document_type": string | null, "country": string | null, "institution": string | null, "confidence": number}`

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: normalizeMimeType(mimeType), data: imageBase64 } },
    ])

    const raw = result.response.text().trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw
    const parsed: {
      full_name: string | null
      document_type?: string | null
      country?: string | null
      institution: string | null
      confidence: number
    } = JSON.parse(jsonText)

    const extracted_name = parsed.full_name ? parsed.full_name.trim() : null
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0

    console.log('Gemini extraction result', {
      docType,
      extracted_name,
      confidence,
      document_type: parsed.document_type,
    })

    // Save to Supabase `claims` table
    if (userId && extracted_name) {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('claims')
        .upsert(
          {
            user_id: userId,
            extracted_name,
            user_display_name: toTitleCase(extracted_name),
            confidence,
            status: confidence >= 0.8 ? 'verified' : 'unverified',
          },
          { onConflict: 'user_id' } // update if this user already has a claim
        )

      if (error) {
        console.error('Supabase upsert failed', error)
      } else {
        console.log('Claim saved to Supabase', { user_id: userId, extracted_name, confidence })
      }
    }

    return {
      extracted_name,
      doc_type: docType,
      document_type: parsed.document_type ? parsed.document_type.trim() : docType,
      country: parsed.country ?? null,
      institution: parsed.institution ? parsed.institution.trim() : null,
      confidence,
    }
  } catch (error) {
    console.error('Gemini document analysis failed', {
      error: error instanceof Error ? error.message : String(error),
      docType,
      mimeType: normalizeMimeType(mimeType),
      base64Length: imageBase64.length,
    })
    return { extracted_name: null, doc_type: docType, document_type: docType, institution: null, confidence: 0 }
  }
}

// Helper to fetch a claim from Supabase by user_id
export async function getClaimByUserId(userId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from('claims')
    .select('user_id, extracted_name, user_display_name, confidence, status')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Supabase fetch failed', error)
    return null
  }
  return data
}