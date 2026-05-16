import { supabaseAdmin } from '@/lib/supabase'
import type { ApiResponse, SkillTag } from '@/types'

// GET /api/find?skill=Doctor&borough=Southwark
// No auth required. Returns aggregated verified user counts by borough+skill.

interface AggResult {
  borough: string
  skill: string
  count: number
  avg_score: number
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const skill = searchParams.get('skill') ?? undefined
  const borough = searchParams.get('borough') ?? undefined

  let query = supabaseAdmin
    .from('users')
    .select('borough, skill, score')
    .gte('score', 50)

  if (skill) query = query.eq('skill', skill as SkillTag)
  if (borough) query = query.eq('borough', borough)

  const { data, error } = await query

  if (error) {
    return Response.json({ success: false, error: 'Failed to fetch results' } satisfies ApiResponse<never>, { status: 500 })
  }

  // Group by borough + skill in JS
  const grouped: Record<string, { count: number; total_score: number }> = {}

  for (const row of data ?? []) {
    if (!row.borough || !row.skill) continue
    const key = `${row.borough}__${row.skill}`
    if (!grouped[key]) grouped[key] = { count: 0, total_score: 0 }
    grouped[key].count++
    grouped[key].total_score += row.score
  }

  const results: AggResult[] = Object.entries(grouped).map(([key, val]) => {
    const [borough, skill] = key.split('__')
    return {
      borough,
      skill,
      count: val.count,
      avg_score: Math.round(val.total_score / val.count),
    }
  })

  results.sort((a, b) => b.count - a.count)

  return Response.json({ success: true, data: results } satisfies ApiResponse<AggResult[]>)
}
