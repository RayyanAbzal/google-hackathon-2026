import { supabaseAdmin } from "./supabase";
import { calculateScore, getTier } from "@/types";
import type { TrustTier } from "@/types";

export async function recalculateUserScore(
  userId: string
): Promise<{ score: number; tier: TrustTier }> {
  const [claimsResult, { count: vouchesCount }, vouchersResult] =
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
    ]);

  const claims = claimsResult.data ?? [];
  const passport_count = claims.filter((c) => c.doc_type === "passport").length;
  const other_doc_count = claims.filter((c) => c.doc_type !== "passport").length;

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

  await supabaseAdmin.from("users").update({ score, tier }).eq("id", userId);

  return { score, tier };
}
