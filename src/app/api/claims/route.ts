import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { analyseDocument } from "@/lib/gemini";
import { recalculateUserScore } from "@/lib/score";
import { USE_FALLBACKS } from "@/lib/fallbacks";
import type { ApiResponse, Claim, ClaimType, TrustTier } from "@/types";

interface ClaimBody {
  type: ClaimType;
  doc_type: string;
  image_base64: string;
}

interface ClaimResult {
  claim: Claim;
  new_score: number;
  tier: TrustTier;
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

export async function POST(request: Request): Promise<Response> {
  const user = await verifyAuth(request);
  if (!user) {
    return Response.json({ success: false, error: "Unauthorized" } satisfies ApiResponse<never>, { status: 401 });
  }

  let body: ClaimBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { type, doc_type, image_base64 } = body;

  if (!["identity", "credential", "work"].includes(type)) {
    return Response.json({ success: false, error: "type must be identity | credential | work" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!doc_type?.trim()) {
    return Response.json({ success: false, error: "doc_type is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!image_base64?.trim()) {
    return Response.json({ success: false, error: "image_base64 is required" } satisfies ApiResponse<never>, { status: 400 });
  }

  // Rate limiting: max 3 claims per 10 min
  const windowStart = new Date(Date.now() - RATE_WINDOW_MS).toISOString();
  const { count: recentCount } = await supabaseAdmin
    .from("claims")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", windowStart);

  if ((recentCount ?? 0) >= RATE_MAX) {
    return Response.json({ success: false, error: "Too many submissions — wait 10 minutes" } satisfies ApiResponse<never>, { status: 429 });
  }

  // Hash computed here — dedup is route logic, not Gemini's concern
  const content_hash = createHash("sha256").update(image_base64).digest("hex");

  // Global duplicate document check — same doc cannot be used across any account
  const { data: dupCheck } = await supabaseAdmin
    .from("claims")
    .select("id")
    .eq("content_hash", content_hash)
    .single();

  if (dupCheck) {
    return Response.json({ success: false, error: "This document has already been registered" } satisfies ApiResponse<never>, { status: 409 });
  }

  // Analyse document via Gemini
  let analysis;
  if (USE_FALLBACKS) {
    analysis = {
      extracted_name: user.display_name,
      doc_type,
      institution: "Demo Institution",
      confidence: 0.9,
    };
  } else {
    analysis = await analyseDocument(image_base64, doc_type);
  }

  // Name consistency check
  const nameMatch =
    !analysis.extracted_name ||
    user.display_name.toLowerCase().includes(analysis.extracted_name.toLowerCase()) ||
    analysis.extracted_name.toLowerCase().includes(user.display_name.toLowerCase());

  const status = nameMatch && analysis.confidence >= 0.5 ? "verified" : "rejected";

  if (status === "rejected") {
    await supabaseAdmin.from("claims").insert({
      user_id: user.id,
      type,
      status: "rejected",
      doc_type,
      extracted_name: analysis.extracted_name,
      extracted_institution: analysis.institution,
      confidence: analysis.confidence,
      content_hash,
    });
    return Response.json(
      { success: false, error: "Document rejected — name does not match or document unreadable" } satisfies ApiResponse<never>,
      { status: 422 }
    );
  }

  const { data: claim, error } = await supabaseAdmin
    .from("claims")
    .insert({
      user_id: user.id,
      type,
      status,
      doc_type,
      extracted_name: analysis.extracted_name,
      extracted_institution: analysis.institution,
      confidence: analysis.confidence,
      content_hash,
    })
    .select("*")
    .single();

  if (error) {
    const isDuplicateDoc = error.code === "23505";
    return Response.json(
      { success: false, error: isDuplicateDoc ? "This document has already been registered" : "Failed to store claim" } satisfies ApiResponse<never>,
      { status: isDuplicateDoc ? 409 : 500 }
    );
  }
  if (!claim) {
    return Response.json({ success: false, error: "Failed to store claim" } satisfies ApiResponse<never>, { status: 500 });
  }

  const { score: new_score, tier } = await recalculateUserScore(user.id);

  return Response.json({
    success: true,
    data: { claim: claim as Claim, new_score, tier },
  } satisfies ApiResponse<ClaimResult>, { status: 201 });
}
