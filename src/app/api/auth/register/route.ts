import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, signToken } from "@/lib/auth";
import { generateUniqueNodeId } from "@/lib/nodeId";
import type { ApiResponse, MandatoryDocType } from "@/types";

// POST /api/auth/register
// Owner: Aryan
// Input: { display_name, password, doc_type, borough, skill? }
// Returns: { token, user_id, node_id }

interface RegisterBody {
  display_name: string;
  password: string;
  doc_type: MandatoryDocType;
  borough?: string;
  skill?: SkillTag;
  doc_image_base64?: string;
}

interface RegisterResult {
  token: string;
  user_id: string;
  node_id: string;
}

const VALID_DOC_TYPES: MandatoryDocType[] = ['passport', 'driving_licence']
const VALID_SKILLS: SkillTag[] = ['Doctor', 'Engineer', 'Legal', 'Builder', 'Nurse', 'Other']

export async function POST(request: Request): Promise<Response> {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { display_name, password, doc_type, borough, skill } = body;

  if (!skill?.trim()) {
    return Response.json(
      { success: false, error: "skill is required" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  if (!borough?.trim()) {
    return Response.json(
      { success: false, error: "borough is required" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  if (!display_name?.trim()) {
    return Response.json({ success: false, error: "display_name is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!password || password.length < 6) {
    return Response.json({ success: false, error: "Password must be at least 6 characters" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!doc_type || !VALID_DOC_TYPES.includes(doc_type)) {
    return Response.json({ success: false, error: "doc_type must be 'passport' or 'driving_licence'" } satisfies ApiResponse<never>, { status: 400 });
  }
  const safeBorough = borough?.trim() || 'Westminster'
  if (skill && !VALID_SKILLS.includes(skill)) {
    return Response.json({ success: false, error: `skill must be one of: ${VALID_SKILLS.join(', ')}` } satisfies ApiResponse<never>, { status: 400 });
  }

  let node_id: string;
  try {
    node_id = await generateUniqueNodeId(async (candidate) => {
      const { data, error } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("node_id", candidate)
        .maybeSingle();

      if (error) throw error;
      return Boolean(data);
    });
  } catch {
    return Response.json({ success: false, error: "Failed to allocate node_id" } satisfies ApiResponse<never>, { status: 500 });
  }

  const password_hash = hashPassword(password);

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      node_id,
      display_name: display_name.trim(),
      skill: skill.trim(),
      password_hash,
      borough: borough.trim(),
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
