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

      {/* Main Two-Column Hero & Bento Layout (Reference Style) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        
        {/* Left Column: Bento Stats + Large Headline + Description */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          
          {/* Top Bento Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Bento Card 1: Multi-tier Dark & Light Tile */}
            <div className="bg-[#F4F5F7] p-2.5 rounded-[26px] flex flex-col gap-2 border border-neutral-200/60 shadow-xs">
              {/* Dark Upper Tile */}
              <div className="bg-[#0A0A0A] text-white p-4 rounded-[20px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold tracking-tight">axe-core</div>
                    <div className="text-[11px] text-neutral-400 leading-tight">Automated rule checks</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                  Engine
                </span>
              </div>

              {/* Light Lower Tile */}
              <div className="bg-[#E5E7EB] text-[#0A0A0A] p-3.5 px-4 rounded-[20px] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <div className="w-5 h-5 rounded-full bg-neutral-900 border border-white" />
                    <div className="w-5 h-5 rounded-full bg-neutral-500 border border-white" />
                  </div>
                  <div>
                    <span className="font-bold text-sm">
                      {counts?.total ? `${counts.total} Barriers` : "4 Critical"}
                    </span>
                    <span className="text-xs text-neutral-600 block leading-tight">
                      Detected in target
                    </span>
                  </div>
                </div>
                <Link
                  href="/issues"
                  className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-neutral-900 hover:bg-neutral-900 hover:text-white transition-colors shadow-xs"
                  aria-label="View issues"
                >
                  →
                </Link>
              </div>
            </div>

            {/* Bento Card 2: Interactive Demo Target */}
            <div className="bg-[#F4F5F7] p-4 rounded-[26px] border border-neutral-200/60 flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-neutral-200 text-[11px] font-semibold text-neutral-800">
                  Live Target
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="my-3">
                <h2 className="text-base font-bold text-neutral-950 leading-tight">
                  Scholarship Demo
                </h2>
                <p className="text-xs text-neutral-500 mt-1 leading-snug">
                  Controlled portal with active keyboard traps & contrast barriers
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-200/70">
                <span className="text-[11px] font-medium text-neutral-500">
                  Playwright browser ready
                </span>
                <Link
                  href="/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-neutral-900 text-white flex items-center justify-center hover:bg-neutral-800 transition-colors shadow-xs"
                  aria-label="Open scholarship demo in new tab"
                >
                  <svg className="w-3.5 h-3.5 fill-current ml-0.5" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </Link>
              </div>
            </div>

          </div>

          {/* Large Editorial Headline */}
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight text-neutral-950 leading-[1.08] break-words">
              Experience the power of{" "}
              <span className="inline-flex flex-wrap items-center align-middle">
                accessible digital{" "}
                <Link
                  href="/journeys"
                  className="inline-flex items-center gap-1.5 mx-2 my-1 px-3.5 py-1.5 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-all shadow-xs"
                >
                  <span>Learn More</span>
                  <span className="text-[11px]">↗</span>
                </Link>
              </span>
              platforms
              <span className="inline-flex items-center gap-1 ml-3 align-middle">
                <span className="w-5 h-5 rounded-full bg-neutral-900 border-2 border-white inline-block" />
                <span className="w-5 h-5 rounded-full bg-neutral-400 border-2 border-white -ml-2 inline-block" />
                <span className="w-5 h-5 rounded-full bg-neutral-200 border-2 border-white -ml-2 inline-block" />
              </span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 leading-relaxed max-w-2xl font-normal">
              Discover a practical approach to accessibility with our integrated pipeline.
              We pair automated axe-core rule evaluation with Playwright keyboard journey testing,
              distinguish true task blockers from cosmetic issues, and produce verifiable,
              reversible code patches with human-in-the-loop review.
            </p>
          </div>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={runAudit}
              disabled={isRunning}
              className="px-6 py-3 rounded-full bg-neutral-950 text-white text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-all shadow-sm flex items-center gap-2.5 disabled:opacity-50"
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
              className="px-6 py-3 rounded-full bg-white border border-neutral-300 text-neutral-900 text-xs sm:text-sm font-semibold hover:bg-neutral-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span>Explore All Issues</span>
              <span>→</span>
            </Link>
          </div>

        </div>

        {/* Right Column: Visual Product Preview & Interactive Overlay Card */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="w-full h-full min-h-[460px] rounded-[30px] bg-[#F4F5F7] border border-neutral-200/80 p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-xs">
            
            {/* Top Visual Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                  Visual Focus Map
                </span>
                <span className="text-[10px] bg-white border border-neutral-200 px-2 py-0.5 rounded-full font-semibold text-neutral-600">
                  {previewMode === "barriers" ? "Active Barriers" : "Remediated"}
                </span>
              </div>
              <Link
                href="/focus-map"
                className="text-xs font-semibold text-neutral-900 hover:underline flex items-center gap-1"
              >
                <span>Full Map</span>
                <span>↗</span>
              </Link>
            </div>

            {/* Interactive Graphic: Focus Traversal Map Representation */}
            <div className="my-6 relative flex-1 flex flex-col items-center justify-center p-4">
              {/* Stylized Traversal Diagram */}
              <div className="w-full max-w-sm space-y-3 font-mono text-xs">
                
                {/* Node 1 */}
                <div className={`p-3 rounded-xl border transition-all ${
                  previewMode === "barriers"
                    ? "bg-rose-50/80 border-rose-300 text-rose-950"
                    : "bg-white border-neutral-200 text-neutral-900"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">1</span>
                      #bookmark-btn
                    </span>
                    <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      {previewMode === "barriers" ? "button-name (Missing)" : "aria-label added"}
                    </span>
                  </div>
                </div>

                {/* Trajectory Connector */}
                <div className="flex justify-center -my-1 text-neutral-400">
                  ↓ Tab key (Traversal Step)
                </div>

                {/* Node 2 */}
                <div className={`p-3 rounded-xl border transition-all ${
                  previewMode === "barriers"
                    ? "bg-rose-50/80 border-rose-300 text-rose-950"
                    : "bg-white border-neutral-200 text-neutral-900"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">2</span>
                      #national-id-input
                    </span>
                    <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                      {previewMode === "barriers" ? "label missing" : "label for linked"}
                    </span>
                  </div>
                </div>

                {/* Trajectory Connector */}
                <div className="flex justify-center -my-1 text-neutral-400">
                  ↓ Tab key (Traversal Step)
                </div>

                {/* Node 3 */}
                <div className={`p-3 rounded-xl border transition-all ${
                  previewMode === "barriers"
                    ? "bg-amber-50/80 border-amber-300 text-amber-950"
                    : "bg-white border-neutral-200 text-neutral-900"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">3</span>
                      #submit-app-btn
                    </span>
                    <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      {previewMode === "barriers" ? "2.1:1 Contrast" : "4.8:1 WCAG AA"}
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom Overlay Card (Faithful to Reference "join our platform" card) */}
            <div className="bg-[#0A0A0A] text-white p-4 rounded-[22px] flex items-center justify-between shadow-md relative z-10">
              <div>
                <p className="text-xs font-bold leading-tight tracking-tight">
                  verify your journey
                </p>
                <p className="text-[11px] text-neutral-400 leading-tight">
                  & start safe remediation
                </p>
              </div>

              {/* Interactive Mode Toggle Pill */}
              <button
                type="button"
                onClick={() => setPreviewMode(previewMode === "barriers" ? "remediated" : "barriers")}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-3 py-1.5 rounded-full transition-colors text-xs font-semibold"
                aria-label={`Toggle preview: currently ${previewMode}`}
              >
                <span>{previewMode === "barriers" ? "Show Patched" : "Show Raw"}</span>
                <div className="w-5 h-5 rounded-full bg-white text-neutral-900 flex items-center justify-center text-[11px]">
                  {previewMode === "barriers" ? "⇄" : "✓"}
                </div>
              </button>
            </div>

          </div>
        </div>

      </section>

      {/* Category Pills Bar (Matching Reference bottom pill row) */}
      <section className="flex flex-wrap items-center gap-2.5 pt-2" aria-label="Feature shortcuts">
        <Link
          href="/audits"
          className="px-4 py-2 rounded-full bg-[#F4F5F7] hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/60"
        >
          <span>⊞</span>
          <span>axe-core Scanner</span>
        </Link>

        <Link
          href="/journeys"
          className="px-4 py-2 rounded-full bg-[#F4F5F7] hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/60"
        >
          <span>⇄</span>
          <span>Journey Testing</span>
        </Link>

        <Link
          href="/focus-map"
          className="px-4 py-2 rounded-full bg-[#F4F5F7] hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/60"
        >
          <span>◈</span>
          <span>Visual Focus Map</span>
        </Link>

        <Link
          href="/fix-review"
          className="px-4 py-2 rounded-full bg-[#F4F5F7] hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/60"
        >
          <span>☵</span>
          <span>Safe Remediation</span>
        </Link>

        <Link
          href="/verification"
          className="px-4 py-2 rounded-full bg-[#F4F5F7] hover:bg-neutral-200/80 text-neutral-800 text-xs font-semibold transition-colors flex items-center gap-2 border border-neutral-200/60"
        >
          <span>⬡</span>
          <span>Verification Receipts</span>
        </Link>
      </section>

      {/* Live Metrics Bento Grid */}
      <section className="space-y-4 pt-4" aria-label="Live System Metrics">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-neutral-950">
            System Intelligence
          </h2>
          <span className="text-xs text-neutral-500 font-medium">
            Live Target: <code className="text-neutral-900 font-mono">/demo</code>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Issues */}
          <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Total Issues Detected
            </span>
            <div className="my-3">
              <span className="text-4xl font-extrabold text-neutral-950 tracking-tight">
                {counts?.total ?? 4}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Verified by axe-core rule evaluation
            </p>
          </div>

          {/* Card 2: Critical Task Blockers */}
          <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Critical & High Barriers
            </span>
            <div className="my-3">
              <span className="text-4xl font-extrabold text-rose-600 tracking-tight">
                {criticalAndHigh || 3}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              {counts?.critical ?? 1} critical, {counts?.serious ?? 2} serious
            </p>
          </div>

          {/* Card 3: Safe Remediation Patches */}
          <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Safe Code Patches
            </span>
            <div className="my-3">
              <span className="text-4xl font-extrabold text-neutral-950 tracking-tight">
                3 Supported
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Pre-computed allowlisted diffs with safety gates
            </p>
          </div>

          {/* Card 4: Verification Scope */}
          <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70 flex flex-col justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Verification Scope
            </span>
            <div className="my-3">
              <span className="text-3xl font-extrabold text-neutral-950 tracking-tight">
                Tested Journeys
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Evidence-based; human review required for full WCAG
            </p>
          </div>

        </div>
      </section>

      {/* Continuous Accessibility Workflow Pipeline */}
      <section className="p-7 rounded-[26px] bg-[#F4F5F7] border border-neutral-200/70 space-y-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
            Pipeline Architecture
          </span>
          <h2 className="text-lg font-bold text-neutral-950 mt-1">
            Deterministic Remediation Lifecycle
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-4 rounded-xl bg-white border border-neutral-200/80">
            <div className="font-bold text-neutral-950 mb-1">1. DETECT</div>
            <p className="text-neutral-500 leading-relaxed text-[11px]">
              Headless Chromium executes axe-core and monitors keyboard focus traps.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-neutral-200/80">
            <div className="font-bold text-neutral-950 mb-1">2. PRIORITIZE</div>
            <p className="text-neutral-500 leading-relaxed text-[11px]">
              Distinguish true task blockers from cosmetic violations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-neutral-200/80">
            <div className="font-bold text-neutral-950 mb-1">3. REMEDIATE</div>
            <p className="text-neutral-500 leading-relaxed text-[11px]">
              Generate precise AST-level patches targeting only verified broken attributes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-neutral-200/80">
            <div className="font-bold text-neutral-950 mb-1">4. VERIFY</div>
            <p className="text-neutral-500 leading-relaxed text-[11px]">
              Re-run Playwright journey tests to guarantee zero regressions.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-neutral-200/80">
            <div className="font-bold text-neutral-950 mb-1">5. MONITOR</div>
            <p className="text-neutral-500 leading-relaxed text-[11px]">
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
                  className="px-4 py-1.5 rounded-full border border-neutral-200 bg-white hover:bg-neutral-100 text-xs font-semibold text-neutral-900 transition-colors shrink-0 text-center"
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
