"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuditStore } from "@/lib/audit-store";
import { StatusPill } from "@/components/ui/StatusPill";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";

export default function OverviewPage() {
  const { currentRun, isRunning, error, runAudit, fetchLatestRun } = useAuditStore();
  const [previewMode, setPreviewMode] = useState<"barriers" | "remediated">("barriers");

  useEffect(() => {
    fetchLatestRun();
  }, [fetchLatestRun]);

  const counts = currentRun?.issueCounts;
  const criticalAndHigh = (counts?.critical || 0) + (counts?.serious || 0);

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Loading & Error States */}
      {isRunning && <LoadingState message="Conducting real axe-core scan on the local demo page..." />}
      {error && !isRunning && <ErrorState message={error} onRetry={runAudit} />}

      {/* Main Two-Column Hero & Bento Layout */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Left Column: Bento Stats + Headline + Description */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          
          {/* Top Bento Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Bento Card 1: Multi-tier Tile */}
            <div className="bg-[#F0F9FF] p-2.5 rounded-[26px] flex flex-col gap-2 border border-[#BAE6FD] shadow-xs">
              {/* Upper Tile */}
              <div className="bg-[#0369A1] text-white p-4 rounded-[20px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold tracking-tight">axe-core</div>
                    <div className="text-[11px] text-sky-100 leading-tight">Automated rule checks</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Engine
                </span>
              </div>

              {/* Lower Tile */}
              <div className="bg-white text-[#0F2A43] p-3.5 px-4 rounded-[20px] flex items-center justify-between border border-[#BAE6FD]">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="w-5 h-5 rounded-full bg-[#0369A1] border border-white" />
                    <div className="w-5 h-5 rounded-full bg-sky-300 border border-white" />
                  </div>
                  <div>
                    <span className="font-bold text-sm">
                      {counts?.total ? `${counts.total} Barriers` : "Run scan for count"}
                    </span>
                    <span className="text-xs text-[#475569] block leading-tight">
                      Detected in target
                    </span>
                  </div>
                </div>
                <Link
                  href="/issues"
                  className="w-7 h-7 rounded-full bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center text-[#0369A1] hover:bg-[#0369A1] hover:text-white transition-colors shadow-xs"
                  aria-label="View issues"
                >
                  →
                </Link>
              </div>
            </div>

            {/* Bento Card 2: Interactive Demo Target */}
            <div className="bg-[#F0F9FF] p-4 rounded-[26px] border border-[#BAE6FD] flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#BAE6FD] text-[11px] font-semibold text-[#0369A1]">
                  Live Target
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="my-3">
                <h2 className="text-base font-bold text-[#0F2A43] leading-tight">
                  Scholarship Demo
                </h2>
                <p className="text-xs text-[#475569] mt-1 leading-snug">
                  Controlled portal with active keyboard traps &amp; contrast barriers
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#BAE6FD]/70">
                <span className="text-[11px] font-medium text-[#475569]">
                  Interactive route ready
                </span>
                <Link
                  href="/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#0369A1] text-white flex items-center justify-center hover:bg-[#0284C7] transition-colors shadow-xs"
                  aria-label="Open scholarship demo in new tab"
                >
                  <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>

          {/* Large Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-[46px] font-bold tracking-tight text-[#0F2A43] leading-[1.12] break-words">
              Find the barriers that stop real people finishing a task, fix them with your approval, and prove it worked.
            </h1>

            <p className="text-sm sm:text-base text-[#475569] leading-relaxed max-w-2xl font-normal">
              A practical approach to accessibility: pair automated axe-core rule evaluation with keyboard journey testing, distinguish true task blockers from visual barriers, and produce verifiable, reversible code patches with human sign-off.
            </p>
          </div>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={runAudit}
              disabled={isRunning}
              className="px-6 py-3 rounded-full bg-[#0369A1] text-white text-xs sm:text-sm font-semibold hover:bg-[#0284C7] transition-all shadow-sm flex items-center gap-2.5 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Scanning Demo Target...</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Run Real axe-core Scan</span>
                </>
              )}
            </button>

            <Link
              href="/issues"
              className="px-6 py-3 rounded-full bg-white border border-[#BAE6FD] text-[#0369A1] text-xs sm:text-sm font-semibold hover:bg-[#F0F9FF] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span>Explore All Issues</span>
              <span>→</span>
            </Link>
          </div>

        </div>

        {/* Right Column: Visual Product Preview & Real Run Hero Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="w-full h-full min-h-[460px] rounded-[30px] bg-[#F0F9FF] border border-[#BAE6FD] p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-xs">
            
            {/* Top Visual Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0F2A43]">
                  Latest Real Run Evidence
                </span>
                {currentRun && (
                  <span className="text-[10px] bg-white border border-[#BAE6FD] px-2 py-0.5 rounded-full font-semibold text-[#0369A1]">
                    {currentRun.engine === "full" ? "Full Browser" : "Lightweight Scan"}
                  </span>
                )}
              </div>
              <Link
                href="/focus-map"
                className="text-xs font-semibold text-[#0369A1] hover:underline flex items-center gap-1"
              >
                <span>Full Map</span>
                <span>↗</span>
              </Link>
            </div>

            {/* Interactive Graphic: Focus Traversal Map Representation from Real Run */}
            <div className="my-6 relative flex-1 flex flex-col items-center justify-center p-4">
              {currentRun && currentRun.issues && currentRun.issues.length > 0 ? (
                <div className="w-full max-w-sm space-y-3 text-xs">
                  {currentRun.issues.slice(0, 3).map((issue, idx) => (
                    <div
                      key={issue.id}
                      className="p-3 rounded-xl border bg-white border-[#BAE6FD] text-[#0F2A43] shadow-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 font-bold truncate">
                          <span className="w-5 h-5 rounded-full bg-[#0369A1] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
                            {idx + 1}
                          </span>
                          <code className="text-[11px] truncate">{issue.affectedElements[0]?.selectors[0] || issue.rule}</code>
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                          issue.severity === "critical"
                            ? "bg-rose-50 text-rose-800 border-rose-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}>
                          {issue.rule}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#475569] mt-1 line-clamp-1">{issue.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-white/80 rounded-2xl border border-[#BAE6FD] max-w-xs space-y-2">
                  <div className="w-8 h-8 mx-auto rounded-full bg-[#F0F9FF] text-[#0369A1] flex items-center justify-center text-sm font-bold border border-[#BAE6FD]">
                    ◈
                  </div>
                  <p className="text-xs font-bold text-[#0F2A43]">No Scan Run Yet</p>
                  <p className="text-[11px] text-[#475569] leading-snug">
                    Click &quot;Run Real axe-core Scan&quot; to inspect real stops and barriers from /demo.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Overlay Card */}
            <div className="bg-[#0F2A43] text-white p-4 rounded-[22px] flex items-center justify-between shadow-md relative z-10">
              <div>
                <p className="text-xs font-bold leading-tight tracking-tight">
                  Approval-Based Remediation
                </p>
                <p className="text-[11px] text-sky-200 leading-tight">
                  Inspect diffs before applying
                </p>
              </div>

              <Link
                href="/fix-review"
                className="flex items-center gap-2 bg-[#0369A1] hover:bg-[#0284C7] px-3.5 py-1.5 rounded-full transition-colors text-xs font-semibold text-white shadow-xs"
              >
                <span>Fix Review</span>
                <span>→</span>
              </Link>
            </div>

          </div>
        </div>

      </section>

      {/* Category Pills Bar */}
      <section className="flex flex-wrap items-center gap-2.5 pt-2" aria-label="Feature shortcuts">
        <Link
          href="/audits"
          className="px-4 py-2 rounded-full bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#0F2A43] text-xs font-semibold transition-colors flex items-center gap-2 border border-[#BAE6FD]"
        >
          <span>⊞</span>
          <span>axe-core Scanner</span>
        </Link>

        <Link
          href="/journeys"
          className="px-4 py-2 rounded-full bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#0F2A43] text-xs font-semibold transition-colors flex items-center gap-2 border border-[#BAE6FD]"
        >
          <span>⇄</span>
          <span>Journey Testing</span>
        </Link>

        <Link
          href="/focus-map"
          className="px-4 py-2 rounded-full bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#0F2A43] text-xs font-semibold transition-colors flex items-center gap-2 border border-[#BAE6FD]"
        >
          <span>◈</span>
          <span>Visual Tab-Order Map</span>
        </Link>

        <Link
          href="/fix-review"
          className="px-4 py-2 rounded-full bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#0F2A43] text-xs font-semibold transition-colors flex items-center gap-2 border border-[#BAE6FD]"
        >
          <span>☵</span>
          <span>Safe Remediation</span>
        </Link>

        <Link
          href="/verification"
          className="px-4 py-2 rounded-full bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-[#0F2A43] text-xs font-semibold transition-colors flex items-center gap-2 border border-[#BAE6FD]"
        >
          <span>⬡</span>
          <span>Fix Receipts</span>
        </Link>
      </section>

      {/* Live Metrics Grid with Accent Strips & Icons */}
      <section className="space-y-4 pt-4" aria-label="Live System Metrics">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-[#0F2A43]">
            System Intelligence
          </h2>
          <span className="text-xs text-[#475569] font-medium">
            Live Target: <code className="text-[#0F2A43] font-mono">/demo</code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Issues */}
          <div className="p-6 rounded-[22px] bg-white border border-[#BAE6FD] border-l-4 border-l-[#0369A1] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                Total Issues Detected
              </span>
              <span className="text-sm text-[#0369A1]">●</span>
            </div>
            <div className="my-3">
              <span className="text-4xl font-extrabold text-[#0F2A43] tracking-tight">
                {counts ? counts.total : "—"}
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              {counts ? "Measured by automated rule evaluation" : "Click 'Run Real axe-core Scan'"}
            </p>
          </div>

          {/* Card 2: Critical & High */}
          <div className="p-6 rounded-[22px] bg-white border border-[#BAE6FD] border-l-4 border-l-rose-500 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                Critical &amp; High Barriers
              </span>
              <span className="text-sm text-rose-500">▲</span>
            </div>
            <div className="my-3">
              <span className="text-4xl font-extrabold text-rose-600 tracking-tight">
                {counts ? criticalAndHigh : "—"}
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              {counts ? `${counts.critical} critical, ${counts.serious} serious` : "Awaiting scan"}
            </p>
          </div>

          {/* Card 3: Safe Remediation Patches */}
          <div className="p-6 rounded-[22px] bg-white border border-[#BAE6FD] border-l-4 border-l-emerald-500 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                Supported Code Patches
              </span>
              <span className="text-sm text-emerald-600">✓</span>
            </div>
            <div className="my-3">
              <span className="text-4xl font-extrabold text-[#0F2A43] tracking-tight">
                3 Supported
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              Pre-computed allowlisted diffs with safety gates
            </p>
          </div>

          {/* Card 4: Verification Scope */}
          <div className="p-6 rounded-[22px] bg-white border border-[#BAE6FD] border-l-4 border-l-sky-400 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#475569]">
                Verification Scope
              </span>
              <span className="text-sm text-sky-500">◈</span>
            </div>
            <div className="my-3">
              <span className="text-2xl font-extrabold text-[#0F2A43] tracking-tight">
                Tested Journeys
              </span>
            </div>
            <p className="text-xs text-[#475569]">
              Automated checks do not guarantee WCAG compliance
            </p>
          </div>

        </div>
      </section>

      {/* Continuous Accessibility Workflow Pipeline */}
      <section className="p-7 rounded-[26px] bg-[#F0F9FF] border border-[#BAE6FD] space-y-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#0369A1]">
            Pipeline Architecture
          </span>
          <h2 className="text-lg font-bold text-[#0F2A43] mt-1">
            Approval-Based Remediation Lifecycle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-white border border-[#BAE6FD]">
            <div className="font-bold text-[#0F2A43] mb-1">1. DETECT</div>
            <p className="text-[#475569] leading-relaxed text-[11px]">
              Headless Chromium executes axe-core and monitors keyboard focus traps.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#BAE6FD]">
            <div className="font-bold text-[#0F2A43] mb-1">2. PRIORITIZE</div>
            <p className="text-[#475569] leading-relaxed text-[11px]">
              Distinguish true task blockers from cosmetic violations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#BAE6FD]">
            <div className="font-bold text-[#0F2A43] mb-1">3. REMEDIATE</div>
            <p className="text-[#475569] leading-relaxed text-[11px]">
              Generate precise AST-level patches targeting only verified broken attributes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#BAE6FD]">
            <div className="font-bold text-[#0F2A43] mb-1">4. VERIFY</div>
            <p className="text-[#475569] leading-relaxed text-[11px]">
              Re-run journey tests to verify issues are resolved without regressions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#BAE6FD]">
            <div className="font-bold text-[#0F2A43] mb-1">5. MONITOR</div>
            <p className="text-[#475569] leading-relaxed text-[11px]">
              Continuous CI/CD gatekeeper blocking inaccessible deployments.
            </p>
          </div>
        </div>
      </section>

      {/* Latest Scan Findings / Quick Review */}
      {currentRun && currentRun.issues && currentRun.issues.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-950">
              Verified Issues in Target ({currentRun.issues.length})
            </h2>
            <Link
              href="/issues"
              className="text-xs font-semibold text-neutral-900 hover:underline"
            >
              Open Issue Explorer →
            </Link>
          </div>

          <div className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white overflow-hidden">
            {currentRun.issues.slice(0, 4).map((issue) => (
              <div key={issue.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-neutral-50/60 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <span className="text-xs font-mono font-medium text-neutral-600">
                      {issue.rule}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {issue.description}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Target: {issue.affectedElements[0]?.selectors.join(", ") || "DOM Node"}
                  </p>
                </div>
                <Link
                  href="/fix-review"
                  className="px-4 py-1.5 rounded-full border border-[#BAE6FD] bg-[#F0F9FF] hover:bg-[#BAE6FD]/40 text-xs font-semibold text-[#0369A1] transition-colors shrink-0 text-center"
                >
                  Inspect Patch
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
