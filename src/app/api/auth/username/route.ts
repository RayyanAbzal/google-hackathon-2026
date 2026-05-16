import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import type { ApiResponse } from "@/types";

interface UsernameBody {
  username: string;
}

export async function PATCH(request: Request): Promise<Response> {
  const user = await verifyAuth(request);
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 401 });
  }

  let body: UsernameBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { username } = body;

  if (!username?.trim()) {
    return Response.json({ success: false, error: "username is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username.trim())) {
    return Response.json(
      { success: false, error: "Username must be 3-20 chars, letters/numbers/underscores only" } satisfies ApiResponse<never>,
      { status: 400 }
    );
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update({ username: username.trim().toLowerCase() })
    .eq("id", user.id);

  if (error) {
    const isDuplicate = error.code === "23505";
    return Response.json(
      { success: false, error: isDuplicate ? "Username already taken" : "Failed to set username" } satisfies ApiResponse<never>,
      { status: isDuplicate ? 409 : 500 }
    );
  }

  return Response.json({ success: true, data: { username: username.trim().toLowerCase() } } satisfies ApiResponse<{ username: string }>);
}
