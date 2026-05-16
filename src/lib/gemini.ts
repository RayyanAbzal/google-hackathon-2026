import { GoogleGenerativeAI } from '@google/generative-ai'
import type { DocumentAnalysis } from '@/types'

function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set')
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: 'gemini-2.0-flash',
  })
}

export async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel()
  const result = await model.generateContent(prompt)
  return result.response.text()
}

export async function analyseDocument(
  imageBase64: string,
  docType: string
): Promise<DocumentAnalysis> {
  const model = getGeminiModel()

  const prompt = `You are verifying a ${docType} document for a post-disaster identity system.
Extract the following fields exactly as they appear on the document:
- full_name: the person's full legal name
- institution: issuing institution or employer (null if not applicable)
- confidence: a float 0.0-1.0 indicating how clearly legible and authentic the document appears

Respond ONLY with valid JSON in this exact shape:
{"full_name": string | null, "institution": string | null, "confidence": number}

No other text.`

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
    ])

    const raw = result.response.text().trim()
    const parsed: { full_name: string | null; institution: string | null; confidence: number } =
      JSON.parse(raw)

    return {
      extracted_name: parsed.full_name ?? null,
      doc_type: docType,
      institution: parsed.institution ?? null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    }
  } catch {
    return { extracted_name: null, doc_type: docType, institution: null, confidence: 0 }
  }
}
