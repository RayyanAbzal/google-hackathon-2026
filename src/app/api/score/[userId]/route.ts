import { supabaseAdmin } from "@/lib/supabase";
import { getTier } from "@/types";
import type { ApiResponse, TrustTier } from "@/types";

interface ScoreResult {
  score: number;
  tier: TrustTier;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  const { userId } = await params;

  if (!userId) {
    return Response.json({ success: false, error: "userId is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("score")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return Response.json({ success: false, error: "User not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  return Response.json({
    success: true,
    data: { score: data.score, tier: getTier(data.score) },
  } satisfies ApiResponse<ScoreResult>);
}
