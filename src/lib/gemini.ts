import { GoogleGenerativeAI } from '@google/generative-ai'
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

function normalizeMimeType(mimeType: string): string {
  if (mimeType === 'image/jpg') return 'image/jpeg'
  return mimeType || 'image/jpeg'
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
  imageBase64Back?: string,
  mimeTypeBack?: string,
): Promise<DocumentAnalysis> {
  const model = getGeminiModel()

  const isTwoSided = Boolean(imageBase64Back)

  const prompt = `You are a careful OCR and identity-document extraction engine.
The expected broad document category is: ${docType}.
${isTwoSided ? `You are given two images of the same document: image 1 is the front side and image 2 is the back side. Combine fields from both sides — the name and photo are typically on the front, the MRZ and expiry are typically on the data page or back.\n` : ''}
Read the document image directly. Do not assume the country from the expected category. If the document has an MRZ at the bottom, use it as a fallback:
- For an MRZ like P<NZLWHAKAAHUA<<AROHA<MARY<RAUMATI..., extract surname WHAKAAHUA and given names AROHA MARY RAUMATI.
- Convert MRZ names into normal spacing as "AROHA MARY RAUMATI WHAKAAHUA" unless the visual name field clearly shows another order.

Extract these fields:
- full_name: the person's full legal name
- document_id: the unique document identifier — driver licence number, passport number, certificate number, or equivalent printed on the document (null if not present or not legible)
- document_type: the specific document type, including country if visible (for example "New Zealand Passport")
- document_category: exactly "passport", "driving_licence", or "other". Use "passport" only for passports. Use "driving_licence" only for driver's licences / driving licences / driver licenses. Use "other" for every other document, including IDs, visas, certificates, bank cards, health cards, or documents you cannot classify.
- expiry_date: the document expiry/expiration date in ISO format YYYY-MM-DD if visible. If no expiry date is visible, return null.
- country: issuing country or jurisdiction if visible (null if not visible)
- institution: issuing institution or employer (null if not applicable)
- confidence: a float 0.0-1.0 indicating how clearly the key fields are legible across ${isTwoSided ? 'both sides' : 'the document'}

Respond ONLY with valid JSON in this exact shape:
{"full_name": string | null, "document_id": string | null, "document_type": string | null, "document_category": "passport" | "driving_licence" | "other", "expiry_date": string | null, "country": string | null, "institution": string | null, "confidence": number}

No other text.`

  const parts: Parameters<typeof model.generateContent>[0] = [
    prompt,
    { inlineData: { mimeType: normalizeMimeType(mimeType), data: imageBase64 } },
  ]
  if (imageBase64Back) {
    parts.push({ inlineData: { mimeType: normalizeMimeType(mimeTypeBack ?? mimeType), data: imageBase64Back } })
  }

  try {
    const result = await model.generateContent(parts)

    const raw = result.response.text().trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const jsonText = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw
    const parsed: {
      full_name: string | null
      document_id?: string | null
      document_type?: string | null
      document_category?: 'passport' | 'driving_licence' | 'other' | null
      expiry_date?: string | null
      country?: string | null
      institution: string | null
      confidence: number
    } =
      JSON.parse(jsonText)

    return {
      extracted_name: parsed.full_name ?? null,
      document_id: parsed.document_id ?? null,
      doc_type: parsed.document_type ?? docType,
      document_category: parsed.document_category ?? null,
      expiry_date: parsed.expiry_date ?? null,
      country: parsed.country ?? null,
      institution: parsed.institution ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    }
  } catch (error) {
    console.error('Gemini document analysis failed', {
      error,
      docType,
      mimeType: normalizeMimeType(mimeType),
      base64Length: imageBase64.length,
    })
    return { extracted_name: null, document_id: null, doc_type: docType, document_category: null, expiry_date: null, institution: null, confidence: 0 }
  }
}
