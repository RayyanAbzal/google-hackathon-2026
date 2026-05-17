import { supabaseAdmin } from "@/lib/supabase";
import { calculateScore } from "@/types";
import type { ApiResponse, TrustTier } from "@/types";

export interface NetworkNode {
  type: "gov" | "community";
  display_name: string;
  username: string | null;
  tier: TrustTier;
  vouched_at: string;
}

interface NetworkResult {
  nodes: NetworkNode[];
  pts_this_week: number;
  total_vouchers: number;
}

const MAX_DISPLAYED_NODES = 12;

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
    return Response.json(
      { success: false, error: "userId is required" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  // Fetch vouches + voucher user info in one join
  const [vouchesResult, claimsResult, userResult] = await Promise.all([
    supabaseAdmin
      .from("vouches")
      .select("voucher_id, created_at, users!voucher_id(display_name, username, tier)")
      .eq("vouchee_id", userId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("claims")
      .select("doc_type, status, created_at")
      .eq("user_id", userId),
    supabaseAdmin.from("users").select("score").eq("id", userId).single(),
  ]);

  const allVouches = vouchesResult.data ?? [];
  const allClaims = claimsResult.data ?? [];
  const currentScore = userResult.data?.score ?? 0;

  // Identify gov vouchers
  const voucherIds = allVouches.map((v) => v.voucher_id);
  const govVoucherIds = new Set<string>();
  if (voucherIds.length > 0) {
    const { data: govRows } = await supabaseAdmin
      .from("gov_officials")
      .select("user_id")
      .in("user_id", voucherIds);
    (govRows ?? []).forEach((r) => govVoucherIds.add(r.user_id));
  }

  // Build node list (capped for display)
  const allNodes: NetworkNode[] = allVouches.map((v) => {
    const user = Array.isArray(v.users) ? v.users[0] : v.users
    return {
      type: govVoucherIds.has(v.voucher_id) ? "gov" : "community",
      display_name: (user as { display_name: string } | null)?.display_name ?? "Unknown",
      username: (user as { username: string | null } | null)?.username ?? null,
      tier: ((user as { tier: TrustTier } | null)?.tier ?? "unverified") as TrustTier,
      vouched_at: v.created_at,
    }
  });
  const nodes = allNodes.slice(0, MAX_DISPLAYED_NODES);

  // Snapshot diff for pts_this_week
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const oldVouches = allVouches.filter((v) => v.created_at < cutoff);
  const oldVerifiedClaims = allClaims.filter(
    (c) => c.status === "verified" && c.created_at < cutoff
  );

  const oldVoucherIds = oldVouches.map((v) => v.voucher_id);
  let oldGovVouched = false;
  let oldWeightedVouchPoints = 0;
  if (oldVoucherIds.length > 0) {
    for (const vouch of oldVouches) {
      const user = Array.isArray(vouch.users) ? vouch.users[0] : vouch.users;
      const tier = ((user as { tier: TrustTier } | null)?.tier ?? "unverified") as TrustTier;
      oldWeightedVouchPoints += vouchPointsForTier(tier);
      if (tier === "gov_official") oldGovVouched = true;
    }
  }

  const oldScore = calculateScore({
    passport_count: oldVerifiedClaims.filter((c) => c.doc_type === "passport")
      .length,
    other_doc_count: oldVerifiedClaims.filter((c) => c.doc_type !== "passport")
      .length,
    vouches_received: oldVouches.length,
    weighted_vouch_points: oldWeightedVouchPoints,
    gov_vouched: oldGovVouched,
  });

  const pts_this_week = Math.max(0, currentScore - oldScore);

  return Response.json({
    success: true,
    data: { nodes, pts_this_week, total_vouchers: allVouches.length },
  } satisfies ApiResponse<NetworkResult>);
}
