import { supabaseAdmin } from "@/lib/supabase";
import { hashPin, generateNodeId, signToken } from "@/lib/auth";
import type { ApiResponse } from "@/types";

interface RegisterBody {
  display_name: string;
  pin: string;
  skill: string;
  borough?: string;
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

  const { display_name, pin, skill, borough } = body;

  if (!display_name?.trim()) {
    return Response.json({ success: false, error: "display_name is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!pin || !/^\d{4}$/.test(pin)) {
    return Response.json({ success: false, error: "PIN must be exactly 4 digits" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!skill?.trim()) {
    return Response.json({ success: false, error: "skill is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  const node_id = generateNodeId();
  const pin_hash = hashPin(pin);

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      node_id,
      display_name: display_name.trim(),
      skill: skill.trim(),
      pin_hash,
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
