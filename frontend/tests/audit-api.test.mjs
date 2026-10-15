/**
 * AccessAble AI — Audit API & Validation Integration Tests
 * Executed via Node test runner: `node --test tests/audit-api.test.mjs`
 */

import test from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

let serverAvailable = false;

test.before(async () => {
  try {
    const res = await fetch(`${BASE_URL}/favicon.ico`, { signal: AbortSignal.timeout(1500) });
    serverAvailable = res.status < 500;
  } catch {
    serverAvailable = false;
  }
});

test.describe("AccessAble AI — Audit & Experiment API Integration Tests", () => {
  // 1. Malformed JSON handling
  test("POST /api/audit with malformed JSON body returns HTTP 400", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json string{{{",
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
    assert.match(data.error, /invalid json body/i);
  });

  // 2. Invalid payload shape (Array instead of Object)
  test("POST /api/audit with Array body returns HTTP 400", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["unsupported", "array"]),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /expected a json object/i);
  });

  // 3. Unsupported payload fields
  test("POST /api/audit with unsupported field returns HTTP 400", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ injectedField: "malicious" }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /unsupported field 'injectedField'/i);
  });

  // 4. Invalid targetUrl type
  test("POST /api/audit with non-string targetUrl returns HTTP 400", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: 12345 }),
    });
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /targetUrl must be a string/i);
  });

  // 5. Forbidden external target URL
  test("POST /api/audit with external URL returns HTTP 403 Forbidden", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUrl: "https://evil-external-site.com" }),
    });
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.error, /security violation/i);
  });

  // 6. Valid empty body returns HTTP 200 with status 'success'
  test("POST /api/audit with empty body {} returns HTTP 200", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, "success");
    assert.ok(Array.isArray(data.issues));
    assert.ok(data.issues.length > 0);
  });

  // 7. GET /api/experiment returns valid structure with real evidence
  test("GET /api/experiment returns read-only experiment status with real evidence", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/api/experiment`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.experimentId);
    assert.ok(["available", "unavailable"].includes(data.status));
    assert.ok(["json_files", "in_memory"].includes(data.storageMechanism));
    assert.ok(Array.isArray(data.evidenceReferences));
  });

  // 8. GET /demo/sandbox loads successfully
  test("GET /demo/sandbox returns HTTP 200", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/demo/sandbox`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Global Leaders Fellowship Program 2026"));
  });

  // 9. GET /favicon.ico returns HTTP 200
  test("GET /favicon.ico returns HTTP 200 without error", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}`);
      return;
    }
    const res = await fetch(`${BASE_URL}/favicon.ico`);
    assert.equal(res.status, 200);
  });
});
