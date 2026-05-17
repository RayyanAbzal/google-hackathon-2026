import { supabaseAdmin } from "@/lib/supabase";
import { hashPassword, signToken } from "@/lib/auth";
import { generateUniqueNodeId } from "@/lib/nodeId";
import { createNotification } from "@/lib/notifications";
import { analyseDocument } from "@/lib/gemini";
import { recalculateUserScore } from "@/lib/score";
import { USE_FALLBACKS } from "@/lib/fallbacks";
import { createHash } from "crypto";
import type { ApiResponse, DocumentAnalysis, MandatoryDocType, SkillTag, TrustTier } from "@/types";

// POST /api/auth/register
// Owner: Aryan
// Input: { display_name, password, doc_type, borough, skill? }
// Returns: { token, user_id, node_id, score, tier }

interface RegisterBody {
  display_name: string;
  password: string;
  doc_type: MandatoryDocType;
  borough?: string;
  skill?: SkillTag;
  doc_image_base64?: string;
  mime_type?: string;
}

interface RegisterResult {
  token: string;
  user_id: string;
  node_id: string;
  score: number;
  tier: TrustTier;
}

const VALID_DOC_TYPES: MandatoryDocType[] = ['passport', 'driving_licence']
const VALID_SKILLS: SkillTag[] = ['Doctor', 'Engineer', 'Legal', 'Builder', 'Nurse', 'Other']

function normalizeDocumentCategory(analysis: DocumentAnalysis): "passport" | "driving_licence" | "other" {
  if (analysis.document_category === "passport" || analysis.document_category === "driving_licence") {
    return analysis.document_category;
  }

  const text = `${analysis.doc_type ?? ""}`.toLowerCase();
  if (text.includes("passport")) return "passport";
  if (text.includes("driving") || text.includes("driver") || text.includes("licence") || text.includes("license")) {
    return "driving_licence";
  }
  return "other";
}

function isExpired(expiryDate: string | null | undefined): boolean | null {
  if (!expiryDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(expiryDate);
  if (!match) return null;
  const expiry = new Date(`${expiryDate}T23:59:59.999Z`);
  if (Number.isNaN(expiry.getTime())) return null;
  return expiry.getTime() < Date.now();
}

function normalizeName(value: string): string[] {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((part) => part.length > 1);
}

function namesMatch(inputName: string, extractedName: string | null | undefined): boolean {
  if (!extractedName) return false;

  const inputTokens = normalizeName(inputName);
  const extractedTokens = normalizeName(extractedName);
  if (inputTokens.length === 0 || extractedTokens.length === 0) return false;

  const extractedSet = new Set(extractedTokens);
  return inputTokens.every((token) => extractedSet.has(token));
}

export async function POST(request: Request): Promise<Response> {
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ success: false, error: "Invalid JSON" } satisfies ApiResponse<never>, { status: 400 });
  }

  const { display_name, password, doc_type, borough, skill, doc_image_base64, mime_type } = body;

  if (!display_name?.trim()) {
    return Response.json({ success: false, error: "display_name is required" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!password || password.length < 6) {
    return Response.json({ success: false, error: "Password must be at least 6 characters" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!doc_type || !VALID_DOC_TYPES.includes(doc_type)) {
    return Response.json({ success: false, error: "doc_type must be 'passport' or 'driving_licence'" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (!doc_image_base64?.trim()) {
    return Response.json({ success: false, error: "A valid identity document is required to create an account" } satisfies ApiResponse<never>, { status: 400 });
  }
  if (mime_type !== "image/png") {
    return Response.json({ success: false, error: "Signup document must be a PNG image" } satisfies ApiResponse<never>, { status: 400 });
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
  const content_hash = createHash("sha256").update(doc_image_base64).digest("hex");

  const { data: dupCheck } = await supabaseAdmin
    .from("claims")
    .select("id")
    .eq("content_hash", content_hash)
    .maybeSingle();

  if (dupCheck) {
    return Response.json({ success: false, error: "This document has already been registered" } satisfies ApiResponse<never>, { status: 409 });
  }

  let analysis: DocumentAnalysis;
  if (USE_FALLBACKS) {
    analysis = {
      extracted_name: display_name.trim(),
      doc_type,
      document_category: doc_type,
      expiry_date: "2099-01-01",
      institution: null,
      confidence: 0.9,
    };
  } else {
    analysis = await analyseDocument(doc_image_base64, doc_type, mime_type || "image/jpeg");
  }

  if (analysis.confidence < 0.35 || !analysis.extracted_name) {
    return Response.json({ success: false, error: "Document rejected — Gemini could not read the document clearly enough" } satisfies ApiResponse<never>, { status: 422 });
  }

  if (!namesMatch(display_name.trim(), analysis.extracted_name)) {
    return Response.json({ success: false, error: `Document rejected — name on document appears to be ${analysis.extracted_name}` } satisfies ApiResponse<never>, { status: 422 });
  }

  const detectedCategory = normalizeDocumentCategory(analysis);
  if (detectedCategory !== doc_type) {
    return Response.json({ success: false, error: "Document rejected — upload must match the selected passport or driver's licence type" } satisfies ApiResponse<never>, { status: 422 });
  }

  const expired = isExpired(analysis.expiry_date);
  if (expired === null) {
    return Response.json({ success: false, error: "Document rejected — expiry date is missing or unreadable" } satisfies ApiResponse<never>, { status: 422 });
  }
  if (expired) {
    return Response.json({ success: false, error: "Document rejected — ID document is expired" } satisfies ApiResponse<never>, { status: 422 });
  }

  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      node_id,
      display_name: display_name.trim(),
      skill: skill?.trim() ?? 'Other',
      password_hash,
      borough: safeBorough,
    })
    .select("id, node_id")
    .single();

  if (error) {
    return Response.json({ success: false, error: "Registration failed" } satisfies ApiResponse<never>, { status: 500 });
  }

  const { error: claimError } = await supabaseAdmin
    .from("claims")
    .insert({
      user_id: data.id,
      type: "identity",
      status: "verified",
      doc_type,
      extracted_name: analysis.extracted_name,
      extracted_institution: analysis.institution,
      confidence: analysis.confidence,
      content_hash,
    });

  if (claimError) {
    return Response.json({ success: false, error: "Failed to store verified document" } satisfies ApiResponse<never>, { status: 500 });
  }

  const scoreResult = await recalculateUserScore(data.id);

  // Create welcome notification
  await createNotification({
    user_id: data.id,
    type: 'account_created',
    title: 'Welcome to CivicTrust',
    detail: 'Start building your trust profile',
    icon: 'person_add',
    color: '#8c90a1',
  });

  return Response.json({
    success: true,
    data: {
      token: signToken(data.id),
      user_id: data.id,
      node_id: data.node_id,
      score: scoreResult.score,
      tier: scoreResult.tier,
    },
  } satisfies ApiResponse<RegisterResult>, { status: 201 });
}
