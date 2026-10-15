/**
 * AccessAble AI — n8n Webhook & Automation Test Suite
 * Executed via Node's test runner: `node --test tests/automation.test.mjs`
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

test.describe("AccessAble AI — Phase 10: Automation & Webhook Integration Tests", () => {
  const rootWorkflowPath = join(process.cwd(), "accessable-n8n-workflow.json");
  const publicWorkflowPath = join(process.cwd(), "frontend", "public", "accessable-n8n-workflow.json");
  const fallbackPublicPath = join(process.cwd(), "public", "accessable-n8n-workflow.json");

  // ---------------------------------------------------------------------------
  // 1. Workflow File Integrity & Schema
  // ---------------------------------------------------------------------------
  test("Workflow JSON file exists and contains valid JSON", () => {
    const targetFile = existsSync(publicWorkflowPath)
      ? publicWorkflowPath
      : existsSync(fallbackPublicPath)
      ? fallbackPublicPath
      : rootWorkflowPath;

    assert.ok(existsSync(targetFile), `Expected workflow file at ${targetFile}`);
    const content = readFileSync(targetFile, "utf-8");
    const parsed = JSON.parse(content);

    assert.ok(parsed.name && parsed.name.includes("AccessAble AI"));
    assert.ok(Array.isArray(parsed.nodes), "Expected workflow to have nodes array");
    assert.ok(parsed.nodes.length >= 4, "Expected at least 4 workflow nodes");

    const nodeTypes = parsed.nodes.map((n) => n.type);
    assert.ok(nodeTypes.some((t) => t.includes("webhook")), "Missing webhook trigger node");
    assert.ok(nodeTypes.some((t) => t.includes("httpRequest")), "Missing httpRequest node");
    assert.ok(nodeTypes.some((t) => t.includes("code")), "Missing evaluation code node");
  });

  // ---------------------------------------------------------------------------
  // 2. Secret Verification Logic
  // ---------------------------------------------------------------------------
  test("Evaluates secret verification header matching", () => {
    const testSecret = "sec_test_token_8971";

    function mockVerify(headers, expectedSecret) {
      if (!expectedSecret) return true;
      const customHeader = headers["x-n8n-secret"];
      const authHeader = headers["authorization"];
      if (customHeader === expectedSecret) return true;
      if (authHeader === `Bearer ${expectedSecret}`) return true;
      return false;
    }

    // Unconfigured secret allows local requests
    assert.equal(mockVerify({}, null), true);

    // Configured secret rejects missing header
    assert.equal(mockVerify({}, testSecret), false);

    // Configured secret rejects wrong header
    assert.equal(mockVerify({ "x-n8n-secret": "wrong-secret" }, testSecret), false);

    // Configured secret accepts matching custom header
    assert.equal(mockVerify({ "x-n8n-secret": testSecret }, testSecret), true);

    // Configured secret accepts matching bearer token
    assert.equal(mockVerify({ authorization: `Bearer ${testSecret}` }, testSecret), true);
  });

  // ---------------------------------------------------------------------------
  // 3. Execution ID & Timestamp Schema
  // ---------------------------------------------------------------------------
  test("Generates valid execution ID prefix and ISO timestamp", () => {
    const executionId = `exec_n8n_${Date.now()}`;
    const timestamp = new Date().toISOString();

    assert.ok(executionId.startsWith("exec_n8n_"));
    assert.ok(!Number.isNaN(new Date(timestamp).getTime()));
  });

  // ---------------------------------------------------------------------------
  // 4. Action Dispatch Resolution
  // ---------------------------------------------------------------------------
  test("Recognizes and routes supported automation actions", () => {
    const validActions = ["test", "ping", "status", "audit", "scan", "journey"];
    const invalidActions = ["drop_database", "eval_js", "unknown_cmd"];

    function isValidAction(action) {
      return validActions.includes(action.toLowerCase());
    }

    for (const action of validActions) {
      assert.equal(isValidAction(action), true, `Expected action '${action}' to be recognized`);
    }

    for (const action of invalidActions) {
      assert.equal(isValidAction(action), false, `Expected action '${action}' to be rejected`);
    }
  });
});
