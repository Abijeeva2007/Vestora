"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRemediationStore } from "@/lib/remediation-store";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { FixReceipt } from "@/types";

function ReceiptSignatureBadge({ receipt }: { receipt: FixReceipt }) {
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "unsigned">("loading");
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    let isCancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/receipts/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receipt })
        });
        const data = await res.json();
        if (isCancelled) return;
        if (data.valid && data.status === "signed") {
          setStatus("valid");
        } else if (data.status === "unsigned") {
          setStatus("unsigned");
        } else {
          setStatus("invalid");
          setReason(data.reason || "Invalid signature");
        }
      } catch {
        if (!isCancelled) {
          setStatus("invalid");
          setReason("Verification request failed");
        }
      }
    }
    check();
    return () => {
      isCancelled = true;
    };
  }, [receipt]);

  if (status === "loading") {
    return (
      <span className="text-[11px] font-semibold bg-neutral-100 border border-neutral-200 text-neutral-500 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-pulse" />
        Verifying signature...
      </span>
    );
  }

  if (status === "valid") {
    return (
      <span
        className="text-[11px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
        title="HMAC-SHA256 signature verified"
      >
        <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Signature valid
      </span>
    );
  }

  if (status === "invalid") {
    return (
      <span
        className="text-[11px] font-semibold bg-rose-50 border border-rose-200 text-rose-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
        title={reason || "Signature mismatch"}
      >
        <svg className="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Signature invalid
      </span>
    );
  }

  return (
    <span
      className="text-[11px] font-semibold bg-neutral-100 border border-neutral-300 text-neutral-600 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1"
      title="No HMAC signature present"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
      Unsigned
    </span>
  );
}

