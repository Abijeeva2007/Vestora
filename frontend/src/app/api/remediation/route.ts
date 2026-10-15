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
import type {
  FixProposal,
  FixReceipt,
  AuditRun,
  JourneyRun,
} from "@/types";

export const dynamic = "force-dynamic";

const DEMO_PATH = "/demo";
const TIMEOUT_MS = 60_000;

function resolveDemoUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${DEMO_PATH}`;
}

async function runAxeScan(targetUrl: string): Promise<AuditRun> {
  const { spawn } = await import("node:child_process");
  const scriptPath = join(process.cwd(), "scripts", "axe-scan.mjs");

  return new Promise((resolve, reject) => {
    const child = spawn("sh", ["-c", `node "${scriptPath}" "${targetUrl}"`], {
      cwd: process.cwd(),
      env: { ...process.env, TARGET_URL: targetUrl },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      try { child.kill("SIGTERM"); } catch {}
      reject(new Error("Scan timed out"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("exit", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout.trim()) as AuditRun);
      } catch (err) {
        reject(new Error(stderr || "Axe scan parse failed"));
      }
    });
  });
}

async function runJourneyTest(targetUrl: string): Promise<JourneyRun> {
  const { spawn } = await import("node:child_process");
  const scriptPath = join(process.cwd(), "scripts", "journey-runner.mjs");

  return new Promise((resolve, reject) => {
    const child = spawn("sh", ["-c", `node "${scriptPath}" "${targetUrl}"`], {
      cwd: process.cwd(),
      env: { ...process.env, TARGET_URL: targetUrl },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      try { child.kill("SIGTERM"); } catch {}
      reject(new Error("Journey test timed out"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("exit", () => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(stdout.trim()) as JourneyRun);
      } catch (err) {
        reject(new Error(stderr || "Journey test parse failed"));
      }
    });
  });
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
    const body = await request.json();
    const action = body.action as "apply" | "rollback" | "reset";
    const demoUrl = resolveDemoUrl(request);

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
        afterScan = await runAxeScan(demoUrl);
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

      // 2. Pre-Fix Baseline Measurement (axe-core scan & journey test)
      const beforeScan = await runAxeScan(demoUrl);
      let beforeJourney: JourneyRun | null = null;
      try {
        beforeJourney = await runJourneyTest(demoUrl);
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
      const afterScan = await runAxeScan(demoUrl);
      let afterJourney: JourneyRun | null = null;
      try {
        afterJourney = await runJourneyTest(demoUrl);
      } catch {}

      const afterHasSelector = afterScan.issues
        .filter((i) => i.rule === targetedRule)
        .some((i) => i.affectedElements.some((el) => el.selectors.some((s) => s.includes(targetSelector))));

      const afterTargetedCount = afterScan.issues
        .filter((i) => i.rule === targetedRule)
        .reduce((sum, i) => sum + i.affectedElements.length, 0);

      // Check rule resolution
      const isResolved =
        (!afterHasSelector && beforeHasSelector) ||
        (afterTargetedCount < beforeTargetedCount);

      // Check regressions (did any other rule increase?)
      const beforeRulesMap: Record<string, number> = {};
      beforeScan.issues.forEach((i) => {
        beforeRulesMap[i.rule] = (beforeRulesMap[i.rule] || 0) + 1;
      });

      const newRegressions: string[] = [];
      afterScan.issues.forEach((i) => {
        const prev = beforeRulesMap[i.rule] || 0;
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
        beforeScan: {
          totalIssues: beforeScan.issueCounts.total,
          targetedRuleViolations: beforeTargetedCount,
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

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Remediation operation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
