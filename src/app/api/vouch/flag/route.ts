import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { recalculateUserScore } from "@/lib/score";
import { getTier } from "@/types";
import { createNotification } from "@/lib/notifications";
import type { ApiResponse, TrustTier } from "@/types";

const PENALTY_BY_TIER: Record<TrustTier, number> = {
  gov_official: 30,
  trusted: 15,
  verified: 0,
  unverified: 0,
};

interface FlagBody {
  claim_id: string;
}

interface FlagResult {
  penalized_vouchers: number;
}

export async function POST(request: Request): Promise<Response> {
  const flagger = await verifyAuth(request);
  if (!flagger) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 401 });
  }

  let body: FlagBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { claim_id } = body;

  if (!claim_id) {
    return Response.json({ success: false, error: "claim_id is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { data: claim } = await supabaseAdmin
    .from("claims")
    .select("id, user_id, flags")
    .eq("id", claim_id)
    .single();

  if (!claim) {
    return Response.json({ success: false, error: "Claim not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  if (claim.user_id === flagger.id) {
    return Response.json({ success: false, error: "Cannot flag your own claim" } satisfies ApiResponse<never>, { status: 400 });
  }

  const flaggerTier = (flagger.tier ?? getTier(flagger.score ?? 0)) as TrustTier;
  const penalty = PENALTY_BY_TIER[flaggerTier] ?? 0;
  const flagType = flaggerTier === "gov_official"
    ? "Flagged by government official"
    : "Disputed by trusted user";

  await supabaseAdmin
    .from("claims")
    .update({ flags: (claim.flags ?? 0) + 1 })
    .eq("id", claim_id);

  // Penalty cascade: vouchers of the claim owner lose points based on flagger tier.
  // Only trusted and gov_official flaggers trigger a penalty.
  const voucherIds: string[] = [];
  if (penalty > 0) {
    const { data: vouches } = await supabaseAdmin
      .from("vouches")
      .select("voucher_id")
      .eq("vouchee_id", claim.user_id);

    const ids = (vouches ?? []).map((v) => v.voucher_id);
    voucherIds.push(...ids);

    if (ids.length > 0) {
      const { data: vouchers } = await supabaseAdmin
        .from("users")
        .select("id, score")
        .in("id", ids);

      await Promise.all(
        (vouchers ?? []).map(async (v) => {
          const newScore = Math.max(0, (v.score ?? 0) - penalty);
          const newTier = getTier(newScore);
          await supabaseAdmin
            .from("users")
            .update({ score: newScore, tier: newTier })
            .eq("id", v.id);
          await createNotification({
            user_id: v.id,
            type: "claim_verified",
            title: `Trust penalty: ${flagType}`,
            detail: `-${penalty} pts — a claim you vouched for was flagged`,
            icon: "warning",
            color: "#ffb4ab",
          });
        })
      );
    }
  }

  // Direct penalty on the claim owner
  if (penalty > 0) {
    const { data: owner } = await supabaseAdmin
      .from("users")
      .select("id, score, tier")
      .eq("id", claim.user_id)
      .single();

    if (owner && owner.tier !== "gov_official") {
      const newScore = Math.max(0, (owner.score ?? 0) - penalty);
      const newTier = getTier(newScore);
      await supabaseAdmin
        .from("users")
        .update({ score: newScore, tier: newTier })
        .eq("id", claim.user_id);
      await createNotification({
        user_id: claim.user_id,
        type: "claim_verified",
        title: `Trust penalty: ${flagType}`,
        detail: `-${penalty} pts — one of your claims was flagged`,
        icon: "warning",
        color: "#ffb4ab",
      });
    }
  }

  // Auto-reject claim and recalculate owner score at 3+ flags
  if ((claim.flags ?? 0) + 1 >= 3) {
    await supabaseAdmin.from("claims").update({ status: "rejected" }).eq("id", claim_id);
    await recalculateUserScore(claim.user_id);
  }

  return Response.json({
    success: true,
    data: { penalized_vouchers: voucherIds.length },
  } satisfies ApiResponse<FlagResult>);
}