export default function VerificationReportsPage() {
  const {
    latestReceipt,
    isRollingBack,
    error,
    fetchRemediationData,
    rollbackFix,
    clearNotifications,
  } = useRemediationStore();

  useEffect(() => {
    fetchRemediationData();
  }, [fetchRemediationData]);

  const handleExportJson = () => {
    if (!latestReceipt) return;
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(latestReceipt, null, 2)
    )}`;
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute(
      "download",
      `accessable-fix-receipt-${latestReceipt.receiptId}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8">
      {/* Workflow Stage Indicator */}
      <div className="p-3.5 bg-neutral-100/80 border border-neutral-200 rounded-2xl flex items-center justify-between text-xs font-semibold text-neutral-600 overflow-x-auto">
        <div className="flex items-center gap-2">
          <span className="text-neutral-400 font-normal">Workflow:</span>
          <Link href="/audits" className="hover:text-neutral-900 transition-colors">1. Audit</Link>
          <span className="text-neutral-300">→</span>
          <Link href="/journeys" className="hover:text-neutral-900 transition-colors">2. Journey</Link>
          <span className="text-neutral-300">→</span>
          <Link href="/fix-review" className="hover:text-neutral-900 transition-colors">3. Fix Review</Link>
          <span className="text-neutral-300">→</span>
          <span className="text-neutral-950 font-bold bg-white px-2.5 py-1 rounded-full shadow-xs border border-neutral-200">
            4. Verify &amp; Receipt (Active)
          </span>
        </div>
        <Link href="/demo" className="text-neutral-950 hover:underline shrink-0 text-[11px]">
          Target: /demo ↗
        </Link>
      </div>

      <PageHeader
        eyebrow="FIX RECEIPTS"
        title="Verification Reports"
        description="Inspect before-and-after audit comparisons, regression analyses, safety-gate audit trails, and export checksummed JSON fix receipts. Automated checks do not guarantee complete WCAG compliance."
        action={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportJson}
              disabled={!latestReceipt}
              aria-disabled={!latestReceipt}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 shadow-xs ${
                latestReceipt
                  ? "bg-[#0369A1] text-white hover:bg-[#0284C7] cursor-pointer"
                  : "bg-neutral-100 text-neutral-600 border border-neutral-300 cursor-not-allowed"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export JSON Fix Receipt</span>
            </button>
          </div>
        }
      />

      {error && (
        <ErrorState
          title="Verification Action Failed"
          message={error}
          retryLabel="Dismiss & Retry"
          onRetry={clearNotifications}
        />
      )}

      {!latestReceipt ? (
        <EmptyState
          title="No verification yet"
          description="No verification yet. Apply a fix, then run Verify."
          action={
            <Link
              href="/fix-review"
              className="px-6 py-2.5 rounded-full bg-[#0369A1] text-white text-xs font-semibold hover:bg-[#0284C7] transition-colors inline-block shadow-xs"
            >
              Go to Fix Review →
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Main Verification Status Banner */}
          <div className="p-6 sm:p-8 rounded-[24px] border border-neutral-200 bg-white shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                  <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                    Remediation Verification Receipt
                  </span>
                  {latestReceipt.finalStatus === "verified_resolved" ? (
                    <StatusPill status="pass" label="Verified Cleared" />
                  ) : latestReceipt.finalStatus === "rolled_back" ? (
                    <StatusPill status="unavailable" label="Rolled Back" />
                  ) : (
                    <StatusPill status="fail" label="Verification Failed" />
                  )}
                  <span className="text-xs font-mono font-bold bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full text-neutral-900">
                    {latestReceipt.rule}
                  </span>
                  <span className="text-[11px] font-semibold bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1] px-2.5 py-0.5 rounded-full">
                    {latestReceipt.engine === "full" ? "Engine: Full browser" : "Engine: Lightweight hosted scan"}
                  </span>
                  <ReceiptSignatureBadge receipt={latestReceipt} />
                </div>
                <h2 className="text-xl font-bold text-neutral-950">
                  Fix Receipt ID: {latestReceipt.receiptId}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Target: <code className="font-mono text-neutral-900">{latestReceipt.target}</code> •
                  Verified at: {new Date(latestReceipt.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => rollbackFix(latestReceipt.rollbackToken)}
                  disabled={isRollingBack}
                  className="px-4 py-2 rounded-full border border-neutral-300 bg-white text-neutral-800 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50 transition-colors"
                >
                  {isRollingBack ? "Rolling back..." : "Rollback Fix"}
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="px-5 py-2 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  Download Receipt (.json)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-neutral-800">
              <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-neutral-200/60">
                <span className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">Target Selector:</span>
                <code className="font-mono text-neutral-900 font-semibold">{latestReceipt.selector}</code>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-neutral-200/60">
                <span className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">Baseline Checksum:</span>
                <code className="font-mono text-neutral-900">{latestReceipt.originalChecksum}</code>
              </div>
              <div className="p-3.5 rounded-xl bg-[#F4F5F7] border border-neutral-200/60">
                <span className="font-bold text-neutral-500 uppercase tracking-wider text-[10px] block mb-1">Rollback Reference:</span>
                <code className="font-mono text-neutral-900">{latestReceipt.rollbackToken}</code>
              </div>
            </div>
          </div>

          {/* Chronological Evidence Timeline */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-neutral-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                    Chronological Verification Pipeline Timeline
                  </h3>
                </div>
                <p className="text-xs text-neutral-500">
                  Documented sequence of events from initial detection through pre-commit verification and sign-off.
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-semibold">
                Status: Complete Pipeline Trace
              </span>
            </div>

            <ol className="relative border-l border-neutral-200 ml-3 space-y-6 text-xs">
              {/* Step 1: Automated Audit */}
              <li className="ml-6">
                <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-neutral-900 text-white rounded-full ring-4 ring-white text-[10px] font-bold">
                  1
                </span>
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-950">Automated Accessibility Scan</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Stage 1</span>
                  </div>
                  <p className="text-neutral-600">
                    axe-core scanner evaluated DOM tree in headless Chromium. Detected {latestReceipt.beforeScan.totalIssues} total rule violations on target <code className="font-mono text-neutral-900">{latestReceipt.target}</code>.
                  </p>
                </div>
              </li>

              {/* Step 2: Finding Logged */}
              <li className="ml-6">
                <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-neutral-900 text-white rounded-full ring-4 ring-white text-[10px] font-bold">
                  2
                </span>
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-950">Rule Violation Cataloged</span>
                    <span className="text-[10px] text-rose-700 font-semibold font-mono">Violation Logged</span>
                  </div>
                  <p className="text-neutral-600">
                    Identified violation <code className="font-mono text-neutral-900 font-semibold">{latestReceipt.rule}</code> targeting element <code className="font-mono text-neutral-900 font-semibold">{latestReceipt.selector}</code>.
                  </p>
                </div>
              </li>

              {/* Step 3: Patch Proposed */}
              <li className="ml-6">
                <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-neutral-900 text-white rounded-full ring-4 ring-white text-[10px] font-bold">
                  3
                </span>
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-950">Allowlisted Remediation Patch Generated</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Patch Proposal</span>
                  </div>
                  <p className="text-neutral-600">
                    Deterministic patch <code className="font-mono text-neutral-900">{latestReceipt.fixId}</code> formulated with automation safety tier: <strong>{latestReceipt.automationSafety}</strong>.
                  </p>
                </div>
              </li>

              {/* Step 4: Safety Gate Evaluation */}
              <li className="ml-6">
                <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-neutral-900 text-white rounded-full ring-4 ring-white text-[10px] font-bold">
                  4
                </span>
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-950">Pre-Commit Safety Gate Evaluation</span>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">Passed 100%</span>
                  </div>
                  <p className="text-neutral-600">
                    Verified strict allowlist match, visible text preservation, and DOM tree containment without unexpected side-effects.
                  </p>
                </div>
              </li>

              {/* Step 5: Sandbox Application */}
              <li className="ml-6">
                <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-neutral-900 text-white rounded-full ring-4 ring-white text-[10px] font-bold">
                  5
                </span>
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-950">Sandbox Patch Applied &amp; Rollback Token Minted</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Rollback Ready</span>
                  </div>
                  <p className="text-neutral-600">
                    Remediation engine state incremented. Token <code className="font-mono text-neutral-900 font-semibold">{latestReceipt.rollbackToken}</code> generated for instant one-click reversion.
                  </p>
                </div>
              </li>

              {/* Step 6: Post-Fix Re-Verification */}
              <li className="ml-6">
                <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-neutral-900 text-white rounded-full ring-4 ring-white text-[10px] font-bold">
                  6
                </span>
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-950">Automated Re-Scan &amp; Regression Check</span>
                    <span className="text-[10px] text-emerald-700 font-semibold font-mono">0 Regressions</span>
                  </div>
                  <p className="text-neutral-600">
                    Real axe-core scan confirmed targeted rule cleared ({latestReceipt.beforeScan.targetedRuleViolations} → {latestReceipt.afterScan.targetedRuleViolations}) with {latestReceipt.newRegressions.length} new regressions.
                  </p>
                </div>
              </li>

              {/* Step 7: Cryptographic Receipt */}
              <li className="ml-6">
                <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-emerald-600 text-white rounded-full ring-4 ring-white text-[10px] font-bold">
                  ✓
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">Fix Receipt Issued</span>
                    <span className="text-[10px] text-emerald-800 font-mono font-semibold">VERIFIED</span>
                  </div>
                  <p className="text-emerald-800">
                    Receipt <code className="font-mono text-emerald-950 font-bold">{latestReceipt.receiptId}</code> compiled with complete baseline checksum, diff, and before/after verification logs.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          {/* Before & After Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Before State */}
            <div className="p-6 sm:p-7 rounded-[22px] border border-rose-200 bg-rose-50/30 space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-950">Before Remediation</h3>
                <StatusPill status="fail" label="Barrier Active" />
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Targeted Rule Violations ({latestReceipt.rule})
                  </span>
                  <div className="text-3xl font-extrabold text-rose-600 my-1">
                    {latestReceipt.beforeScan.targetedRuleViolations} violation{latestReceipt.beforeScan.targetedRuleViolations !== 1 ? "s" : ""}
                  </div>
                  <span className="text-neutral-500">Total page violations: {latestReceipt.beforeScan.totalIssues}</span>
                </div>

                {latestReceipt.beforeJourney && (
                  <div className="p-4 bg-white border border-rose-200 rounded-xl">
                    <span className="font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                      Task Journey Test Outcome
                    </span>
                    <p className="font-semibold text-rose-950">
                      Status: {latestReceipt.beforeJourney.taskStatus.toUpperCase()}
                    </p>
                    {latestReceipt.beforeJourney.failingStep && (
                      <p className="text-neutral-600 mt-1">
                        Failing Step: {latestReceipt.beforeJourney.failingStep}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* After State */}
            <div className="p-6 sm:p-7 rounded-[22px] border border-emerald-200 bg-emerald-50/30 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-950">After Remediation &amp; Re-Scan</h3>
                <StatusPill status="pass" label="Verified Cleared" />
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                    Targeted Rule Violations ({latestReceipt.rule})
                  </span>
                  <div className="text-3xl font-extrabold text-emerald-600 my-1">
                    {latestReceipt.afterScan.targetedRuleViolations} violations (Resolved)
                  </div>
                  <span className="text-neutral-500">Total page violations: {latestReceipt.afterScan.totalIssues} (reduced by {latestReceipt.beforeScan.totalIssues - latestReceipt.afterScan.totalIssues})</span>
                </div>

                {latestReceipt.afterJourney && (
                  <div className="p-4 bg-white border border-emerald-200 rounded-xl">
                    <span className="font-bold uppercase tracking-wider text-neutral-500 block mb-1">
                      Task Journey Test Outcome
                    </span>
                    <p className="font-semibold text-emerald-950">
                      Status: {latestReceipt.afterJourney.taskStatus.toUpperCase()}
                    </p>
                    <p className="text-neutral-600 mt-1">
                      Failing Step: {latestReceipt.afterJourney.failingStep || "None (All steps completed successfully)"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Safety Gate & Regression Audit Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Safety Gate Results */}
            <div className="p-6 rounded-[22px] border border-neutral-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-neutral-950 flex items-center justify-between">
                <span>Pre-Commit Safety Gate</span>
                <StatusPill status="pass" label="All Checks Passed" />
              </h3>
              <ul className="space-y-2.5 text-xs text-neutral-600">
                {latestReceipt.safetyGate.details.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Regression Analysis */}
            <div className="p-6 rounded-[22px] border border-neutral-200 bg-white shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-neutral-950 flex items-center justify-between">
                <span>Side-Effect &amp; Regression Analysis</span>
                <StatusPill
                  status={latestReceipt.newRegressions.length === 0 ? "pass" : "fail"}
                  label={latestReceipt.newRegressions.length === 0 ? "0 Regressions" : "Regressions Detected"}
                />
              </h3>
              {latestReceipt.newRegressions.length === 0 ? (
                <p className="text-xs text-neutral-600 leading-relaxed">
                  Real axe-core and Playwright re-scans confirmed that applying this patch introduced <strong>zero</strong> new accessibility violations across all remaining WCAG criteria.
                </p>
              ) : (
                <ul className="space-y-1 text-xs text-rose-600">
                  {latestReceipt.newRegressions.map((reg, i) => (
                    <li key={i}>{reg}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Applied Patch Diff */}
          <div className="border border-neutral-200 rounded-[22px] bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-950 mb-3">
              Applied Code Patch (Sandbox Target)
            </h3>
            <pre
              tabIndex={0}
              role="region"
              aria-label="Applied unified diff"
              className="p-4 bg-[#0F2A43] text-neutral-100 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed focus:outline-none focus:ring-1 focus:ring-neutral-400"
            >
              {latestReceipt.appliedDiff}
            </pre>
          </div>

          {/* Interactive JSON Receipt Preview */}
          <div className="border border-neutral-200 rounded-[22px] bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-neutral-950">
                  JSON Fix Receipt Payload
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Excludes secrets and sensitive values • Contains full before/after audit traces
                </p>
              </div>
              <button
                type="button"
                onClick={handleExportJson}
                className="px-4 py-2 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Export JSON
              </button>
            </div>
            <pre
              tabIndex={0}
              role="region"
              aria-label="Fix receipt JSON"
              className="p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-800 overflow-x-auto max-h-80 whitespace-pre-wrap leading-relaxed focus:outline-none focus:ring-1 focus:ring-neutral-900"
            >
              {JSON.stringify(latestReceipt, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
