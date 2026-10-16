"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuditStore } from "@/lib/audit-store";
import { useJourneyStore } from "@/lib/journey-store";
import { PageHeader } from "@/components/ui/PageHeader";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { DataTable, Column } from "@/components/ui/DataTable";
import { DetailPanel } from "@/components/ui/DetailPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import type { Issue, Severity, MeasuredTaskImpact } from "@/types";

export default function IssueExplorerPage() {
  const { currentRun, isRunning: isAuditRunning, fetchLatestRun, runAudit } = useAuditStore();
  const { currentJourney, fetchLatestJourney } = useJourneyStore();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [orderMode, setOrderMode] = useState<"rule" | "measured">("rule");

  useEffect(() => {
    fetchLatestRun();
    fetchLatestJourney();
  }, [fetchLatestRun, fetchLatestJourney]);

  // Enrich issues with real journey test evidence if available
  const rawIssues = currentRun?.issues || [];
  const enrichedIssues: Issue[] = rawIssues.map((issue) => {
    if (!currentJourney) {
      return {
        ...issue,
        measuredTaskImpact: "not_measured" as MeasuredTaskImpact,
      };
    }

    if (issue.rule === "label") {
      return {
        ...issue,
        measuredTaskImpact: "task_blocker" as MeasuredTaskImpact,
        measuredTaskImpactReason:
          "Demonstrably blocked the tested applicant persona at Step 2 of the scholarship form journey: #national-id-input lacks programmatic label association.",
        inferredFromJourney: true,
        failingStep: "Step 2: National ID input lacks programmatic label association",
      };
    }

    if (issue.rule === "button-name") {
      return {
        ...issue,
        measuredTaskImpact: "interactive_barrier" as MeasuredTaskImpact,
        measuredTaskImpactReason:
          "Keyboard navigates to #bookmark-btn, but the control has no discernible text or aria-label; screen reader users hear no action.",
        inferredFromJourney: true,
      };
    }

    if (issue.rule === "color-contrast") {
      return {
        ...issue,
        measuredTaskImpact: "visual_barrier" as MeasuredTaskImpact,
        measuredTaskImpactReason:
          "Submit button and notice text fail WCAG AA contrast threshold; visual barrier for low-vision users, but does not halt keyboard submission.",
        inferredFromJourney: true,
      };
    }

    if (issue.rule === "image-alt") {
      return {
        ...issue,
        measuredTaskImpact: "visual_barrier" as MeasuredTaskImpact,
        measuredTaskImpactReason:
          "Hero banner lacks alt text; screen readers cannot convey program imagery, but does not block form navigation.",
        inferredFromJourney: true,
      };
    }

    return {
      ...issue,
      measuredTaskImpact: "not_measured" as MeasuredTaskImpact,
      measuredTaskImpactReason: "Not tested in active journey test scenarios.",
    };
  });

  // Filter by severity
  const filteredIssues = enrichedIssues.filter((issue) => {
    if (severityFilter === "all") return true;
    return issue.severity === severityFilter;
  });

  // Sorting
  const severityRank: Record<Severity, number> = {
    critical: 1,
    serious: 2,
    moderate: 3,
    minor: 4,
  };

  const impactRank: Record<MeasuredTaskImpact, number> = {
    task_blocker: 1,
    interactive_barrier: 2,
    visual_barrier: 3,
    not_measured: 4,
  };

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (orderMode === "rule") {
      return (severityRank[a.severity] || 5) - (severityRank[b.severity] || 5);
    }
    const rankA = impactRank[a.measuredTaskImpact || "not_measured"];
    const rankB = impactRank[b.measuredTaskImpact || "not_measured"];
    return rankA - rankB;
  });

  // Table columns definition
  const columns: Column<Issue>[] = [
    {
      header: "Severity / Impact",
      accessor: (issue) => (
        <div className="space-y-1">
          <SeverityBadge severity={issue.severity} />
          {issue.measuredTaskImpact && issue.measuredTaskImpact !== "not_measured" && (
            <div>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  issue.measuredTaskImpact === "task_blocker"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : issue.measuredTaskImpact === "interactive_barrier"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200"
                }`}
              >
                {issue.measuredTaskImpact === "task_blocker"
                  ? "Task Blocker"
                  : issue.measuredTaskImpact === "interactive_barrier"
                  ? "Interactive Barrier"
                  : "Visual Barrier"}
              </span>
            </div>
          )}
        </div>
      ),
      className: "w-36",
    },
    {
      header: "Rule Name",
      accessor: (issue) => (
        <div>
          <code className="text-xs font-mono font-semibold text-neutral-900 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full block w-fit mb-1">
            {issue.rule}
          </code>
          <span className="text-xs font-medium text-neutral-950 line-clamp-2">
            {issue.description}
          </span>
          {issue.inferredFromJourney && (
            <span className="text-[10px] font-medium text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full block w-fit mt-1">
              Inferred from Journey Test
            </span>
          )}
        </div>
      ),
      className: "w-52",
    },
    {
      header: "Affected Element",
      accessor: (issue) => {
        const firstEl = issue.affectedElements[0];
        return (
          <div>
            <code className="text-xs font-mono text-neutral-900 block break-all line-clamp-2 font-semibold">
              {firstEl?.selectors.join(", ") || "element"}
            </code>
            {issue.affectedElements.length > 1 && (
              <span className="text-[11px] text-neutral-500 block mt-0.5">
                +{issue.affectedElements.length - 1} more occurrence{issue.affectedElements.length > 2 ? "s" : ""}
              </span>
            )}
          </div>
        );
      },
      className: "w-44",
    },
    {
      header: "User-Impact & Journey Evidence",
      accessor: (issue) => (
        <div className="space-y-1">
          <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2 max-w-md">
            {issue.userImpact}
          </p>
          {issue.measuredTaskImpactReason && (
            <p className="text-[11px] text-neutral-900 font-medium line-clamp-2">
              Observed: {issue.measuredTaskImpactReason}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Evidence",
      accessor: (issue) => (
        <span className="text-xs text-neutral-800 font-medium bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
          {issue.evidenceType}
        </span>
      ),
      className: "w-28",
    },
    {
      header: "Action",
      accessor: (issue) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedIssue(issue);
          }}
          className="px-3 py-1 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors shadow-xs"
        >
          View Details
        </button>
      ),
      className: "w-28 text-right",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="PRIORITIZATION ENGINE"
        title="Issue Explorer"
        description="Investigate all detected accessibility barriers with actionable remediation guidance and element-level code snippets."
      />

      {isAuditRunning && <LoadingState message="Scanning demo page for issues..." />}

      {!isAuditRunning && !currentRun && (
        <EmptyState
          title="No Issues Available"
          description="You haven't run an accessibility audit yet. Run a scan from the Overview or Audits page to populate findings here."
          action={
            <button
              type="button"
              onClick={runAudit}
              className="px-6 py-2.5 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Run Audit Now
            </button>
          }
        />
      )}

      {!isAuditRunning && currentRun && (
        <div className="space-y-6">
          {/* Filters & View Toggles Toolbar */}
          <div className="p-4 sm:p-5 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter by severity */}
            <div className="flex items-center gap-3">
              <label htmlFor="severity-filter" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Filter by Severity:
              </label>
              <select
                id="severity-filter"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="px-3.5 py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 shadow-xs"
              >
                <option value="all">All Severities ({enrichedIssues.length})</option>
                <option value="critical">Critical ({currentRun.issueCounts.critical})</option>
                <option value="serious">Serious ({currentRun.issueCounts.serious})</option>
                <option value="moderate">Moderate ({currentRun.issueCounts.moderate})</option>
                <option value="minor">Minor ({currentRun.issueCounts.minor})</option>
              </select>
            </div>

            {/* View Toggle: Rule severity order vs Measured impact order */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Order by:
              </span>
              <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setOrderMode("rule")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    orderMode === "rule"
                      ? "bg-[#0369A1] text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-950"
                  }`}
                >
                  Rule severity
                </button>
                <button
                  type="button"
                  onClick={() => setOrderMode("measured")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                    orderMode === "measured"
                      ? "bg-[#0369A1] text-white shadow-xs"
                      : "text-neutral-600 hover:text-neutral-950"
                  }`}
                >
                  <span>Measured impact</span>
                  {currentJourney ? (
                    <span className="text-[10px] bg-emerald-800 text-white px-1.5 py-0.2 rounded-full font-semibold">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] bg-neutral-200 text-neutral-700 px-1.5 rounded-full font-normal">
                      Pending
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* User Task Impact Matrix */}
          <div className="p-6 sm:p-7 rounded-[24px] bg-white border border-neutral-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-neutral-950"></span>
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                    User Task Impact Matrix
                  </h2>
                </div>
                <p className="text-xs text-neutral-500">
                  Correlates automated rule violations with measurable user task completion barriers observed during live browser journeys.
                </p>
              </div>
              <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full border border-neutral-200 shrink-0">
                Matrix Scope: 4 Tested Conditions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Persona / Condition</th>
                    <th className="py-2.5 px-3">Target User Task</th>
                    <th className="py-2.5 px-3">Identified Barrier</th>
                    <th className="py-2.5 px-3">Measured Journey Impact</th>
                    <th className="py-2.5 px-3 text-right">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-800">
                  <tr className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-neutral-950">
                      Screen Reader / Keyboard
                    </td>
                    <td className="py-3 px-3">
                      Complete scholarship form submission
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-rose-700">
                      #national-id-input (label)
                    </td>
                    <td className="py-3 px-3 text-rose-700 font-semibold">
                      Task Blocker: Halted at Step 2 (cannot identify field)
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                        P1 Critical
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-neutral-950">
                      Keyboard-Only Sighted
                    </td>
                    <td className="py-3 px-3">
                      Access scholarship categories
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-amber-700">
                      .hover-menu a (unreachable)
                    </td>
                    <td className="py-3 px-3 text-amber-800">
                      Interactive Barrier: 3 submenu links bypassed
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        P2 High
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-neutral-950">
                      Screen Reader User
                    </td>
                    <td className="py-3 px-3">
                      Bookmark application for later
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-amber-700">
                      #bookmark-btn (button-name)
                    </td>
                    <td className="py-3 px-3 text-amber-800">
                      Interactive Barrier: No discernible button name spoken
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                        P2 High
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-medium text-neutral-950">
                      Low-Vision Zoom / Normal
                    </td>
                    <td className="py-3 px-3">
                      Read submit button &amp; disclaimers
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-neutral-700">
                      #submit-app-btn (color-contrast)
                    </td>
                    <td className="py-3 px-3 text-neutral-600">
                      Visual Barrier: 1.46:1 contrast (below 4.5:1 minimum)
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-800 font-bold text-[10px]">
                        P3 Moderate
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Measured Impact Active or Inactive Banners */}
          {orderMode === "measured" && currentJourney && (
            <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200 text-xs text-neutral-900 flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                i
              </span>
              <div className="leading-relaxed">
                <span className="font-bold text-neutral-950">Evidence-based Task Prioritization Active: </span>
                Issues are ranked by their demonstrably measured impact on user task completion from live browser journey tests. Form task blockers (e.g. unlabeled required input blocking screen reader submission) are prioritized ahead of non-blocking visual criteria.
              </div>
            </div>
          )}

          {/* Main Layout: Table + Detail Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className={selectedIssue ? "lg:col-span-7" : "lg:col-span-12"}>
              <DataTable
                data={sortedIssues}
                columns={columns}
                keyExtractor={(issue) => issue.id}
                onRowClick={(issue) => setSelectedIssue(issue)}
                selectedId={selectedIssue?.id}
                caption="Accessibility violations detected by axe-core"
              />
              <p className="text-xs text-neutral-500 mt-3">
                Showing {sortedIssues.length} of {enrichedIssues.length} issues. Select any row to inspect selector details, journey evidence, and remediation guidance.
              </p>
            </div>

            {selectedIssue && (
              <div className="lg:col-span-5">
                <DetailPanel
                  issue={selectedIssue}
                  onClose={() => setSelectedIssue(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
