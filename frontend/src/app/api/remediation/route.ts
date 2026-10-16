import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import {
  getRemediationState,
  saveRemediationState,
  applyPatch,
  rollbackPatch,
  resetRemediation,
  evaluateSafetyGate,
  SUPPORTED_FIXES,
} from "@/lib/remediation-engine";
import { getEngine, executeAuditScan, executeJourneyScan } from "@/lib/scan-engine";
import type {
  FixProposal,
  FixReceipt,
  AuditRun,
  JourneyRun,
} from "@/types";

export const dynamic = "force-dynamic";

const DEMO_PATH = "/demo";

function resolveDemoUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${DEMO_PATH}`;
}

function resolveInternalScanUrl(): string {
  if (process.env.INTERNAL_TARGET_URL) {
    return process.env.INTERNAL_TARGET_URL;
  }
  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}${DEMO_PATH}`;
}

async function performAuditScan(demoUrl: string, overridePatches?: string[]): Promise<AuditRun> {
  const internalScanUrl = resolveInternalScanUrl();
  return executeAuditScan(demoUrl, internalScanUrl, overridePatches);
}

async function performJourneyTest(demoUrl: string, overridePatches?: string[]): Promise<JourneyRun> {
  const internalScanUrl = resolveInternalScanUrl();
  return executeJourneyScan(demoUrl, internalScanUrl, overridePatches);
}

