import { supabaseAdmin } from "@/lib/supabase";
import type { ApiResponse } from "@/types";

// GET /api/find
// Owner: Tao
// Public Yellow Pages endpoint.
// Query params: skill?, borough?
//
// Flow alignment:
// - No auth required
// - Only verified users: score >= 50
// - Aggregate by borough + skill
// - Never return names, usernames, user IDs, node IDs, or profile details
// - Help/resource search is intentionally paused for MVP

interface FindResult {
  borough: string;
  skill: string;
  count: number;
  avg_score: number;
}

interface UserRow {
  borough: string | null;
  skill: string | null;
  score: number | null;
}

function cleanQuery(value: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function buildAggregates(users: UserRow[]): FindResult[] {
  const groups = new Map<
    string,
    {
      borough: string;
      skill: string;
      count: number;
      totalScore: number;
    }
  >();

  for (const user of users) {
    const borough = user.borough?.trim() || "Unknown";
    const skill = user.skill?.trim() || "Other";
    const score = user.score ?? 0;
    const key = `${borough}::${skill}`;

    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      existing.totalScore += score;
    } else {
      groups.set(key, {
        borough,
        skill,
        count: 1,
        totalScore: score,
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      borough: group.borough,
      skill: group.skill,
      count: group.count,
      avg_score: Math.round(group.totalScore / group.count),
    }))
    .sort((a, b) => b.count - a.count || a.borough.localeCompare(b.borough));
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);

  const skill = cleanQuery(searchParams.get("skill"));
  const borough = cleanQuery(searchParams.get("borough"));

  let query = supabaseAdmin
    .from("users")
    .select("borough, skill, score")
    .gte("score", 50)
    .limit(1000);

  if (skill) {
    query = query.ilike("skill", `%${skill}%`);
  }

  if (borough) {
    query = query.ilike("borough", `%${borough}%`);
  }

  const { data, error } = await query;

  if (error) {
    return Response.json(
      {
        success: false,
        error: "Failed to search verified users",
      } satisfies ApiResponse<FindResult[]>,
      { status: 500 }
    );
  }

  return Response.json({
    success: true,
    data: buildAggregates((data ?? []) as UserRow[]),
  } satisfies ApiResponse<FindResult[]>);
}