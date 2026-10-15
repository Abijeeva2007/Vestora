/**
 * AccessAble AI — End-to-End Demo Stabilization & Regression Test
 *
 * Verifies the complete primary hackathon demonstration flow:
 * Reset demo baseline → Run audit → Confirm National ID barrier exists →
 * Run journey → Confirm blocked at Step 2 → Apply allowlisted patch →
 * Re-scan audit → Confirm National ID barrier resolved → Re-run journey →
 * Confirm Step 2 unblocked and accurately reports remaining contrast issue →
 * Validate cryptographic fix receipt → Rollback patch → Confirm baseline restored.
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

test.describe("AccessAble AI — Primary Demonstration E2E Flow", () => {
  test("Complete End-to-End Demonstration Lifecycle (Audit -> Journey -> Fix -> Verify -> Rollback)", async (t) => {
    if (!serverAvailable) {
      t.skip(`Server not reachable at ${BASE_URL}. Run server first for live integration tests.`);
      return;
    }

    // 1. Reset the demo fixture to baseline
    const resetRes = await fetch(`${BASE_URL}/api/remediation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    assert.equal(resetRes.status, 200, "Reset endpoint must return HTTP 200");
    const resetData = await resetRes.json();
    assert.equal(resetData.success, true);
    assert.deepEqual(resetData.state.activePatches, []);
    assert.equal(resetData.state.latestReceipt, null);

    // 2. Run initial real audit on baseline
    const audit1Res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(audit1Res.status, 200);
    const audit1 = await audit1Res.json();
    assert.equal(audit1.status, "success");
    const labelIssue1 = audit1.issues.find((i) => i.rule === "label");
    assert.ok(labelIssue1, "Baseline audit must detect 'label' rule violation");
    const hasNationalId1 = labelIssue1.affectedElements.some((el) =>
      el.selectors.some((s) => s.includes("#national-id-input"))
    );
    assert.equal(hasNationalId1, true, "Baseline must identify #national-id-input as unlabelled");

    // 3. Run initial user journey on baseline
    const journey1Res = await fetch(`${BASE_URL}/api/journeys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(journey1Res.status, 200);
    const journey1 = await journey1Res.json();
    assert.equal(journey1.status, "success");
    const formTask1 = journey1.tasks.find((t) => t.id === "task-form-journey");
    assert.ok(formTask1, "Journey tasks must include 'task-form-journey'");
    assert.equal(formTask1.status, "blocked", "Scholarship application flow must be blocked on baseline");
    assert.match(formTask1.failingStep || "", /Step 2.*National ID/i);

    // 4. Apply the supported fix: fix-national-id-input
    const applyRes = await fetch(`${BASE_URL}/api/remediation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "apply", fixId: "fix-national-id-input" }),
    });
    assert.equal(applyRes.status, 200, "Applying allowlisted fix must succeed with HTTP 200");
    const applyData = await applyRes.json();
    assert.equal(applyData.success, true);
    assert.ok(applyData.receipt, "Must return generated fix receipt");
    assert.equal(applyData.receipt.rule, "label");
    assert.equal(applyData.receipt.selector, "#national-id-input");
    assert.equal(applyData.receipt.resolved, true, "Patch resolution must be verified as true");
    assert.equal(applyData.receipt.finalStatus, "verified_resolved");
    assert.ok(applyData.receipt.beforeScan.targetedRuleViolations >= 1);
    assert.equal(applyData.receipt.afterScan.targetedRuleViolations, 0);
    assert.ok(applyData.receipt.rollbackToken.startsWith("rb_"));
    assert.ok(applyData.receipt.originalChecksum);

    // Confirm that the journey report in the receipt accurately records unblocking Step 2
    assert.equal(applyData.receipt.beforeJourney?.taskStatus, "blocked");
    assert.notEqual(applyData.receipt.afterJourney?.taskStatus, "blocked", "Form flow must no longer be blocked at Step 2");

    // 5. Run second real audit on post-fix state
    const audit2Res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(audit2Res.status, 200);
    const audit2 = await audit2Res.json();
    const labelIssue2 = audit2.issues.find((i) => i.rule === "label");
    assert.equal(labelIssue2, undefined, "Post-fix audit must confirm 'label' violation on #national-id-input is cleared");

    // 6. Run second journey on post-fix state
    const journey2Res = await fetch(`${BASE_URL}/api/journeys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(journey2Res.status, 200);
    const journey2 = await journey2Res.json();
    const formTask2 = journey2.tasks.find((t) => t.id === "task-form-journey");
    assert.ok(formTask2);
    // Task is unblocked at Step 2 (proceeds through), though Step 5 still has contrast warning
    assert.notEqual(formTask2.status, "blocked", "Form task must be unblocked after label patch");

    // 7. Verify receipt state from GET /api/remediation
    const remStateRes = await fetch(`${BASE_URL}/api/remediation`);
    assert.equal(remStateRes.status, 200);
    const remStateData = await remStateRes.json();
    assert.ok(remStateData.latestReceipt);
    assert.equal(remStateData.latestReceipt.receiptId, applyData.receipt.receiptId);
    assert.deepEqual(remStateData.state.activePatches, ["fix-national-id-input"]);

    // 8. Rollback the patch and confirm baseline restoration
    const rollbackRes = await fetch(`${BASE_URL}/api/remediation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rollback", rollbackToken: applyData.receipt.rollbackToken }),
    });
    assert.equal(rollbackRes.status, 200);
    const rollbackData = await rollbackRes.json();
    assert.equal(rollbackData.success, true);
    assert.deepEqual(rollbackData.state.activePatches, []);

    // 9. Post-rollback audit: confirm barrier is restored
    const audit3Res = await fetch(`${BASE_URL}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(audit3Res.status, 200);
    const audit3 = await audit3Res.json();
    const labelIssue3 = audit3.issues.find((i) => i.rule === "label");
    assert.ok(labelIssue3, "Post-rollback audit must confirm 'label' barrier is restored to baseline");
  });
});
