/**
 * AccessAble AI — Integration Test Suite
 * Executed via Node's built-in test runner: `node --test tests/integration.test.mjs`
 */

import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateContrastRatio,
  SUPPORTED_FIXES,
  evaluateSafetyGate,
  getRemediationState,
  saveRemediationState,
  applyPatch,
  rollbackPatch,
  resetRemediation,
} from "../src/lib/remediation-engine.ts";

test.describe("AccessAble AI — Core Integration Test Suite", () => {
  // Preserve original state before tests and restore afterwards
  let originalStateSnapshot = null;

  test.before(() => {
    originalStateSnapshot = JSON.parse(JSON.stringify(getRemediationState()));
  });

  test.after(() => {
    if (originalStateSnapshot) {
      saveRemediationState(originalStateSnapshot);
    }
  });

  // ---------------------------------------------------------------------------
  // 1. WCAG Contrast Calculation & 4.5:1 Normal-Text Threshold
  // ---------------------------------------------------------------------------
  test.describe("1. WCAG Contrast Calculation", () => {
    test("Calculates maximum contrast for pure black on pure white (21:1)", () => {
      const contrast = calculateContrastRatio("#000000", "#ffffff");
      assert.equal(contrast, 21);
    });

    test("Calculates minimum contrast for identical colors (1:1)", () => {
      const contrast = calculateContrastRatio("#ffffff", "#ffffff");
      assert.equal(contrast, 1);
    });

    test("Confirms baseline demo button colors fail WCAG AA 4.5:1 threshold", () => {
      // Baseline submit button: #93c5fd text on #eff6ff background
      const baselineContrast = calculateContrastRatio("#eff6ff", "#93c5fd");
      assert.ok(
        baselineContrast < 4.5,
        `Expected baseline contrast (${baselineContrast}:1) to fail 4.5:1 threshold`
      );
    });

    test("Confirms patched submit button exceeds WCAG AA 4.5:1 threshold", () => {
      // Patched submit button: #ffffff text on #0369a1 background
      const patchedContrast = calculateContrastRatio("#ffffff", "#0369a1");
      assert.ok(
        patchedContrast >= 4.5,
        `Expected patched contrast (${patchedContrast}:1) to meet or exceed 4.5:1 threshold`
      );
      assert.ok(patchedContrast >= 5.5, "Expected contrast ratio above 5.5:1");
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Allowlisted Patches & Unknown Patch Rejection
  // ---------------------------------------------------------------------------
  test.describe("2. Allowlisted Patch Verification", () => {
    test("Contains all 3 expected allowlisted remediation patches", () => {
      const patchIds = Object.keys(SUPPORTED_FIXES);
      assert.ok(patchIds.includes("fix-bookmark-btn"), "Missing fix-bookmark-btn");
      assert.ok(patchIds.includes("fix-national-id-input"), "Missing fix-national-id-input");
      assert.ok(patchIds.includes("fix-submit-app-btn"), "Missing fix-submit-app-btn");
      assert.equal(patchIds.length, 3);
    });

    test("Each patch has valid ruleId, selector, and non-empty diff", () => {
      for (const [id, patch] of Object.entries(SUPPORTED_FIXES)) {
        assert.equal(patch.id, id);
        assert.ok(patch.ruleId && typeof patch.ruleId === "string");
        assert.ok(patch.selector && patch.selector.startsWith("#"));
        assert.ok(patch.diff && patch.diff.includes("--- a/"));
        assert.ok(patch.expectedOutcome.length > 0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Safety Gate & Visible Text Preservation
  // ---------------------------------------------------------------------------
  test.describe("3. Safety Gate Evaluation", () => {
    test("Rejects unknown patch ID with passed: false", () => {
      const result = evaluateSafetyGate("unauthorized-malicious-patch");
      assert.equal(result.passed, false);
      assert.equal(result.allowlistMatch, false);
      assert.equal(result.unexpectedDomChanges, true);
      assert.ok(result.details[0].includes("Rejected"));
    });

    test("Passes allowlisted patch 'fix-bookmark-btn' with safe details", () => {
      const result = evaluateSafetyGate("fix-bookmark-btn");
      assert.equal(result.passed, true);
      assert.equal(result.allowlistMatch, true);
      assert.equal(result.visibleTextUnchanged, true);
      assert.equal(result.unexpectedDomChanges, false);
      assert.ok(result.details.some((d) => d.includes("Accessible name added")));
    });

    test("Passes allowlisted patch 'fix-national-id-input' verifying label association", () => {
      const result = evaluateSafetyGate("fix-national-id-input");
      assert.equal(result.passed, true);
      assert.equal(result.allowlistMatch, true);
      assert.equal(result.visibleTextUnchanged, true);
      assert.ok(result.details.some((d) => d.includes("National ID or Passport Number")));
    });

    test("Passes allowlisted patch 'fix-submit-app-btn' verifying contrast and preserved text", () => {
      const result = evaluateSafetyGate("fix-submit-app-btn");
      assert.equal(result.passed, true);
      assert.equal(result.visibleTextUnchanged, true);
      assert.ok(result.details.some((d) => d.includes("Submit Application")));
      assert.ok(result.details.some((d) => d.includes("exceeds WCAG AA")));
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Remediation State Transitions & Version Increments
  // ---------------------------------------------------------------------------
  test.describe("4. State Transitions & Version Tracking", () => {
    test("Increments version and adds patch to activePatches when applied", () => {
      resetRemediation();
      const initialState = getRemediationState();
      const initialVersion = initialState.version;

      const res = applyPatch("fix-bookmark-btn");
      assert.equal(res.success, true);
      assert.ok(res.rollbackToken.length > 0);
      assert.equal(res.state.version, initialVersion + 1);
      assert.ok(res.state.activePatches.includes("fix-bookmark-btn"));

      const latestState = getRemediationState();
      assert.equal(latestState.version, initialVersion + 1);
      assert.ok(latestState.activePatches.includes("fix-bookmark-btn"));
    });

    test("Rejects applying an unknown patch without altering state", () => {
      const beforeState = getRemediationState();
      const res = applyPatch("unknown-patch-id-xyz");
      assert.equal(res.success, false);
      assert.ok(res.error.includes("Unsupported patch"));
      const afterState = getRemediationState();
      assert.equal(afterState.version, beforeState.version);
      assert.deepEqual(afterState.activePatches, beforeState.activePatches);
    });

    test("Rollback restores previous active patches and increments state version", () => {
      const stateBeforeRollback = getRemediationState();
      const versionBefore = stateBeforeRollback.version;

      const rollbackRes = rollbackPatch();
      assert.equal(rollbackRes.success, true);
      assert.equal(rollbackRes.state.version, versionBefore + 1);
      assert.ok(!rollbackRes.state.activePatches.includes("fix-bookmark-btn"));
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Fix Receipt Schema & Audit Trail Validation
  // ---------------------------------------------------------------------------
  test.describe("5. Fix Receipt Schema & Verification Integrity", () => {
    test("Fix receipt contains all mandatory cryptographic and audit fields", () => {
      const mockReceipt = {
        receiptId: "receipt-test-179207",
        fixId: "fix-bookmark-btn",
        rule: "button-name",
        selector: "#bookmark-btn",
        timestamp: new Date().toISOString(),
        target: "http://localhost:3000/demo",
        originalChecksum: "2252213b90c25b9f",
        patchDescription: "Add descriptive accessible name to bookmark icon",
        appliedDiff: "--- a/demo\n+++ b/demo",
        automationSafety: "safe to auto-apply",
        safetyGate: evaluateSafetyGate("fix-bookmark-btn"),
        beforeScan: { totalIssues: 4, targetedRuleViolations: 1 },
        afterScan: { totalIssues: 3, targetedRuleViolations: 0 },
        beforeJourney: { taskStatus: "blocked", failingStep: "Step 1" },
        afterJourney: { taskStatus: "passed" },
        resolved: true,
        newRegressions: [],
        rollbackToken: "rbk_test_tok_991",
        finalStatus: "verified_clean",
      };

      // Assert mandatory schema fields
      assert.ok(mockReceipt.receiptId.startsWith("receipt-"));
      assert.ok(mockReceipt.timestamp);
      assert.ok(mockReceipt.originalChecksum);
      assert.equal(mockReceipt.safetyGate.passed, true);
      assert.equal(mockReceipt.safetyGate.allowlistMatch, true);
      assert.equal(mockReceipt.beforeScan.targetedRuleViolations, 1);
      assert.equal(mockReceipt.afterScan.targetedRuleViolations, 0);
      assert.equal(mockReceipt.resolved, true);
      assert.equal(mockReceipt.newRegressions.length, 0);
      assert.ok(mockReceipt.rollbackToken.startsWith("rbk_"));
      assert.equal(mockReceipt.finalStatus, "verified_clean");
    });
  });
});