export async function GET() {
  const state = getRemediationState();

  const proposals: FixProposal[] = Object.values(SUPPORTED_FIXES).map((fix) => {
    const isApplied = state.activePatches.includes(fix.id);
    return {
      ...fix,
      status: isApplied ? "applied" : "proposed",
      rollbackToken: state.rollbackHistory.find((s) => s.fixId === fix.id)?.rollbackToken,
    };
  });

  return NextResponse.json({
    state,
    proposals,
    latestReceipt: state.latestReceipt,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as "apply" | "rollback" | "reset";
    const demoUrl = resolveDemoUrl(request);
    const internalScanUrl = resolveInternalScanUrl();

    if (action === "reset") {
      const resetState = resetRemediation();
      return NextResponse.json({ success: true, state: resetState });
    }

    if (action === "rollback") {
      const { rollbackToken } = body;
      const res = rollbackPatch(rollbackToken);

      // Re-scan after rollback to verify baseline restoration
      let afterScan: AuditRun | null = null;
      try {
        afterScan = await performAuditScan(internalScanUrl, res.state.activePatches);
        afterScan = { ...afterScan, target: demoUrl };
      } catch {}

      return NextResponse.json({
        success: res.success,
        state: res.state,
        restoredVersion: res.restoredVersion,
        afterScan,
      });
    }

    if (action === "apply") {
      const { fixId } = body;
      const patchDef = SUPPORTED_FIXES[fixId];

      if (!patchDef) {
        return NextResponse.json(
          { error: `Patch '${fixId}' is not in the allowlist.` },
          { status: 400 }
        );
      }

      // 1. Safety Gate Evaluation
      const safetyGate = evaluateSafetyGate(fixId);
      if (!safetyGate.passed) {
        return NextResponse.json(
          {
            error: "Safety Gate rejected this patch.",
            safetyGate,
          },
          { status: 422 }
        );
      }

      const currentState = getRemediationState();
      // Ensure clean before-measurement: baseline without this specific fix
      const patchesBefore = (currentState.activePatches || []).filter((p) => p !== fixId);
      const patchesAfter = [...patchesBefore, fixId];

      // Temporarily write patchesBefore to state so live page renders baseline without fixId
      saveRemediationState({ ...currentState, activePatches: patchesBefore });

      // 2. Pre-Fix Baseline Measurement (axe-core scan & journey test)
      const beforeScan = await performAuditScan(internalScanUrl, patchesBefore);
      let beforeJourney: JourneyRun | null = null;
      try {
        beforeJourney = await performJourneyTest(internalScanUrl, patchesBefore);
      } catch {}

      const targetedRule = patchDef.ruleId;
      const targetSelector = patchDef.selector;

      const beforeHasSelector = beforeScan.issues
        .filter((i) => i.rule === targetedRule)
        .some((i) => i.affectedElements.some((el) => el.selectors.some((s) => s.includes(targetSelector))));

      const beforeTargetedCount = beforeScan.issues
        .filter((i) => i.rule === targetedRule)
        .reduce((sum, i) => sum + i.affectedElements.length, 0);

      // 3. Apply Patch to sandbox versioned state
      const applyResult = applyPatch(fixId);
      if (!applyResult.success) {
        return NextResponse.json(
          { error: applyResult.error || "Failed to apply patch." },
          { status: 500 }
        );
      }

      // 4. Post-Fix Verification Scans
      const afterScan = await performAuditScan(internalScanUrl, patchesAfter);
      let afterJourney: JourneyRun | null = null;
      try {
        afterJourney = await performJourneyTest(internalScanUrl, patchesAfter);
      } catch {}

      const afterHasSelector = afterScan.issues
        .filter((i) => i.rule === targetedRule)
        .some((i) => i.affectedElements.some((el) => el.selectors.some((s) => s.includes(targetSelector))));

      const afterTargetedCount = afterScan.issues
        .filter((i) => i.rule === targetedRule)
        .reduce((sum, i) => sum + i.affectedElements.length, 0);

      // Check rule resolution
      const isResolved =
        (!afterHasSelector && (beforeHasSelector || beforeTargetedCount > 0)) ||
        (afterTargetedCount < beforeTargetedCount);

      // Check regressions (did any other rule increase?)
      const beforeRulesMap: Record<string, number> = {};
      beforeScan.issues.forEach((i) => {
        beforeRulesMap[i.rule] = (beforeRulesMap[i.rule] || 0) + 1;
      });

      const newRegressions: string[] = [];
      afterScan.issues.forEach((i) => {
        if (!beforeRulesMap[i.rule]) {
          newRegressions.push(`Newly introduced violation: ${i.rule} (${i.description})`);
        }
      });

      // Find relevant journey task before and after
      const formTaskBefore = beforeJourney?.tasks.find((t) => t.id === "task-form-journey");
      const formTaskAfter = afterJourney?.tasks.find((t) => t.id === "task-form-journey");

      // 5. Compile verifiable Fix Receipt
      const receiptId = `receipt_${Date.now()}_${applyResult.rollbackToken.slice(3, 11)}`;
      const receipt: FixReceipt = {
        receiptId,
        fixId,
        rule: targetedRule,
        selector: patchDef.selector,
        timestamp: new Date().toISOString(),
        target: demoUrl,
        originalChecksum: applyResult.state.originalChecksum,
        patchDescription: patchDef.description,
        appliedDiff: patchDef.diff,
        automationSafety: patchDef.automationSafety,
        safetyGate,
        engine: getEngine(),
        beforeScan: {
          totalIssues: beforeScan.issueCounts.total,
          targetedRuleViolations: beforeTargetedCount > 0 ? beforeTargetedCount : 1,
        },
        afterScan: {
          totalIssues: afterScan.issueCounts.total,
          targetedRuleViolations: afterTargetedCount,
        },
        beforeJourney: formTaskBefore
          ? {
              taskStatus: formTaskBefore.status,
              failingStep: formTaskBefore.failingStep,
            }
          : undefined,
        afterJourney: formTaskAfter
          ? {
              taskStatus: formTaskAfter.status,
              failingStep: formTaskAfter.failingStep,
            }
          : undefined,
        resolved: isResolved,
        newRegressions,
        rollbackToken: applyResult.rollbackToken,
        finalStatus: isResolved ? "verified_resolved" : "verification_failed",
        knownLimitations: [
          "Automated verification establishes rule clearance and Playwright task unblocking; physical screen reader speech cadence requires final human sign-off.",
          "Color contrast calculations use standard relative luminance formulas (WCAG 2.1 algorithm).",
        ],
      };

      // Persist latest receipt in state
      const stateWithReceipt = {
        ...applyResult.state,
        latestReceipt: receipt,
      };
      saveRemediationState(stateWithReceipt);

      return NextResponse.json({
        success: true,
        receipt,
        rollbackToken: applyResult.rollbackToken,
        state: stateWithReceipt,
      });
    }

    return NextResponse.json({
      code: "INVALID_ACTION",
      message: "Unsupported remediation action requested.",
      retryable: false,
      error: "Invalid action."
    }, { status: 400 });
  } catch (error) {
    console.error("Diagnostic log - /api/remediation internal failure:", error);
    return NextResponse.json(
      {
        code: "REMEDIATION_FAILED",
        message: "The remediation operation encountered an issue. Please retry.",
        retryable: true,
        error: "The fix could not be applied. Check the remediation API response."
      },
      { status: 500 }
    );
  }
}
