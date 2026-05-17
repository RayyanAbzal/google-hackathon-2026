import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { recalculateUserScore } from "@/lib/score";
import type { ApiResponse, Claim, TrustTier } from "@/types";

interface DeleteClaimResult {
  deleted_claim_id: string;
  new_score: number;
  tier: TrustTier;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  const { userId } = await params;

  if (!userId) {
    return Response.json({ success: false, error: "userId is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("claims")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ success: false, error: "Failed to fetch claims" } satisfies ApiResponse<never>, { status: 500 });
  }

  return Response.json({ success: true, data: data as Claim[] } satisfies ApiResponse<Claim[]>);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
): Promise<Response> {
  const user = await verifyAuth(request);
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 401 });
  }

  const { userId: claimId } = await params;
  if (!claimId) {
    return Response.json({ success: false, error: "claimId is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { data: claim, error: fetchError } = await supabaseAdmin
    .from("claims")
    .select("id, user_id")
    .eq("id", claimId)
    .single();

  if (fetchError || !claim) {
    return Response.json({ success: false, error: "Claim not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  if (claim.user_id !== user.id) {
    return Response.json({ success: false, error: "You can only delete your own documents" } satisfies ApiResponse<never>, { status: 403 });
  }

  const { error: deleteError } = await supabaseAdmin
    .from("claims")
    .delete()
    .eq("id", claimId)
    .eq("user_id", user.id);

  if (deleteError) {
    return Response.json({ success: false, error: "Failed to delete claim" } satisfies ApiResponse<never>, { status: 500 });
  }

  const { score: new_score, tier } = await recalculateUserScore(user.id);

  return Response.json({
    success: true,
    data: { deleted_claim_id: claimId, new_score, tier },
  } satisfies ApiResponse<DeleteClaimResult>);
}
