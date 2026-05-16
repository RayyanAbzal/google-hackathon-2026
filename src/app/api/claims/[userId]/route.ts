import { supabaseAdmin } from "@/lib/supabase";
import type { ApiResponse, Claim } from "@/types";

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
