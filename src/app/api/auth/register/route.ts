import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, generateNodeId, signToken } from "@/lib/auth";
import type { ApiResponse, MandatoryDocType } from "@/types";

// POST /api/auth/register
// Owner: Aryan
// Input: { display_name, password, doc_image_base64, doc_type } — doc_type must be 'passport' or 'driving_licence'
// Returns: { token, user_id, node_id }

interface RegisterBody {
  display_name: string;
  password: string;
  skill: string;
  borough: string;
  doc_image_base64?: string;
  doc_type?: MandatoryDocType;
}

interface RegisterResult {
  token: string;
  user_id: string;
  node_id: string;
}

export async function POST(request: Request): Promise<Response> {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { display_name, password, doc_type, borough } = body;

  if (!display_name?.trim()) {
    return Response.json({ success: false, error: "display_name is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!password || password.length < 6) {
    return Response.json({ success: false, error: "Password must be at least 6 characters" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!doc_type || !['passport', 'driving_licence'].includes(doc_type)) {
    return Response.json({ success: false, error: "doc_type must be 'passport' or 'driving_licence'" } satisfies ApiResponse<never>, { status: 400 });
  }

  const node_id = generateNodeId();
  const password_hash = hashPassword(password);

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      node_id,
      display_name: display_name.trim(),
      password_hash,
      borough: borough?.trim() ?? null,
    })
    .select("id, node_id")
    .single();

  if (error) {
    return Response.json({ success: false, error: "Registration failed" } satisfies ApiResponse<never>, { status: 500 });
  }

  return Response.json({
    success: true,
    data: { token: signToken(data.id), user_id: data.id, node_id: data.node_id },
  } satisfies ApiResponse<RegisterResult>, { status: 201 });
}
