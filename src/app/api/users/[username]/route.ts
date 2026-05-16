import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import type { ApiResponse, Claim, TrustTier } from "@/types";

interface PublicUser {
  id: string;
  node_id: string;
  username: string | null;
  display_name: string;
  skill: string;
  score: number;
  tier: TrustTier;
  borough: string | null;
  created_at: string;
}

interface UserProfileResult {
  user: PublicUser;
  claims: Claim[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
): Promise<Response> {
  const authed = await verifyAuth(request);
  if (!authed) {
    return Response.json({ success: false, error: "Login required to view profiles" } satisfies ApiResponse<never>, { status: 401 });
  }

  const { username } = await params;

  if (!username) {
    return Response.json({ success: false, error: "username is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("id, node_id, username, display_name, skill, score, tier, borough, created_at")
    .eq("username", username.toLowerCase().replace(/^@/, ""))
    .single();

  if (error || !user) {
    return Response.json({ success: false, error: "User not found" } satisfies ApiResponse<never>, { status: 404 });
  }

  const { data: claims } = await supabaseAdmin
    .from("claims")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  return Response.json({
    success: true,
    data: { user: user as PublicUser, claims: (claims ?? []) as Claim[] },
  } satisfies ApiResponse<UserProfileResult>);
}
