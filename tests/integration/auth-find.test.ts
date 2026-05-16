import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface RegisterResult {
  token: string;
  user_id: string;
  node_id: string;
}

interface LoginResult {
  token: string;
  user_id: string;
  node_id: string;
  username: string | null;
  display_name: string;
  score: number;
  tier: string;
}

interface FindResult {
  borough: string;
  skill: string;
  count: number;
  avg_score: number;
}

interface PublicUser {
  id: string;
  node_id: string;
  username: string | null;
  display_name: string;
  score: number;
  tier: string;
}

interface UserProfileResult {
  user: PublicUser;
  claims: unknown[];
}

interface ClaimResult {
  claim: { id: string; status: string };
  analysis: {
    extracted_name: string | null;
    doc_type: string;
    country?: string | null;
    institution: string | null;
    confidence: number;
  };
  new_score: number;
  tier: string;
}

interface VouchResult {
  new_score: number;
  tier: string;
}

function loadLocalEnv(): void {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      process.env[key] ??= value;
    }
  } catch {
    // Tests below will skip if the required env vars are still missing.
  }
}

function hasIntegrationEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

loadLocalEnv();
process.env.USE_FALLBACKS = "true";
process.env.NEXT_PUBLIC_USE_FALLBACKS = "true";

const skipIntegration = hasIntegrationEnv() ? false : "Supabase env vars are not configured";
const testRunId = Date.now().toString(36);
const testPassword = "password123";
let testUserId: string | null = null;
let testNodeId: string | null = null;
let testToken: string | null = null;
let voucherUserId: string | null = null;
let voucherToken: string | null = null;
let voucheeUserId: string | null = null;
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabase) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { realtime: { transport: class {} as unknown as typeof WebSocket } }
    );
  }
  return supabase;
}

after(async () => {
  if (!hasIntegrationEnv()) return;

  const userIds = [
    testUserId,
    voucherUserId,
    voucheeUserId,
  ].filter((id): id is string => Boolean(id));
  if (userIds.length === 0) return;

  await getSupabase().from("vouches").delete().in("voucher_id", userIds);
  await getSupabase().from("vouches").delete().in("vouchee_id", userIds);
  await getSupabase().from("claims").delete().in("user_id", userIds);
  await getSupabase().from("users").delete().in("id", userIds);
});

test("integration: register creates a real Supabase user", { skip: skipIntegration }, async () => {
  const { POST } = await import("../../src/app/api/auth/register/route");
  const displayName = `Integration Test ${testRunId}`;

  const response = await POST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        password: testPassword,
        skill: "Other",
        borough: "Southwark",
        doc_type: "passport",
      }),
    })
  );

  const body = await parseJson<RegisterResult>(response);

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data?.token);
  assert.match(body.data?.node_id ?? "", /^BLK-\d{5}-LDN$/);

  testUserId = body.data?.user_id ?? null;
  testNodeId = body.data?.node_id ?? null;
  testToken = body.data?.token ?? null;

  const { data: user } = await getSupabase()
    .from("users")
    .select("id, display_name, node_id")
    .eq("id", testUserId)
    .single();

  assert.equal(user?.display_name, displayName);
  assert.equal(user?.node_id, testNodeId);
});

test("integration: login authenticates the registered node id", { skip: skipIntegration }, async () => {
  assert.ok(testNodeId, "register test must create a node id first");

  const { POST } = await import("../../src/app/api/auth/login/route");
  const response = await POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: testNodeId,
        password: testPassword,
      }),
    })
  );

  const body = await parseJson<LoginResult>(response);

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.data?.user_id, testUserId);
  assert.equal(body.data?.node_id, testNodeId);
  assert.ok(body.data?.token);
});

