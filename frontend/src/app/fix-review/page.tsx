"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRemediationStore } from "@/lib/remediation-store";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { StopBadge } from "@/components/ui/StopBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import type { FixProposal } from "@/types";

export default function FixReviewPage() {
  const {
    proposals,
    activePatches,
    version,
    originalChecksum,
    latestReceipt,
    isApplying,
    applyingFixId,
    isRollingBack,
    error,
    successMessage,
    fetchRemediationData,
    applyFix,
    rollbackFix,
    resetAll,
    clearNotifications,
  } = useRemediationStore();

  const [confirmFixId, setConfirmFixId] = useState<string | null>(null);

  useEffect(() => {
    fetchRemediationData();
  }, [fetchRemediationData]);

  const handleApprove = async (fixId: string) => {
    setConfirmFixId(null);
    await applyFix(fixId);
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
          <span className="text-neutral-950 font-bold bg-white px-2.5 py-1 rounded-full shadow-xs border border-neutral-200">
            3. Fix Review (Active)
          </span>
          <span className="text-neutral-300">→</span>
          <Link href="/verification" className="hover:text-neutral-900 transition-colors">4. Verify &amp; Receipt</Link>
        </div>
        <Link href="/demo" className="text-neutral-950 hover:underline shrink-0 text-[11px]">
          Target: /demo ↗
        </Link>
      </div>

      <PageHeader
        eyebrow="SAFE REMEDIATION ENGINE"
        title="Fix Review"
        description="Inspect allowlisted remediation patches, review safety classifications, and approve verified fixes against the controlled demo target."
        action={
          <div className="flex items-center gap-2.5">
            {activePatches.length > 0 && (
              <button
                type="button"
                onClick={() => rollbackFix()}
                disabled={isRollingBack || isApplying}
                className="px-4 py-2 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold disabled:opacity-50 transition-colors shadow-xs"
              >
                {isRollingBack ? "Rolling back..." : "Rollback Latest"}
              </button>
            )}
            <button
              type="button"
              onClick={() => resetAll()}
              disabled={isRollingBack || isApplying}
              className="px-4 py-2 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              Reset Demo to Baseline
            </button>
          </div>
        }
      />

      {/* Notifications */}
      {error && (
        <ErrorState
          title="Remediation Operation Failed"
          message={error}
          retryLabel="Dismiss & Retry"
          onRetry={clearNotifications}
        />
      )}

      {successMessage && (
        <div className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">✓</span>
            <span className="font-semibold">{successMessage}</span>
          </div>
          <Link
            href="/verification"
            className="px-4 py-1.5 bg-neutral-950 text-white rounded-full font-semibold text-xs hover:bg-neutral-800 transition-colors shrink-0 text-center shadow-xs"
          >
            View Verification Receipt →
          </Link>
        </div>
      )}

      {/* Sandbox & Versioned State Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Patch Version</span>
          <span className="text-3xl font-extrabold text-neutral-950 my-1 block">v{version}</span>
          <span className="text-xs text-neutral-400 block">Incremental state tracking</span>
        </div>

        <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Original Checksum</span>
          <code className="text-sm font-mono font-bold text-neutral-900 block truncate mt-2">
            {originalChecksum || "sha256_e7d41f0a"}
          </code>
          <span className="text-xs text-neutral-400 block mt-1">Baseline SHA-256 hash</span>
        </div>

        <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Applied Patches</span>
          <span className="text-3xl font-extrabold text-neutral-950 my-1 block">{activePatches.length} / {proposals.length}</span>
          <span className="text-xs text-neutral-400 block truncate">
            {activePatches.length > 0 ? activePatches.join(", ") : "Pristine baseline"}
          </span>
        </div>

        <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
          <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Verification Receipts</span>
          <span className="text-3xl font-extrabold text-neutral-950 my-1 block">
            {latestReceipt ? "1 Available" : "None"}
          </span>
          <span className="text-xs text-neutral-400 block">
            {latestReceipt ? `Status: ${latestReceipt.finalStatus}` : "Awaiting fix approval"}
          </span>
        </div>
      </div>

      {isApplying && (
        <LoadingState message={`Applying patch '${applyingFixId}', evaluating safety gate, and running verification scans...`} />
      )}

      {/* Fix Proposals List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
            Supported Remediation Patches ({proposals.length})
          </h2>
          <span className="text-xs text-neutral-500 font-medium">
            Automated approval disabled • Explicit human review required
          </span>
        </div>

        {proposals.map((fix, idx) => {
          const isApplied = activePatches.includes(fix.id);
          const isConfirming = confirmFixId === fix.id;

          return (
            <div
              key={fix.id}
              className={`p-6 sm:p-8 rounded-[24px] border bg-white space-y-5 transition-all shadow-xs ${
                isApplied
                  ? "border-emerald-300 ring-1 ring-emerald-200"
                  : "border-neutral-200"
              }`}
            >
              {/* Proposal Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <StopBadge number={idx + 1} />
                  <code className="text-xs font-mono font-bold bg-neutral-100 border border-neutral-200 px-3 py-1 rounded-full text-neutral-900">
                    {fix.ruleId}
                  </code>
                  <code className="text-xs font-mono font-semibold text-neutral-800 bg-neutral-50 px-2.5 py-1 rounded-full border border-neutral-200">
                    {fix.selector}
                  </code>
                </div>

                <div className="flex items-center gap-2.5">
                  <span
                    className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                      fix.automationSafety === "safe to auto-apply"
                        ? "bg-emerald-50 text-emerald-950 border-emerald-200"
                        : "bg-amber-50 text-amber-950 border-amber-200"
                    }`}
                  >
                    {fix.automationSafety}
                  </span>

                  {isApplied ? (
                    <StatusPill status="pass" label="Applied & Verified" />
                  ) : (
                    <StatusPill status="unavailable" label="Proposed" />
                  )}
                </div>
              </div>

              {/* Description & Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                    Problem &amp; Fix Description
                  </span>
                  <p className="text-neutral-900 text-sm leading-relaxed">
                    {fix.description}
                  </p>
                  <p className="text-neutral-500 mt-2">
                    <span className="font-semibold text-neutral-700">Evidence source: </span>
                    {fix.evidenceSource}
                  </p>
                </div>

                <div>
                  <span className="font-bold uppercase tracking-wider text-neutral-500 block mb-1.5">
                    Expected Outcome
                  </span>
                  <p className="text-neutral-900 text-sm leading-relaxed bg-[#F4F5F7] p-3.5 rounded-xl border border-neutral-200">
                    {fix.expectedOutcome}
                  </p>
                  {fix.contrastBefore && fix.contrastAfter && (
                    <div className="mt-2 text-xs text-neutral-800 flex items-center gap-3">
                      <span>Baseline Contrast: <strong className="text-rose-600">{fix.contrastBefore}:1</strong></span>
                      <span>&rarr;</span>
                      <span>Patched Contrast: <strong className="text-emerald-700">{fix.contrastAfter}:1</strong> (WCAG AA &ge; {fix.wcagThreshold}:1)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Code Diff Display */}
              <div>
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-500 block mb-2">
                  Proposed Patch Diff (Allowlisted Template)
                </span>
                <pre className="p-4 bg-neutral-950 text-neutral-100 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {fix.diff}
                </pre>
              </div>

              {/* Approval & Cancellation Controls */}
              <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-neutral-500">
                  {isApplied ? (
                    <span>
                      Active in version <strong className="text-neutral-950">v{version}</strong>. Rollback token verified.
                    </span>
                  ) : (
                    <span>
                      Review safety considerations before approving. Fix will be tested immediately.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isApplied ? (
                    !isConfirming ? (
                      <button
                        type="button"
                        onClick={() => setConfirmFixId(fix.id)}
                        disabled={isApplying}
                        className="px-5 py-2.5 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        Review &amp; Approve Patch
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-neutral-100 border border-neutral-200 p-1.5 rounded-full">
                        <span className="text-xs font-semibold text-neutral-900 px-3">
                          Confirm apply to sandbox?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleApprove(fix.id)}
                          disabled={isApplying}
                          className="px-4 py-1.5 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmFixId(null)}
                          className="px-3 py-1.5 rounded-full bg-white text-neutral-700 border border-neutral-200 text-xs hover:bg-neutral-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )
                  ) : (
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => rollbackFix(fix.rollbackToken)}
                        disabled={isRollingBack}
                        className="px-4 py-2 rounded-full border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold transition-colors"
                      >
                        Rollback This Patch
                      </button>
                      <Link
                        href="/verification"
                        className="px-4 py-2 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                      >
                        Verification Receipt &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
