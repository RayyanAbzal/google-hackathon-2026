import assert from "node:assert/strict";
import { test } from "node:test";
import { generateNodeId, generateUniqueNodeId } from "../../src/lib/nodeId";

test("generateNodeId formats ids as BLK-00000-LDN", () => {
  assert.equal(generateNodeId(() => 0), "BLK-00000-LDN");
  assert.equal(generateNodeId(() => 0.471), "BLK-47099-LDN");
});

test("generateUniqueNodeId retries when a generated id already exists", async () => {
  const candidates = ["BLK-00001-LDN", "BLK-00002-LDN"];
  const checked: string[] = [];

  const result = await generateUniqueNodeId(
    async (nodeId) => {
      checked.push(nodeId);
      return nodeId === "BLK-00001-LDN";
    },
    {
      generate: () => candidates.shift() ?? "BLK-99999-LDN",
    }
  );

  assert.equal(result, "BLK-00002-LDN");
  assert.deepEqual(checked, ["BLK-00001-LDN", "BLK-00002-LDN"]);
});

test("generateUniqueNodeId fails after the max attempt count", async () => {
  await assert.rejects(
    () =>
      generateUniqueNodeId(async () => true, {
        maxAttempts: 2,
        generate: () => "BLK-00001-LDN",
      }),
    /Unable to allocate unique node_id/
  );
});