test("integration: lookup returns a profile by user_id or username", { skip: skipIntegration }, async () => {
  assert.ok(testUserId, "register test must create a user first");
  assert.ok(testToken, "register test must create a token first");

  const username = `it_${testRunId}`;
  const { PATCH } = await import("../../src/app/api/auth/username/route");
  const usernameResponse = await PATCH(
    new Request("http://localhost/api/auth/username", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({ username }),
    })
  );

  assert.equal(usernameResponse.status, 200);

  const { GET } = await import("../../src/app/api/users/lookup/route");
  const byIdResponse = await GET(
    new Request(`http://localhost/api/users/lookup?user_id=${testUserId}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    })
  );
  const byId = await parseJson<UserProfileResult>(byIdResponse);

  assert.equal(byIdResponse.status, 200);
  assert.equal(byId.success, true);
  assert.equal(byId.data?.user.id, testUserId);
  assert.equal(byId.data?.user.username, username);

  const byUsernameResponse = await GET(
    new Request(`http://localhost/api/users/lookup?username=@${username}`, {
      headers: { Authorization: `Bearer ${testToken}` },
    })
  );
  const byUsername = await parseJson<UserProfileResult>(byUsernameResponse);

  assert.equal(byUsernameResponse.status, 200);
  assert.equal(byUsername.success, true);
  assert.equal(byUsername.data?.user.id, testUserId);
});

test("integration: find returns anonymized aggregate results", { skip: skipIntegration }, async () => {
  const { GET } = await import("../../src/app/api/find/route");
  const response = await GET(new Request("http://localhost/api/find?skill=Doctor&borough=Southwark"));
  const body = await parseJson<FindResult[]>(response);

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data));

  for (const result of body.data ?? []) {
    assert.equal(typeof result.borough, "string");
    assert.equal(typeof result.skill, "string");
    assert.equal(typeof result.count, "number");
    assert.equal(typeof result.avg_score, "number");
    assert.equal("id" in result, false);
    assert.equal("user_id" in result, false);
    assert.equal("node_id" in result, false);
    assert.equal("display_name" in result, false);
    assert.equal("username" in result, false);
  }
});

test("integration: claim submission verifies with fallback analysis and updates score", { skip: skipIntegration }, async () => {
  assert.ok(testToken, "register test must create a token first");

  const { POST } = await import("../../src/app/api/claims/route");
  const response = await POST(
    new Request("http://localhost/api/claims", {
      method: "POST",
      headers: { Authorization: `Bearer ${testToken}` },
      body: JSON.stringify({
        type: "identity",
        doc_type: "passport",
        image_base64: `integration-claim-${testRunId}`,
      }),
    })
  );
  const body = await parseJson<ClaimResult>(response);

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data?.claim.status, "verified");
  assert.equal(body.data?.analysis.extracted_name, `Integration Test ${testRunId}`);
  assert.equal(body.data?.analysis.doc_type, "passport");
  assert.equal(body.data?.analysis.confidence, 0.9);
  assert.equal(body.data?.new_score, 19);
  assert.equal(body.data?.tier, "unverified");
});

async function registerTestUser(displayName: string): Promise<RegisterResult> {
  const { POST } = await import("../../src/app/api/auth/register/route");
  const response = await POST(
    new Request("http://localhost/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        display_name: displayName,
        password: testPassword,
        skill: "Other",
        borough: "Southwark",
        doc_type: "passport",
      }),
    })
  );
  const body = await parseJson<RegisterResult>(response);
  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.ok(body.data);
  return body.data;
}

test("integration: verified voucher can vouch and update vouchee score", { skip: skipIntegration }, async () => {
  const voucher = await registerTestUser(`Integration Voucher ${testRunId}`);
  const vouchee = await registerTestUser(`Integration Vouchee ${testRunId}`);
  voucherUserId = voucher.user_id;
  voucherToken = voucher.token;
  voucheeUserId = vouchee.user_id;

  await getSupabase()
    .from("users")
    .update({ score: 50, tier: "verified" })
    .eq("id", voucherUserId);

  const { POST } = await import("../../src/app/api/vouch/route");
  const response = await POST(
    new Request("http://localhost/api/vouch", {
      method: "POST",
      headers: { Authorization: `Bearer ${voucherToken}` },
      body: JSON.stringify({ vouchee_id: voucheeUserId }),
    })
  );
  const body = await parseJson<VouchResult>(response);

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(body.data?.new_score, 0);
  assert.equal(body.data?.tier, "unverified");
});
