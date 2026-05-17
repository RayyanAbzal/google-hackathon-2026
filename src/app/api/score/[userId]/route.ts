import { supabaseAdmin } from "@/lib/supabase";
import { getTier } from "@/types";
import type { ApiResponse, TrustTier } from "@/types";

interface ScoreResult {
  score: number;
  tier: TrustTier;
  passport_count: number;
  other_doc_count: number;
  vouches_received: number;
  gov_vouched: boolean;
}

function isPassportDoc(docType: string): boolean {
  return docType.toLowerCase().includes("passport");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  const { userId } = await params;

  if (!userId) {
    return Response.json({ success: false, error: "userId is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const [userResult, claimsResult, vouchesCountResult, vouchersResult] = await Promise.all([
    supabaseAdmin.from("users").select("score").eq("id", userId).single(),
    supabaseAdmin.from("claims").select("doc_type").eq("user_id", userId).eq("status", "verified"),
    supabaseAdmin.from("vouches").select("*", { count: "exact", head: true }).eq("vouchee_id", userId),
    supabaseAdmin.from("vouches").select("voucher_id").eq("vouchee_id", userId),
  ]);

  if (userResult.error || !userResult.data) {
    return Response.json({ success: false, error: "User not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  const claims = claimsResult.data ?? [];
  const passport_count = claims.filter((c) => isPassportDoc(c.doc_type)).length;
  const other_doc_count = claims.filter((c) => !isPassportDoc(c.doc_type)).length;
  const vouches_received = vouchesCountResult.count ?? 0;

  const voucherIds = (vouchersResult.data ?? []).map((v) => v.voucher_id);
  let gov_vouched = false;
  if (voucherIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("gov_officials")
      .select("*", { count: "exact", head: true })
      .in("user_id", voucherIds);
    gov_vouched = (count ?? 0) > 0;
  }

  const { score } = userResult.data;

  return Response.json({
    success: true,
    data: {
      score,
      tier: getTier(score),
      passport_count,
      other_doc_count,
      vouches_received,
      gov_vouched,
    },
  } satisfies ApiResponse<ScoreResult>);
}
