import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import type { ApiResponse, Claim, TrustTier } from "@/types";

interface PublicUser {
  id: string;
  node_id: string;
  username: string | null;
  display_name: string;
  skill: string | null;
  score: number;
  tier: TrustTier;
  borough: string | null;
  created_at: string;
}

interface UserProfileResult {
  user: PublicUser;
  claims: Claim[];
}

function cleanUsername(value: string): string {
  return value.trim().toLowerCase().replace(/^@/, "");
}

export async function GET(request: Request): Promise<Response> {
  const authed = await verifyAuth(request);
  if (!authed) {
    return Response.json({ success: false, error: "Login required to view profiles" } satisfies ApiResponse<never>, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("user_id")?.trim();
  const username = searchParams.get("username")?.trim();

  if (!userId && !username) {
    return Response.json({ success: false, error: "user_id or username is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  let query = supabaseAdmin
    .from("users")
    .select("id, node_id, username, display_name, skill, score, tier, borough, created_at");

  query = userId ? query.eq("id", userId) : query.eq("username", cleanUsername(username!));

  const { data: user, error } = await query.single();

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
