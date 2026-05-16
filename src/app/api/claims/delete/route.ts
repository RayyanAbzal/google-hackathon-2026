import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { recalculateUserScore } from "@/lib/score";
import type { ApiResponse } from "@/types";

interface DeleteBody {
  claim_id: string;
}

export async function DELETE(request: Request): Promise<Response> {
  const user = await verifyAuth(request);
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 401 });
  }

  let body: DeleteBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { claim_id } = body;

  if (!claim_id?.trim()) {
    return Response.json({ success: false, error: "claim_id is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  // Verify the claim belongs to the user
  const { data: claim, error: fetchError } = await supabaseAdmin
    .from("claims")
    .select("id, user_id")
    .eq("id", claim_id)
    .single();

  if (fetchError || !claim) {
    return Response.json({ success: false, error: "Claim not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  if (claim.user_id !== user.id) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 403 });
  }

  // Delete the claim
  const { error: deleteError } = await supabaseAdmin
    .from("claims")
    .delete()
    .eq("id", claim_id);

  if (deleteError) {
    return Response.json({ success: false, error: "Failed to delete claim" } satisfies ApiResponse<never>, { status: 500 });
  }

  // Recalculate score after deletion
  const { score: new_score, tier } = await recalculateUserScore(user.id);

  return Response.json({
    success: true,
    data: { new_score, tier },
  } satisfies ApiResponse<{ new_score: number; tier: string }>);
}
