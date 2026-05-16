import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { SkillTag } from '@/types'

const VALID_SKILLS = new Set<string>(['Doctor', 'Nurse', 'Engineer', 'Legal', 'Builder', 'Other'])

const LONDON_BOROUGHS = new Set([
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley', 'Camden',
  'City of London', 'Croydon', 'Ealing', 'Enfield', 'Greenwich', 'Hackney',
  'Hammersmith and Fulham', 'Haringey', 'Harrow', 'Havering', 'Hillingdon',
  'Hounslow', 'Islington', 'Kensington and Chelsea', 'Kingston upon Thames',
  'Lambeth', 'Lewisham', 'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames',
  'Southwark', 'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster',
])

interface InterpretResult {
  skill: SkillTag | null
  borough: string | null
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json()
    if (
      typeof body !== 'object' ||
      body === null ||
      typeof (body as Record<string, unknown>).query !== 'string'
    ) {
      return NextResponse.json({ skill: null, borough: null })
    }
    const query = ((body as Record<string, unknown>).query as string).slice(0, 200)

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 64,
      messages: [
        {
          role: 'user',
          content: `You are a search interpreter for a post-disaster identity system in London.

Given a user's search query, extract:
- skill: the professional skill being sought. Must be exactly one of: Doctor, Nurse, Engineer, Legal, Builder, Other, or null if none applies.
- borough: a London borough name if mentioned, otherwise null.

Query: "${query}"

Respond ONLY with valid JSON in this exact shape:
{"skill": "Doctor" | "Nurse" | "Engineer" | "Legal" | "Builder" | "Other" | null, "borough": string | null}

No other text.`,
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const parsed: InterpretResult = JSON.parse(cleaned)

    const skill = VALID_SKILLS.has(parsed.skill ?? '') ? (parsed.skill as SkillTag) : null
    const borough =
      typeof parsed.borough === 'string' && LONDON_BOROUGHS.has(parsed.borough)
        ? parsed.borough
        : null

    return NextResponse.json({ skill, borough })
  } catch {
    return NextResponse.json({ skill: null, borough: null })
  }
}
