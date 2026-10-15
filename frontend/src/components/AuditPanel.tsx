"use client";

import { useAccessibilityStore } from "@/lib/accessibility-store";

export function AuditPanel() {
  const { results, sampleMode, setSampleMode, runAudit, cancelAudit } =
    useAccessibilityStore();

  const last = results[results.length - 1];
  const isActive = last && last.status === "running";

  return (
    <section
      aria-label="Accessibility audit controls"
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-black"
    >
      <h2 className="mb-4 text-lg font-semibold">Audit Controls</h2>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-x-6">
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            htmlFor="audit-run-button"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Run Accessibility Audit
          </label>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Scans the demo page with axe-core and displays real findings.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <button
            id="audit-run-button"
            type="button"
            onClick={() => runAudit()}
            disabled={isActive}
            className={(() => {
              const base =
                "inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200";
              if (isActive) return `${base} border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300`;
              return `${base} border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 dark:border-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-600`;
            })()}
          >
            {isActive ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                Scanning…
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Run Audit
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => cancelAudit()}
            disabled={!isActive}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => setSampleMode((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <svg
              className={`h-4 w-4 ${sampleMode ? "text-amber-500" : "text-zinc-400"}`}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {sampleMode ? "Showing sample data" : "Load sample data"}
          </button>
        </div>
      </div>

      {/* Last-run status message. */}
      <div
        className="mt-5 flex flex-col gap-1.5 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-900"
        aria-live="polite"
      >
        {isActive ? (
          <>
            <p className="flex items-center gap-2 font-medium text-indigo-700 dark:text-indigo-300">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
              Running accessibility audit…
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              This may take a few seconds. The demo page is scanned with
              axe-core in a real browser.
            </p>
          </>
        ) : last && last.status === "error" ? (
          <>
            <p className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
              <svg
                className="h-4 w-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Audit failed
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              {last.error ?? "An unexpected error occurred while running the audit."}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Make sure the dev server is running and the demo page is reachable.
            </p>
          </>
        ) : last && last.status === "empty" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            The audit completed, but no issues were found on the page.
          </p>
        ) : last && last.status === "success" && last.data.totalIssues === 0 ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            No accessibility issues were detected on the scanned page.
          </p>
        ) : last && last.status === "success" ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Audit complete:{" "}
            <span className="font-semibold">
              {last.data.totalIssues} issue{last.data.totalIssues !== 1 ? "s" : ""}
            </span>
            {" "}
            found.
          </p>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Click <strong>Run Audit</strong> to scan the demo page with
            axe-core.
          </p>
        )}
      </div>

      {/* Data source indicator. */}
      <div
        className={`mt-3 flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
          sampleMode
            ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400"
            : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            sampleMode ? "bg-amber-500" : "bg-zinc-400"
          }`}
          aria-hidden="true"
        />
        {sampleMode
          ? "Sample/demo data — not a real scan result"
          : "Real axe-core scan results"}
      </div>
    </section>
  );
}
