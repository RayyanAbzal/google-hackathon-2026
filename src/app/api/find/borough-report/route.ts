import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const LONDON_BOROUGHS = new Set([
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
  'City of London', 'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney',
  'Hammersmith and Fulham', 'Haringey', 'Harrow', 'Havering', 'Hillingdon',
  'Hounslow', 'Islington', 'Kensington and Chelsea', 'Kingston upon Thames',
  'Lambeth', 'Lewisham', 'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames',
  'Southwark', 'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster',
])

interface BoroughReportBody {
  borough: string
  counts: Record<string, number>
  total: number
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json()
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as BoroughReportBody).borough !== 'string' ||
      typeof (body as BoroughReportBody).total !== 'number'
    ) {
      return NextResponse.json({ report: '' })
    }

    const { borough, counts, total } = body as BoroughReportBody

    if (!LONDON_BOROUGHS.has(borough)) {
      return NextResponse.json({ report: '' })
    }

    const skillLines = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .map(([skill, n]) => `${skill}: ${n}`)
      .join(', ')

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 80,
      messages: [
        {
          role: 'user',
          content: `You are an emergency coordination AI for post-disaster London. Write exactly 2 short sentences assessing ${borough}'s verified professional coverage.

Data: ${total} verified professionals total. Breakdown — ${skillLines || 'none yet'}.

Rules: mention the strongest skill group, flag the biggest gap, use urgent/operational tone. No fluff. No bullet points. Plain sentences only.`,
        },
      ],
    })

    const report = message.content[0].type === 'text' ? message.content[0].text.trim() : ''
    return NextResponse.json({ report })
  } catch {
    return NextResponse.json({ report: '' })
  }
}
