import { supabaseAdmin } from "./supabase";
import { calculateScore, getTier } from "@/types";
import { createNotification } from "@/lib/notifications";
import type { TrustTier } from "@/types";

function isPassportDoc(docType: string): boolean {
  return docType.toLowerCase().includes("passport");
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
        .select("tier")
        .eq("id", userId)
        .single(),
    ]);

  const claims = claimsResult.data ?? [];
  const passport_count = claims.filter((c) => isPassportDoc(c.doc_type)).length;
  const other_doc_count = claims.filter((c) => !isPassportDoc(c.doc_type)).length;

  // Check if any voucher is a gov anchor
  const voucherIds = (vouchersResult.data ?? []).map((v) => v.voucher_id);
  let gov_vouched = false;
  if (voucherIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("gov_officials")
      .select("*", { count: "exact", head: true })
      .in("user_id", voucherIds);
    gov_vouched = (count ?? 0) > 0;
  }

  const score = calculateScore({
    passport_count,
    other_doc_count,
    vouches_received: vouchesCount ?? 0,
    gov_vouched,
  });
  const tier = getTier(score);
  const previousTier = userResult.data?.tier as TrustTier | undefined;

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
