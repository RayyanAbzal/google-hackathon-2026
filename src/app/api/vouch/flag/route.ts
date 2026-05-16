import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { recalculateUserScore } from "@/lib/score";
import { getTier } from "@/types";
import type { ApiResponse } from "@/types";

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

  await supabaseAdmin
    .from("claims")
    .update({ flags: (claim.flags ?? 0) + 1 })
    .eq("id", claim_id);

  // Penalty cascade: all vouchers of the claim owner lose 15 points
  const { data: vouches } = await supabaseAdmin
    .from("vouches")
    .select("voucher_id")
    .eq("vouchee_id", claim.user_id);

  const voucherIds = (vouches ?? []).map((v) => v.voucher_id);

  if (voucherIds.length > 0) {
    const { data: vouchers } = await supabaseAdmin
      .from("users")
      .select("id, score")
      .in("id", voucherIds);

    await Promise.all(
      (vouchers ?? []).map(async (v) => {
        const newScore = Math.max(0, v.score - 15);
        await supabaseAdmin
          .from("users")
          .update({ score: newScore, tier: getTier(newScore) })
          .eq("id", v.id);
      })
    );
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
