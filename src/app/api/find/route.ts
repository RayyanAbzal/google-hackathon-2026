import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import type { ApiResponse } from "@/types";

// GET /api/find
// Owner: Tao
// Query params: skill?, resource?, borough?
// Public Yellow Pages endpoint.
// Returns anonymous aggregate results only: borough + skill/resource + count + avg_score.
// Does NOT return names, user IDs, usernames, or profile details.

interface FindResult {
  type: "skill" | "resource";
  borough: string;
  skill?: string;
  resource?: string;
  count: number;
  avg_score?: number;
  urgent_count?: number;
}

interface UserRow {
  borough: string | null;
  skill: string | null;
  score: number | null;
}

interface HelpPostRow {
  borough: string | null;
  resource_tag: string | null;
  skill_tag: string | null;
  urgency: string | null;
  content: string | null;
}

function cleanQuery(value: string | null): string | null {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function includesIgnoreCase(value: string | null | undefined, query: string): boolean {
  return (value ?? "").toLowerCase().includes(query.toLowerCase());
}

function buildSkillAggregates(users: UserRow[]): FindResult[] {
  const groups = new Map<string, { borough: string; skill: string; count: number; totalScore: number }>();

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
      groups.set(key, { borough, skill, count: 1, totalScore: score });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      type: "skill" as const,
      borough: group.borough,
      skill: group.skill,
      count: group.count,
      avg_score: Math.round(group.totalScore / group.count),
    }))
    .sort((a, b) => b.count - a.count || a.borough.localeCompare(b.borough));
}

function buildResourceAggregates(posts: HelpPostRow[], resourceQuery: string): FindResult[] {
  const groups = new Map<string, { borough: string; resource: string; count: number; urgentCount: number }>();

  for (const post of posts) {
    const borough = post.borough?.trim() || "Unknown";
    const resource =
      post.resource_tag?.trim() ||
      post.skill_tag?.trim() ||
      resourceQuery;

    const key = `${borough}::${resource}`;
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      if (post.urgency === "high") existing.urgentCount += 1;
    } else {
      groups.set(key, {
        borough,
        resource,
        count: 1,
        urgentCount: post.urgency === "high" ? 1 : 0,
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      type: "resource" as const,
      borough: group.borough,
      resource: group.resource,
      count: group.count,
      urgent_count: group.urgentCount,
    }))
    .sort((a, b) => b.count - a.count || a.borough.localeCompare(b.borough));
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<FindResult[]>>> {
  const { searchParams } = new URL(request.url);

  const skill = cleanQuery(searchParams.get("skill"));
  const resource = cleanQuery(searchParams.get("resource"));
  const borough = cleanQuery(searchParams.get("borough"));

  const results: FindResult[] = [];

  // Search verified users by skill.
  // "Verified" means score >= 50 in the current build plan.
  if (skill || !resource) {
    let userQuery = supabaseAdmin
      .from("users")
      .select("borough, skill, score")
      .gte("score", 50)
      .limit(1000);

    if (skill) {
      userQuery = userQuery.ilike("skill", `%${skill}%`);
    }

    if (borough) {
      userQuery = userQuery.ilike("borough", `%${borough}%`);
    }

    const { data: users, error } = await userQuery;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to search verified users",
        } satisfies ApiResponse<FindResult[]>,
        { status: 500 }
      );
    }

    results.push(...buildSkillAggregates((users ?? []) as UserRow[]));
  }

  // Search active help/resource posts.
  // This is useful for queries like /api/find?resource=insulin.
  if (resource) {
    let helpQuery = supabaseAdmin
      .from("help_posts")
      .select("borough, resource_tag, skill_tag, urgency, content")
      .gt("expires_at", new Date().toISOString())
      .limit(1000);

    if (borough) {
      helpQuery = helpQuery.ilike("borough", `%${borough}%`);
    }

    const { data: posts, error } = await helpQuery;

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to search active help posts",
        } satisfies ApiResponse<FindResult[]>,
        { status: 500 }
      );
    }

    const matchingPosts = ((posts ?? []) as HelpPostRow[]).filter((post) => {
      return (
        includesIgnoreCase(post.resource_tag, resource) ||
        includesIgnoreCase(post.skill_tag, resource) ||
        includesIgnoreCase(post.content, resource)
      );
    });

    results.push(...buildResourceAggregates(matchingPosts, resource));
  }

  return NextResponse.json({
    success: true,
    data: results,
  } satisfies ApiResponse<FindResult[]>);
}