import { createHash, createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "./supabase";
import type { User } from "@/types";

const SESSION_SECRET = process.env.SESSION_SECRET ?? "civictrust-dev-secret";

export function hashPin(pin: string): string {
  return createHash("sha256").update(pin).digest("hex");
}

export function generateNodeId(): string {
  const num = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `BLK-${num}-LDN`;
}

// Token format: base64url(userId:issuedAt).hmac_sha256(payload, SESSION_SECRET)
export function signToken(userId: string): string {
  const payload = Buffer.from(`${userId}:${Date.now()}`).toString("base64url");
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function extractUserId(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  const decoded = Buffer.from(payload, "base64url").toString();
  return decoded.split(":")[0] ?? null;
}

// Expects: Authorization: Bearer <signed_token>
// Verifies signature, then returns the User row.
export async function verifyAuth(request: Request): Promise<User | null> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const userId = extractUserId(token);
  if (!userId) return null;

  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  return data ?? null;
}
