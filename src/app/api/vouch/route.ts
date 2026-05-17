import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { recalculateUserScore } from "@/lib/score";
import { createNotification } from "@/lib/notifications";
import { getTier } from "@/types";
import type { ApiResponse, TrustTier } from "@/types";

const CIRCULAR_VOUCH_PENALTY = 20;

interface VouchBody {
  vouchee_id: string;
}

interface VouchResult {
  new_score: number;
  tier: TrustTier;
}

const VOUCH_WINDOW_MS = 24 * 60 * 60 * 1000;
const VOUCH_MAX = 5;
const VOUCH_POINTS_BY_TIER: Record<TrustTier, number> = {
  unverified: 0,
  verified: 5,
  trusted: 6.25,
  gov_official: 10,
};

export async function POST(request: Request): Promise<Response> {
  const voucher = await verifyAuth(request);
  if (!voucher) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 401 });
  }

  const voucherTier = voucher.tier as TrustTier;
  const vouchPoints = VOUCH_POINTS_BY_TIER[voucherTier] ?? 0;
  if (vouchPoints <= 0) {
    return Response.json({ success: false, error: "You must be Verified, Trusted, or Government verified to vouch" } satisfies ApiResponse<never>, { status: 403 });
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

  // Detect circular vouching: vouchee already vouches back for the voucher
  const { count: reverseCount } = await supabaseAdmin
    .from("vouches")
    .select("*", { count: "exact", head: true })
    .eq("voucher_id", vouchee_id)
    .eq("vouchee_id", voucher.id);

  const isCircular = (reverseCount ?? 0) > 0;

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

  // Recalculate vouchee score first, then apply circular penalty on top so it isn't overwritten
  let { score: new_score, tier } = await recalculateUserScore(vouchee_id);

  if (isCircular) {
    // Fetch current scores for both parties (vouchee was just recalculated above)
    const { data: voucherRow } = await supabaseAdmin
      .from("users")
      .select("score")
      .eq("id", voucher.id)
      .single();

    const penalizedVouchee = Math.max(0, new_score - CIRCULAR_VOUCH_PENALTY);
    const penalizedVoucheeTier = getTier(penalizedVouchee);
    const penalizedVoucher = Math.max(0, (voucherRow?.score ?? 0) - CIRCULAR_VOUCH_PENALTY);
    const penalizedVoucherTier = getTier(penalizedVoucher);

    await Promise.all([
      supabaseAdmin.from("users").update({ score: penalizedVouchee, tier: penalizedVoucheeTier }).eq("id", vouchee_id),
      supabaseAdmin.from("users").update({ score: penalizedVoucher, tier: penalizedVoucherTier }).eq("id", voucher.id),
      createNotification({ user_id: vouchee_id, type: "claim_verified", title: "Trust penalty: Circular vouching detected", detail: `-${CIRCULAR_VOUCH_PENALTY} pts — mutual vouching is not permitted`, icon: "warning", color: "#ffb4ab" }),
      createNotification({ user_id: voucher.id, type: "claim_verified", title: "Trust penalty: Circular vouching detected", detail: `-${CIRCULAR_VOUCH_PENALTY} pts — mutual vouching is not permitted`, icon: "warning", color: "#ffb4ab" }),
    ]);

    new_score = penalizedVouchee;
    tier = penalizedVoucheeTier;
  }

  // Create notification for vouchee
  await createNotification({
    user_id: vouchee_id,
    type: 'vouch_received',
    title: `${voucher.display_name} vouched for you`,
    detail: `${voucherTier === 'gov_official' ? 'Government' : voucherTier === 'trusted' ? 'Trusted' : 'Verified'} vouch · +${vouchPoints} pts`,
    icon: 'handshake',
    color: '#b0c6ff',
    related_user_id: voucher.id,
  });

  return Response.json({
    success: true,
    data: { new_score, tier },
  } satisfies ApiResponse<VouchResult>, { status: 201 });
}
