"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuditStore } from "@/lib/audit-store";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { StopBadge } from "@/components/ui/StopBadge";
import { AiBadge } from "@/components/ui/AiBadge";

export default function AuditsPage() {
  const { currentRun, isRunning, error, runAudit, fetchLatestRun, publicScanEnabled } = useAuditStore();
  const [selectedTarget, setSelectedTarget] = useState("/demo");
  const [publicUrlInput, setPublicUrlInput] = useState("");

  // AI Assist State (Off by default)
  const [isAiConfigured, setIsAiConfigured] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [summaryBullets, setSummaryBullets] = useState<string[] | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [expandedAiExplanations, setExpandedAiExplanations] = useState<Record<string, string>>({});
  const [loadingAiIssueId, setLoadingAiIssueId] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestRun();
    // Query internal endpoint to check if AI is configured
    fetch("/api/ai/suggest")
      .then((res) => res.json())
      .then((data) => {
        setIsAiConfigured(Boolean(data?.configured));
      })
      .catch(() => {
        setIsAiConfigured(false);
      });
  }, [fetchLatestRun]);

  const handleStartAudit = () => {
    if (selectedTarget === "public") {
      runAudit(publicUrlInput);
    } else {
      runAudit();
    }
  };

  const handleGenerateSummary = async () => {
    if (!currentRun || !aiEnabled) return;
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "summarize",
          summary: {
            total: currentRun.issueCounts.total,
            critical: currentRun.issueCounts.critical,
            serious: currentRun.issueCounts.serious,
            moderate: currentRun.issueCounts.moderate,
            minor: currentRun.issueCounts.minor,
            passedRules: currentRun.passesCount ?? 0,
          },
        }),
      });
      const data = await res.json();
      if (data.available && data.data?.bullets) {
        setSummaryBullets(data.data.bullets);
      } else {
        setSummaryError(data.reason || "Failed to generate AI summary");
      }
    } catch {
      setSummaryError("Failed to contact AI service");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleExplainIssue = async (issueId: string, rule: string, severity: string, snippet?: string, helpText?: string) => {
    if (!aiEnabled) return;
    setLoadingAiIssueId(issueId);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "explain",
          rule,
          severity,
          snippet: snippet || "",
          helpText: helpText || "",
        }),
      });
      const data = await res.json();
      if (data.available && data.data?.explanation) {
        setExpandedAiExplanations((prev) => ({
          ...prev,
          [issueId]: data.data.explanation,
        }));
      }
    } catch {
      // Graceful fallback: do not alert or crash
    } finally {
      setLoadingAiIssueId(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AUTOMATED EVALUATION"
        title="Accessibility Audits"
        description="Configure target URLs and execute automated WCAG audits powered by axe-core and Chromium."
      />

      {/* Target Selector Card */}
      <div className="p-6 sm:p-8 rounded-[24px] bg-[#F4F5F7] border border-neutral-200/80">
        <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 mb-4">
          Scan Target Selection
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 max-w-2xl">
          <div className="flex-1">
            <label htmlFor="target-select" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Select Verified Target
            </label>
            <select
              id="target-select"
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              disabled={isRunning}
              className="w-full px-4 py-2.5 rounded-full border border-neutral-300 bg-white text-sm text-neutral-900 font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
            >
              <option value="/demo">
                Local Scholarship Application (/demo) — controlled test target
              </option>
              <option value="public" disabled={!publicScanEnabled}>
                Public page (read-only){!publicScanEnabled ? " — (Disabled)" : ""}
              </option>
            </select>
            {!publicScanEnabled && (
              <p className="text-xs text-neutral-500 font-medium mt-2">
                Public page scanning is not enabled
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartAudit}
            disabled={isRunning || (selectedTarget === "public" && !publicUrlInput.trim())}
            className="px-6 py-2.5 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 shadow-xs flex items-center justify-center gap-2"
          >
            {isRunning ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Scanning...</span>
              </>
            ) : (
              <span>Start Audit</span>
            )}
          </button>
        </div>

        {selectedTarget === "public" && publicScanEnabled && (
          <div className="mt-4 max-w-2xl">
            <label htmlFor="public-url-input" className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
              Target Public HTTPS URL
            </label>
            <input
              id="public-url-input"
              type="url"
              placeholder="https://example.com/page"
              value={publicUrlInput}
              onChange={(e) => setPublicUrlInput(e.target.value)}
              disabled={isRunning}
              className="w-full px-4 py-2.5 rounded-full border border-neutral-300 bg-white text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
            />
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Read-only scan. Hostname must match SCAN_ALLOWLIST. Enforces robots.txt verification and strict SSRF defenses.
            </p>
          </div>
        )}

        <p className="text-xs text-neutral-500 mt-4 leading-relaxed">
          Scanning executes on headless Chromium to evaluate DOM nodes against automated axe-core rules. Automated checks identify programmatic violations and should be complemented by assistive journey testing and manual review for full accessibility coverage.
        </p>
      </div>

      {/* Optional AI Assist Settings Card */}
      <div className="p-5 sm:p-6 rounded-[22px] bg-white border border-neutral-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Optional AI Assist
              </h3>
              <AiBadge label="Optional" />
            </div>
            <p className="text-xs text-neutral-600 max-w-xl">
              {isAiConfigured
                ? "AI assist is optional and off by default. Enabling sends element snippets to Anthropic for analysis."
                : "AI assist unavailable (API key not configured)"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={aiEnabled}
                onChange={(e) => setAiEnabled(e.target.checked)}
                disabled={!isAiConfigured}
                className="sr-only peer"
                aria-label="Toggle AI assist"
              />
              <div
                className={`w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                  !isAiConfigured
                    ? "opacity-40 cursor-not-allowed"
                    : "peer-checked:bg-purple-600 cursor-pointer"
                }`}
              ></div>
              <span className="ml-3 text-xs font-semibold text-neutral-800">
                {aiEnabled ? "Enabled" : "Disabled"}
              </span>
            </label>
          </div>
        </div>

        {aiEnabled && currentRun && (
          <div className="mt-5 pt-5 border-t border-neutral-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Executive AI Summary
              </span>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="px-3.5 py-1.5 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {isSummarizing ? "Generating..." : summaryBullets ? "Regenerate Summary" : "Generate 3-Bullet Summary"}
              </button>
            </div>

            {summaryBullets && (
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <AiBadge label="AI-suggested, needs review" />
                  <span className="text-[11px] text-neutral-500 font-medium">Suitable for non-technical stakeholders</span>
                </div>
                <ul className="list-disc list-inside space-y-1.5 text-xs text-neutral-800">
                  {summaryBullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="leading-relaxed">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {summaryError && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {summaryError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Progress / Loading State */}
      {isRunning && (
        <LoadingState message="Launching Chromium browser and evaluating axe-core rules against /demo..." />
      )}

      {/* Error handling with retry */}
      {error && !isRunning && (
        <ErrorState
          title="Audit Execution Failed"
          message={error}
          onRetry={runAudit}
        />
      )}

      {/* Results Summary */}
      {!isRunning && !error && currentRun && (
        <div className="space-y-6">
          <div className="p-6 sm:p-8 rounded-[24px] bg-white border border-neutral-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-5 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h2 className="text-lg font-bold text-neutral-950">Latest Audit Run Summary</h2>
                  <StatusPill
                    status="pass"
                    label={currentRun.isSnapshot || currentRun.snapshotLabel ? (currentRun.snapshotLabel || "Saved snapshot") : "Verified Run"}
                  />
                  <span className="text-[11px] font-semibold bg-[#F0F9FF] border border-[#BAE6FD] text-[#0369A1] px-2.5 py-0.5 rounded-full">
                    {currentRun.engine === "full" ? "Engine: Full browser" : "Engine: Lightweight hosted scan"}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Target: <span className="font-mono text-neutral-700">{currentRun.target}</span> • Completed: {new Date(currentRun.timestamp).toLocaleString()}
                  {currentRun.durationMs ? ` • Scan Duration: ${(currentRun.durationMs / 1000).toFixed(2)}s` : ""}
                  {typeof currentRun.passesCount === "number" ? ` • ${currentRun.passesCount} Rules Passed` : ""}
                </p>
                <div className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200/80 px-2.5 py-1 rounded-lg mt-2 inline-block">
                  Automated checks only. Not a statement of compliance.
                </div>
              </div>

              <Link
                href="/issues"
                className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>Inspect All Findings</span>
                <span>→</span>
              </Link>
            </div>

            {/* Lightweight scan notice */}
            {currentRun.engine === "lightweight" && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium mb-6">
                Lightweight scan: rules that need real layout, such as color contrast, may not be evaluated.
              </div>
            )}

            {/* Severity stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
              <div className="p-4 rounded-2xl bg-[#F4F5F7] border border-neutral-200/60 text-center">
                <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Total Issues</span>
                <span className="text-3xl font-extrabold text-neutral-950 mt-1 block">{currentRun.issueCounts.total}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/80 text-center">
                <span className="text-xs text-rose-800 font-semibold uppercase tracking-wider block">Critical</span>
                <span className="text-3xl font-extrabold text-rose-600 mt-1 block">{currentRun.issueCounts.critical}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-center">
                <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block">Serious</span>
                <span className="text-3xl font-extrabold text-amber-600 mt-1 block">{currentRun.issueCounts.serious}</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-100/60 border border-neutral-200 text-center">
                <span className="text-xs text-neutral-700 font-semibold uppercase tracking-wider block">Moderate</span>
                <span className="text-3xl font-extrabold text-neutral-800 mt-1 block">{currentRun.issueCounts.moderate}</span>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center">
                <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Minor</span>
                <span className="text-3xl font-extrabold text-neutral-600 mt-1 block">{currentRun.issueCounts.minor}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-center">
                <span className="text-xs text-emerald-800 font-semibold uppercase tracking-wider block">Passed Rules</span>
                <span className="text-3xl font-extrabold text-emerald-600 mt-1 block">{currentRun.passesCount ?? "—"}</span>
              </div>
            </div>

            {/* Violations Preview List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                  automated checks reported {currentRun.issueCounts.total} issues
                </h3>
              </div>
              <ul className="divide-y divide-neutral-100 border border-neutral-200 rounded-2xl overflow-hidden" role="list">
                {currentRun.issues.map((issue, idx) => (
                  <li key={issue.id} className="p-4 sm:p-5 bg-white hover:bg-neutral-50/70 transition-colors flex items-start gap-4">
                    <StopBadge number={idx + 1} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <SeverityBadge severity={issue.severity} />
                        <span className="text-xs font-mono font-medium bg-neutral-100 px-2 py-0.5 rounded-full text-neutral-800 border border-neutral-200">
                          {issue.rule}
                        </span>
                        <span className="text-xs text-neutral-400">
                          • {issue.affectedElements.length} affected element{issue.affectedElements.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-neutral-950">
                        {issue.description}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 line-clamp-1">
                        Impact: {issue.userImpact}
                      </p>

                      {aiEnabled && (
                        <div className="mt-2.5">
                          {!expandedAiExplanations[issue.id] ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleExplainIssue(
                                  issue.id,
                                  issue.rule,
                                  issue.severity,
                                  issue.affectedElements[0]?.html,
                                  issue.helpText
                                )
                              }
                              disabled={loadingAiIssueId === issue.id}
                              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1.5"
                            >
                              {loadingAiIssueId === issue.id ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                                  <span>Generating AI explanation...</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] uppercase font-bold text-purple-500">AI</span>
                                  <span>Explain Why Barrier Matters</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-neutral-800 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <AiBadge label="AI-suggested, needs review" />
                              </div>
                              <p className="leading-relaxed font-sans">
                                {expandedAiExplanations[issue.id]}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Empty State before any scan */}
      {!isRunning && !error && !currentRun && (
        <EmptyState
          title="No Audits Executed"
          description="Select the verified demo page target above and click 'Start Audit' to launch Playwright and run axe-core."
        />
      )}
    </div>
  );
}
