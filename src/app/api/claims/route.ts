import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase";
import { verifyAuth } from "@/lib/auth";
import { analyseDocument } from "@/lib/gemini";
import { recalculateUserScore } from "@/lib/score";
import { createNotification } from "@/lib/notifications";
import { USE_FALLBACKS } from "@/lib/fallbacks";
import { getTier } from "@/types";
import type { ApiResponse, Claim, ClaimType, DocumentAnalysis, TrustTier } from "@/types";

interface ClaimBody {
  type: ClaimType;
  doc_type: string;
  image_base64: string;
  mime_type?: string;
}

interface ClaimResult {
  claim: Claim;
  analysis: DocumentAnalysis;
  new_score: number;
  tier: TrustTier;
  rejection_reason?: "name_mismatch" | "low_confidence" | "unreadable";
}

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;

function getStoreClaimError(error: { code?: string; message?: string; details?: string | null; hint?: string | null }): string {
  if (error.code === "23505") return "This document has already been registered";

  const detail = [error.message, error.details, error.hint].filter(Boolean).join(" ");
  return detail ? `Failed to store claim: ${detail}` : "Failed to store claim";
}

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

  const { type, doc_type, image_base64, mime_type } = body;

  if (!["identity", "credential", "work"].includes(type)) {
    return Response.json({ success: false, error: "type must be identity | credential | work" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!doc_type?.trim()) {
    return Response.json({ success: false, error: "doc_type is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!image_base64?.trim()) {
    return Response.json({ success: false, error: "image_base64 is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (mime_type && !mime_type.startsWith("image/") && mime_type !== "application/pdf") {
    return Response.json({ success: false, error: "mime_type must be an image or application/pdf" } satisfies ApiResponse<never>, { status: 400 });
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
  let analysis: DocumentAnalysis;
  if (USE_FALLBACKS) {
    analysis = {
      extracted_name: user.display_name,
      doc_type,
      document_type: doc_type,
      institution: "Demo Institution",
      confidence: 0.9,
    };
  } else {
    analysis = await analyseDocument(image_base64, doc_type, mime_type || "image/jpeg");
  }
  const document_type = (analysis.document_type || analysis.doc_type || doc_type).trim();
  const extracted_name = analysis.extracted_name?.trim() || null;
  const confidence = Number.isFinite(analysis.confidence) ? analysis.confidence : 0;

  // Name consistency check — extract key words for flexible matching
  function extractNameWords(fullName: string | null): string[] {
    if (!fullName) return []
    return fullName.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  }

  const extractedWords = extractNameWords(extracted_name)
  const userWords = extractNameWords(user.display_name)
  const hasNameOverlap = extractedWords.length > 0 && userWords.some(w => extractedWords.some(e => e.includes(w) || w.includes(e)))

  const nameMatch =
    !extracted_name || // No name extracted is OK (unreadable)
    user.display_name.toLowerCase().includes(extracted_name.toLowerCase()) ||
    extracted_name.toLowerCase().includes(user.display_name.toLowerCase()) ||
    hasNameOverlap // More flexible: check if any significant words overlap

  const status = nameMatch && confidence >= 0.5 ? "verified" : "rejected"

  console.log('Claim validation', {
    user_id: user.id,
    doc_type,
    document_type,
    extracted_name,
    user_display_name: user.display_name,
    confidence,
    nameMatch,
    status,
  })

  if (status === "rejected") {
    const rejection_reason =
      confidence < 0.5
        ? extracted_name
          ? "low_confidence"
          : "unreadable"
        : "name_mismatch";

    const { data: rejectedClaim, error: rejectedError } = await supabaseAdmin
      .from("claims")
      .insert({
        user_id: user.id,
        type,
        status: "rejected",
        doc_type,
        document_type,
        extracted_name,
        extracted_institution: analysis.institution,
        confidence,
        content_hash,
      })
      .select("*")
      .single();

    if (rejectedError || !rejectedClaim) {
      if (rejectedError) console.error("Failed to store rejected claim", rejectedError);
      return Response.json(
        { success: false, error: rejectedError ? getStoreClaimError(rejectedError) : "Failed to store rejected claim" } satisfies ApiResponse<never>,
        { status: 500 }
      );
    }

    return Response.json(
      {
        success: false,
        error: "Document rejected — name does not match or document unreadable",
        data: {
          claim: rejectedClaim as Claim,
          analysis,
          new_score: user.score,
          tier: getTier(user.score),
          rejection_reason,
        },
      } satisfies ApiResponse<ClaimResult>,
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
      document_type,
      extracted_name,
      extracted_institution: analysis.institution,
      confidence,
      content_hash,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Failed to store claim", error);
    const isDuplicateDoc = error.code === "23505";
    return Response.json(
      { success: false, error: getStoreClaimError(error) } satisfies ApiResponse<never>,
      { status: isDuplicateDoc ? 409 : 500 }
    );
  }
  if (!claim) {
    return Response.json({ success: false, error: "Failed to store claim" } satisfies ApiResponse<never>, { status: 500 });
  }

  const { score: new_score, tier } = await recalculateUserScore(user.id);

  // Create notification for verified claim
  await createNotification({
    user_id: user.id,
    type: 'claim_verified',
    title: `Your ${document_type} was verified`,
    detail: 'Certificate registered',
    icon: 'done_all',
    color: '#40e56c',
  });

  return Response.json({
    success: true,
    data: { claim: claim as Claim, analysis, new_score, tier },
  } satisfies ApiResponse<ClaimResult>, { status: 201 });
}
