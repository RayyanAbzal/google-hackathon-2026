import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, signToken } from "@/lib/auth";
import { getTier } from "@/types";
import type { ApiResponse, Session } from "@/types";

// POST /api/auth/login
// Owner: Aryan
// Input: { identifier, password } — identifier is node_id OR @username
// Returns: { token, user_id, node_id, username, display_name, score, tier }

interface LoginBody {
  identifier: string; // node_id or @username
  password: string;
}

export async function POST(request: Request): Promise<Response> {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { identifier, password } = body;

  if (!identifier?.trim() || !password) {
    return Response.json({ success: false, error: "identifier and password are required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const clean = identifier.trim().replace(/^@/, "");
  const isNodeId = /^BLK-\d{5}-LDN$/i.test(identifier.trim());

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, node_id, username, display_name, score, password_hash")
    .eq(isNodeId ? "node_id" : "username", isNodeId ? identifier.trim().toUpperCase() : clean)
    .single();

  if (!user || user.password_hash !== hashPassword(password)) {
    return Response.json({ success: false, error: "Invalid credentials" } satisfies ApiResponse<never>, { status: 401 });
  }

  const session: Session = {
    token: signToken(user.id),
    user_id: user.id,
    node_id: user.node_id,
    username: user.username ?? null,
    display_name: user.display_name,
    score: user.score,
    tier: getTier(user.score),
  };

  return Response.json({ success: true, data: session } satisfies ApiResponse<Session>);
}
