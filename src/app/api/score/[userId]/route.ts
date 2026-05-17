import { supabaseAdmin } from "@/lib/supabase";
import { recalculateUserScore } from "@/lib/score";
import { getTier } from "@/types";
import type { ApiResponse, TrustTier } from "@/types";

interface ScoreResult {
  score: number;
  tier: TrustTier;
  passport_count: number;
  other_doc_count: number;
  vouches_received: number;
  eligible_vouches: number;
  weighted_vouch_points: number;
  gov_vouched: boolean;
}

function vouchPointsForTier(tier: TrustTier): number {
  if (tier === "gov_official") return 10;
  if (tier === "trusted") return 6.25;
  if (tier === "verified") return 5;
  return 0;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  const { userId } = await params;

  if (!userId) {
    return Response.json({ success: false, error: "userId is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const userExistsResult = await supabaseAdmin.from("users").select("id").eq("id", userId).single();
  if (userExistsResult.error || !userExistsResult.data) {
    return Response.json({ success: false, error: "User not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  const recalculated = await recalculateUserScore(userId);

  const [claimsResult, vouchesCountResult, vouchersResult] = await Promise.all([
    supabaseAdmin.from("claims").select("doc_type").eq("user_id", userId).eq("status", "verified"),
    supabaseAdmin.from("vouches").select("*", { count: "exact", head: true }).eq("vouchee_id", userId),
    supabaseAdmin.from("vouches").select("voucher_id").eq("vouchee_id", userId),
  ]);

  const claims = claimsResult.data ?? [];
  const passport_count = claims.filter((c) => c.doc_type === "passport").length;
  const other_doc_count = claims.filter((c) => c.doc_type !== "passport").length;
  const vouches_received = vouchesCountResult.count ?? 0;

  const voucherIds = (vouchersResult.data ?? []).map((v) => v.voucher_id);
  let gov_vouched = false;
  let weighted_vouch_points = 0;
  let eligible_vouches = 0;
  if (voucherIds.length > 0) {
    const { data: voucherUsers } = await supabaseAdmin
      .from("users")
      .select("score, tier")
      .in("id", voucherIds);

    for (const voucherUser of voucherUsers ?? []) {
      const tier = (voucherUser.tier ?? getTier(voucherUser.score ?? 0)) as TrustTier;
      const points = vouchPointsForTier(tier);
      if (points <= 0) continue;
      eligible_vouches += 1;
      weighted_vouch_points += points;
      if (tier === "gov_official") gov_vouched = true;
    }
  }

  return Response.json({
    success: true,
    data: {
      score: recalculated.score,
      tier: recalculated.tier,
      passport_count,
      other_doc_count,
      vouches_received,
      eligible_vouches,
      weighted_vouch_points,
      gov_vouched,
    },
  } satisfies ApiResponse<ScoreResult>);
}
