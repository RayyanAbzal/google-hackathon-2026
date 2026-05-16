import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { recalculateUserScore } from "@/lib/score";
import type { ApiResponse, TrustTier } from "@/types";

interface VouchBody {
  vouchee_id: string;
}

interface VouchResult {
  new_score: number;
  tier: TrustTier;
}

const VOUCH_WINDOW_MS = 24 * 60 * 60 * 1000;
const VOUCH_MAX = 5;

export async function POST(request: Request): Promise<Response> {
  const voucher = await verifyAuth(request);
  if (!voucher) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 401 });
  }

  if (voucher.score < 20) {
    return Response.json({ success: false, error: "You must be Verified (score 20+) to vouch" } satisfies ApiResponse<never>, { status: 403 });
  }

  let body: VouchBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { vouchee_id } = body;

  if (!vouchee_id) {
    return Response.json({ success: false, error: "vouchee_id is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (vouchee_id === voucher.id) {
    return Response.json({ success: false, error: "Cannot vouch for yourself" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { data: vouchee } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", vouchee_id)
    .single();

  if (!vouchee) {
    return Response.json({ success: false, error: "User not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  // Rate limit: 5 vouches per 24h
  const windowStart = new Date(Date.now() - VOUCH_WINDOW_MS).toISOString();
  const { count: recentVouches } = await supabaseAdmin
    .from("vouches")
    .select("*", { count: "exact", head: true })
    .eq("voucher_id", voucher.id)
    .gte("created_at", windowStart);

  if ((recentVouches ?? 0) >= VOUCH_MAX) {
    return Response.json({ success: false, error: "Vouch limit reached — 5 per 24h" } satisfies ApiResponse<never>, { status: 429 });
  }

  const { error } = await supabaseAdmin
    .from("vouches")
    .insert({ voucher_id: voucher.id, vouchee_id });

  if (error) {
    const isDuplicate = error.code === "23505";
    return Response.json(
      { success: false, error: isDuplicate ? "Already vouched for this user" : "Failed to record vouch" } satisfies ApiResponse<never>,
      { status: isDuplicate ? 409 : 500 }
    );
  }

  const { score: new_score, tier } = await recalculateUserScore(vouchee_id);

  return Response.json({
    success: true,
    data: { new_score, tier },
  } satisfies ApiResponse<VouchResult>, { status: 201 });
}
