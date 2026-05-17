import { supabaseAdmin } from "./supabase";
import { calculateScore, getEligibleTier, getTier } from "@/types";
import { createNotification } from "@/lib/notifications";
import type { TrustTier } from "@/types";

function vouchPointsForTier(tier: TrustTier): number {
  if (tier === "gov_official") return 10;
  if (tier === "trusted") return 6.25;
  if (tier === "verified") return 5;
  return 0;
}

export async function recalculateUserScore(
  userId: string
): Promise<{ score: number; tier: TrustTier }> {
  const [claimsResult, { count: vouchesCount }, vouchersResult, userResult] =
    await Promise.all([
      supabaseAdmin
        .from("claims")
        .select("doc_type")
        .eq("user_id", userId)
        .eq("status", "verified"),
      supabaseAdmin
        .from("vouches")
        .select("*", { count: "exact", head: true })
        .eq("vouchee_id", userId),
      supabaseAdmin
        .from("vouches")
        .select("voucher_id")
        .eq("vouchee_id", userId),
      supabaseAdmin
        .from("users")
        .select("score, tier")
        .eq("id", userId)
        .single(),
    ]);

  const previousTier = userResult.data?.tier as TrustTier | undefined;
  if (previousTier === "gov_official") {
    await supabaseAdmin.from("users").update({ score: 100, tier: "gov_official" }).eq("id", userId);
    return { score: 100, tier: "gov_official" };
  }

  const claims = claimsResult.data ?? [];
  const passport_count = claims.filter((c) => c.doc_type === "passport").length;
  const other_doc_count = claims.filter((c) => c.doc_type !== "passport").length;

  // Check if any voucher is a gov anchor
  const voucherIds = (vouchersResult.data ?? []).map((v) => v.voucher_id);
  let gov_vouched = false;
  let eligibleVouches = 0;
  let weighted_vouch_points = 0;
  if (voucherIds.length > 0) {
    const { data: voucherUsers } = await supabaseAdmin
      .from("users")
      .select("id, score, tier")
      .in("id", voucherIds);

    for (const voucherUser of voucherUsers ?? []) {
      const tier = (voucherUser.tier ?? getTier(voucherUser.score ?? 0)) as TrustTier;
      const points = vouchPointsForTier(tier);
      if (points <= 0) continue;
      eligibleVouches += 1;
      weighted_vouch_points += points;
      if (tier === "gov_official") gov_vouched = true;
    }
  }

  const score = calculateScore({
    passport_count,
    other_doc_count,
    vouches_received: eligibleVouches,
    weighted_vouch_points,
    gov_vouched,
  });
  const tier = getEligibleTier(score, claims.length, eligibleVouches);

  await supabaseAdmin.from("users").update({ score, tier }).eq("id", userId);

  // Create tier change notification
  if (previousTier && previousTier !== tier && tier !== 'unverified') {
    await createNotification({
      user_id: userId,
      type: 'tier_changed',
      title: `You reached ${tier} tier!`,
      detail: `Your trust score is now ${score}`,
      icon: 'star',
      color: '#fbbf24',
    });
  }

  return { score, tier };
}
