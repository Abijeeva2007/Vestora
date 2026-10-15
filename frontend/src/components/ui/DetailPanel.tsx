import type { Issue } from "@/types";
import { SeverityBadge } from "./SeverityBadge";

interface DetailPanelProps {
  issue: Issue | null;
  onClose: () => void;
}

export function DetailPanel({ issue, onClose }: DetailPanelProps) {
  if (!issue) return null;

  return (
    <aside
      aria-label="Issue details"
      className="border border-neutral-200 bg-neutral-50/70 rounded-2xl p-6 flex flex-col gap-5 sticky top-6 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <SeverityBadge severity={issue.severity} />
            <span className="text-xs font-mono font-medium bg-white border border-neutral-200 px-2 py-0.5 rounded-full text-neutral-800">
              {issue.rule}
            </span>
            {issue.inferredFromJourney && (
              <span className="text-[10px] font-medium bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-full">
                Inferred from Journey Test
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-neutral-950 leading-snug">
            {issue.description}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details panel"
          className="p-1.5 rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {issue.measuredTaskImpactReason && (
        <div className="p-3.5 bg-white border border-neutral-200 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Measured Task Impact:
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-neutral-900 text-white">
              {issue.measuredTaskImpact === "task_blocker"
                ? "Task Blocker"
                : issue.measuredTaskImpact === "interactive_barrier"
                ? "Interactive Barrier"
                : "Visual / Content Barrier"}
            </span>
          </div>
          <p className="text-xs text-neutral-600 leading-relaxed mt-1">
            {issue.measuredTaskImpactReason}
          </p>
        </div>
      )}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
          User Impact
        </h3>
        <p className="text-sm text-neutral-800 leading-relaxed font-normal bg-white p-3.5 rounded-xl border border-neutral-200">
          {issue.userImpact}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
          Guidance & Remediation
        </h3>
        <p className="text-sm text-neutral-800 leading-relaxed bg-white p-3.5 rounded-xl border border-neutral-200">
          {issue.helpText}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
          Affected Elements ({issue.affectedElements.length})
        </h3>
        <div className="space-y-3">
          {issue.affectedElements.map((el, idx) => (
            <div
              key={idx}
              className="p-3.5 bg-white rounded-xl border border-neutral-200 text-xs font-mono"
            >
              <div className="mb-1.5">
                <span className="text-neutral-500 font-sans font-medium">Selector: </span>
                <span className="text-neutral-900 font-semibold break-all">{el.selectors.join(", ")}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-sans font-medium block mb-1">
                  HTML Snippet:
                </span>
                <pre className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 overflow-x-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed">
                  {el.html}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      {issue.helpUrl && (
        <div className="pt-2 border-t border-neutral-200">
          <a
            href={issue.helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-900 hover:underline"
          >
            <span>View axe-core Rule Documentation</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      )}
    </aside>
  );
}
