"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useJourneyStore } from "@/lib/journey-store";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill, StatusType } from "@/components/ui/StatusPill";
import { StopBadge } from "@/components/ui/StopBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import type { TaskStatus, JourneyTask } from "@/types";

function mapTaskStatusToPill(status: TaskStatus): { status: StatusType; label: string } {
  switch (status) {
    case "passed":
      return { status: "pass", label: "Passed" };
    case "failed":
      return { status: "fail", label: "Failed" };
    case "blocked":
      return { status: "fail", label: "Blocked" };
    case "not_run":
    default:
      return { status: "unavailable", label: "Not Run" };
  }
}

export default function JourneyTestingPage() {
  const { currentJourney, isRunning, error, runJourneyTests, fetchLatestJourney } =
    useJourneyStore();
  const [selectedTask, setSelectedTask] = useState<JourneyTask | null>(null);

  useEffect(() => {
    fetchLatestJourney();
  }, [fetchLatestJourney]);

  const tasks = currentJourney?.tasks || [];
  const blockedCount = tasks.filter((t) => t.status === "blocked").length;
  const failedCount = tasks.filter((t) => t.status === "failed").length;
  const passedCount = tasks.filter((t) => t.status === "passed").length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="BEHAVIORAL VERIFICATION"
        title="Journey Testing"
        description="Simulate realistic user workflows using assistive personas to evaluate barrier severity, task completion, and step-level blockages."
        action={
          <button
            type="button"
            onClick={runJourneyTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isRunning ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Running Browser Journeys...</span>
              </>
            ) : (
              <span>{currentJourney ? "Rerun Journey Tests" : "Run Journey Tests"}</span>
            )}
          </button>
        }
      />

      {isRunning && (
        <LoadingState message="Launching headless Chromium to test keyboard journeys and 320px reflow..." />
      )}

      {error && !isRunning && (
        <ErrorState
          title="Journey Test Execution Failed"
          message={error}
          onRetry={runJourneyTests}
        />
      )}

      {!isRunning && !error && !currentJourney && (
        <EmptyState
          title="No Journey Tests Executed Yet"
          description="Journey testing evaluates end-to-end task flows on the local scholarship application (/demo) using keyboard personas and responsive tests. Click above to run the scenarios."
          action={
            <button
              type="button"
              onClick={runJourneyTests}
              className="px-6 py-2.5 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Start First Journey Run
            </button>
          }
        />
      )}

      {!isRunning && !error && currentJourney && (
        <div className="space-y-8">
          {/* Metrics summary row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Journey Test Metrics">
            <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                Completed Test Flows
              </p>
              <div className="text-3xl font-extrabold text-neutral-950 my-1">
                {tasks.length}
              </div>
              <p className="text-xs text-neutral-500">
                {passedCount} passed, {failedCount} failed, {blockedCount} blocked
              </p>
            </div>

            <div className="p-6 rounded-[22px] bg-rose-50/60 border border-rose-200/80">
              <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">
                Task Blocker Rate
              </p>
              <div className="text-3xl font-extrabold text-rose-600 my-1">
                {blockedCount > 0 ? "1 Critical Flow" : "None"}
              </div>
              <p className="text-xs text-neutral-500">
                Unlabeled required input blocks form completion
              </p>
            </div>

            <div className="p-6 rounded-[22px] bg-amber-50/60 border border-amber-200/80">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
                Unreachable Navigation
              </p>
              <div className="text-3xl font-extrabold text-amber-600 my-1">
                {currentJourney.unreachableControlsCount} {currentJourney.unreachableControlsCount === 1 ? "link" : "links"}
              </div>
              <p className="text-xs text-neutral-500">
                Hover-only dropdown bypasses keyboard access
              </p>
            </div>

            <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                320px Reflow Assessment
              </p>
              <div className="text-3xl font-extrabold text-neutral-950 my-1">
                {currentJourney.horizontalOverflow320px ? "Overflow" : "Pass"}
              </div>
              <p className="text-xs text-neutral-500">
                {currentJourney.horizontalOverflow320px
                  ? `${currentJourney.overflowAmountPx}px horizontal scroll detected`
                  : "Zero horizontal scrolling detected"}
              </p>
            </div>
          </div>

          {/* Test Run Metadata Strip */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-neutral-900">Run Target: </span>
              <code className="text-neutral-900 font-mono text-xs">{currentJourney.target}</code>
              <span className="text-neutral-500">
                • Executed: {new Date(currentJourney.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-[11px] font-semibold bg-white border border-[#BAE6FD] text-[#0369A1] px-2.5 py-0.5 rounded-full">
                {currentJourney.engine === "full" ? "Engine: Full browser" : "Engine: Lightweight hosted scan"}
              </span>
              {currentJourney.engine === "lightweight" && (
                <span className="text-[11px] font-medium text-[#0369A1] block w-full sm:w-auto mt-1 sm:mt-0">
                  (DOM-computed tab order, not live key presses)
                </span>
              )}
            </div>
            <Link
              href="/focus-map"
              className="inline-flex items-center gap-1.5 font-semibold text-[#0369A1] hover:underline shrink-0"
            >
              <span>View Visual Tab-Order Map ({currentJourney.focusStops.length} stops)</span>
              <span>→</span>
            </Link>
          </div>

          {/* Task-by-Condition Matrix */}
          <section aria-labelledby="matrix-heading" className="border border-neutral-200 rounded-2xl bg-white overflow-hidden shadow-xs">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
              <h2 id="matrix-heading" className="text-base font-bold text-neutral-950">
                Task-by-Condition Matrix
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Evaluation of user journeys across specific accessibility personas and device conditions.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse" role="table">
                <thead>
                  <tr className="bg-neutral-50/70 border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    <th scope="col" className="px-5 py-3.5">Workflow Scenario</th>
                    <th scope="col" className="px-5 py-3.5">Assigned Persona</th>
                    <th scope="col" className="px-5 py-3.5">Condition</th>
                    <th scope="col" className="px-5 py-3.5">Status</th>
                    <th scope="col" className="px-5 py-3.5">Tab Presses</th>
                    <th scope="col" className="px-5 py-3.5">Failing / Blocking Step</th>
                    <th scope="col" className="px-5 py-3.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {tasks.map((task, idx) => {
                    const pill = mapTaskStatusToPill(task.status);
                    const isSelected = selectedTask?.id === task.id;
                    return (
                      <tr
                        key={task.id}
                        className={`transition-colors ${
                          isSelected ? "bg-neutral-100" : "hover:bg-neutral-50/60"
                        }`}
                      >
                        <td className="px-5 py-4 font-semibold text-neutral-950">
                          <div className="flex items-center gap-2.5">
                            <StopBadge number={idx + 1} />
                            <span>{task.title}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-neutral-600">
                          {task.persona}
                        </td>
                        <td className="px-5 py-4 text-xs text-neutral-600">
                          <span className="bg-neutral-100 border border-neutral-200 px-2.5 py-0.5 rounded-full font-mono text-[11px] text-neutral-800">
                            {task.condition}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusPill status={pill.status} label={pill.label} />
                        </td>
                        <td className="px-5 py-4 font-mono text-xs text-neutral-900">
                          {task.tabPresses > 0 ? `${task.tabPresses} tabs` : "N/A"}
                        </td>
                        <td className="px-5 py-4 text-xs text-rose-600 max-w-xs break-words line-clamp-2 font-medium">
                          {task.failingStep || "None (All steps completed)"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTask(isSelected ? null : task)}
                            className="px-3.5 py-1 rounded-full bg-[#0369A1] hover:bg-[#0284C7] text-white text-xs font-semibold transition-colors shadow-xs"
                          >
                            {isSelected ? "Hide Steps" : "Inspect Steps"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Step-by-Step Inspector Panel */}
          {selectedTask && (
            <div
              role="region"
              aria-label={`Step breakdown for ${selectedTask.title}`}
              className="p-6 sm:p-8 rounded-[24px] border border-neutral-200 bg-[#F4F5F7] space-y-6"
            >
              <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                      Detailed Journey Evidence
                    </span>
                    <StatusPill {...mapTaskStatusToPill(selectedTask.status)} />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-950">
                    {selectedTask.title} — {selectedTask.persona}
                  </h3>
                  <p className="text-sm text-neutral-600 mt-1">{selectedTask.explanation}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="p-2 rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100"
                  aria-label="Close step details"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* Step Sequence Listing */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">
                  Sequence of Executed Steps ({selectedTask.steps.length})
                </h4>
                <div className="space-y-3">
                  {selectedTask.steps.map((st) => (
                    <div
                      key={st.stepNumber}
                      className={`p-4 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        st.status === "passed"
                          ? "border-neutral-200"
                          : st.status === "blocked"
                          ? "border-rose-300 bg-rose-50/20"
                          : "border-amber-300 bg-amber-50/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${
                            st.status === "passed"
                              ? "bg-neutral-900"
                              : st.status === "blocked"
                              ? "bg-rose-600"
                              : "bg-amber-600"
                          }`}
                        >
                          {st.stepNumber}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-950">
                            {st.description}
                          </p>
                          {st.selector && (
                            <code className="text-xs font-mono text-neutral-700 mt-0.5 block">
                              Target: {st.selector}
                            </code>
                          )}
                          {st.failingReason && (
                            <p className="text-xs font-medium text-rose-800 mt-2 leading-relaxed bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                              Failure observation: {st.failingReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 sm:self-center">
                        <StatusPill
                          status={st.status === "passed" ? "pass" : st.status === "blocked" ? "fail" : "warning"}
                          label={st.status.toUpperCase()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked axe-core rules */}
              {selectedTask.linkedIssueRules && selectedTask.linkedIssueRules.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-neutral-200 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-900">Linked axe-core Rules:</span>
                    {selectedTask.linkedIssueRules.map((rule) => (
                      <code
                        key={rule}
                        className="font-mono text-neutral-800 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-full"
                      >
                        {rule}
                      </code>
                    ))}
                  </div>
                  <Link
                    href="/issues"
                    className="font-bold text-neutral-900 hover:underline"
                  >
                    View in Issue Explorer →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
