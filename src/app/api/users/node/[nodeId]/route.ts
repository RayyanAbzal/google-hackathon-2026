import { supabaseAdmin } from "@/lib/supabase";
import type { ApiResponse, TrustTier } from "@/types";

// GET /api/users/node/[nodeId]
// No auth required. Used by vouch page to resolve a scanned node ID.

interface PublicUser {
  id: string;
  node_id: string;
  username: string | null;
  display_name: string;
  skill: string | null;
  score: number;
  tier: TrustTier;
  borough: string | null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nodeId: string }> }
): Promise<Response> {
  const { nodeId } = await params;

  if (!nodeId) {
    return Response.json({ success: false, error: "nodeId is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, node_id, username, display_name, skill, score, tier, borough")
    .eq("node_id", nodeId.toUpperCase())
    .single();

  if (error || !user) {
    return Response.json({ success: false, error: "User not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  return Response.json({
    success: true,
    data: user as PublicUser,
  } satisfies ApiResponse<PublicUser>);
}
