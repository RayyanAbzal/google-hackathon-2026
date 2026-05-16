import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] ??= trimmed.slice(eq + 1).trim();
  }
} catch {
  // Unit token tests do not need a real Supabase connection.
}

process.env.NEXT_PUBLIC_SUPABASE_URL ??= "http://localhost";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
process.env.SESSION_SECRET ??= "test-session-secret";

test("verifyToken accepts a current signed token", async () => {
  const { signToken, verifyToken } = await import("../../src/lib/auth");
  const now = Date.now();
  const token = signToken("user-123", now);

  assert.equal(verifyToken(token, now), "user-123");
});

test("verifyToken rejects expired tokens", async () => {
  const { signToken, verifyToken } = await import("../../src/lib/auth");
  const now = Date.now();
  const eightDaysAgo = now - 8 * 24 * 60 * 60 * 1000;
  const token = signToken("user-123", eightDaysAgo);

  assert.equal(verifyToken(token, now), null);
});

test("verifyToken rejects tokens issued in the future", async () => {
  const { signToken, verifyToken } = await import("../../src/lib/auth");
  const now = Date.now();
  const token = signToken("user-123", now + 60_000);

  assert.equal(verifyToken(token, now), null);
});
