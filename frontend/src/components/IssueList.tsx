"use client";

import { useAccessibilityStore } from "@/lib/accessibility-store";
import type { ScanResultData, AccessibilityViolation, NodeEntry } from "@/components/shared-types";
import { Container } from "@/components/Container";

export function IssueList() {
  const { results, sampleMode } = useAccessibilityStore();
  const last = results[results.length - 1];
  const mode = sampleMode;

  if (last && last.status === "error") {
    return (
      <Container className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Findings</h2>
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          The last audit failed. Run it again or check that the demo page is
          reachable.
        </p>
      </Container>
    );
  }

  if (last && last.status === "empty") {
    return (
      <Container className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Findings</h2>
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
          role="status"
        >
          No accessibility issues were found on the scanned page.
        </div>
      </Container>
    );
  }

  if (!last || last.status !== "success") {
    return (
      <Container className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Findings</h2>
        <div
          className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
          role="status"
        >
          Run an audit above to see findings here.
        </div>
      </Container>
    );
  }

  const data: ScanResultData = mode ? SAMPLE_DATA : last.data;

  if (data.violations.length === 0) {
    return (
      <Container className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Findings</h2>
        <div
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
          role="status"
        >
          No accessibility issues were found on the scanned page.
        </div>
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Findings
          <span className="ml-2 text-sm font-normal text-zinc-500 dark:text-zinc-400">
            {mode ? "sample data" : ""}
          </span>
        </h2>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {data.violations.length} violation{data.violations.length !== 1 ? "s" : ""}
        </span>
      </div>

      <ul
        className="flex flex-col gap-3"
        role="list"
        aria-label="Accessibility violations"
      >
        {data.violations.map((violation: AccessibilityViolation) => (
          <li
            key={`${violation.id}-${violation.nodes.map((n: NodeEntry) => n.target.join(","))}`}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-black"
          >
            <header className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <SeverityBadge impact={violation.impact} />
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                  {violation.id}
                </code>
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {violation.name}
                </span>
              </div>
              {violation.helpUrl && (
                <a
                  href={violation.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 transition hover:text-indigo-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300"
                >
                  Rule documentation
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              )}
            </header>

            <div className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <p className="leading-relaxed">{violation.description}</p>
              <p className="leading-relaxed">
                <span className="font-medium text-zinc-700 dark:text-zinc-200">
                  How to fix:
                </span>{" "}
                {violation.help}
              </p>
            </div>

            <ul
              className="flex flex-col gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
              aria-label={`Affected elements for ${violation.id}`}
            >
              {violation.nodes.map((node: NodeEntry, index: number) => (
                <li
                  key={index}
                  className="break-words rounded bg-zinc-50 p-2 font-mono text-xs dark:bg-zinc-900"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      Element {index + 1}
                    </span>
                    {node.target.length > 0 && (
                      <code className="rounded bg-zinc-200 px-1 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 break-all">
                        {node.target.join(", ")}
                      </code>
                    )}
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {node.html || "<no html snippet>"}
                  </pre>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Container>
  );
}

function SeverityBadge({ impact }: { impact: "critical" | "serious" | "moderate" | "minor" | null | undefined }) {
  const map: Record<"critical" | "serious" | "moderate" | "minor", { label: string; className: string }> = {
    critical: { label: "Critical", className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300" },
    serious: { label: "Serious", className: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
    moderate: { label: "Moderate", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
    minor: { label: "Minor", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  };
  const choice =
    impact && impact in map
      ? map[impact as keyof typeof map]
      : { label: impact ?? "Unknown", className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${choice.className}`}
      aria-label={`Severity: ${choice.label}`}
    >
      {choice.label}
    </span>
  );
}

export const SAMPLE_DATA: ScanResultData = {
  scannedAt: new Date().toISOString(),
  scannedUrl: "http://localhost:3000/demo",
  violations: [
    {
      id: "color-contrast",
      name: "Elements must have sufficient color contrast",
      impact: "serious",
      description:
        "Text elements must have sufficient color contrast against their background so that users with low vision can read the content.",
      help:
        "Ensure that the text color and the background color meet the minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/color-contrast",
      nodes: [
        {
          target: ['[data-low-contrast="subtle-gray-on-white"]'],
          html: '<p data-low-contrast="subtle-gray-on-white" style="color: #9a9a9a; background-color: #ffffff;">This text uses a light grey color on a white background and does not meet the minimum contrast ratio.</p>',
          label: '[data-low-contrast="subtle-gray-on-white"]',
        },
      ],
    },
    {
      id: "label",
      name: "Inputs must have a programmatically determined label",
      impact: "serious",
      description:
        "Inputs must have a programmatically determinable label so that assistive technologies can identify the purpose of each field.",
      help:
        "Add a label element associated with the input via the for attribute, or wrap the input in a label. Alternatively, use aria-label or aria-labelledby.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/label",
      nodes: [
        {
          target: ['input[name="email"]'],
          html: '<input type="email" name="email" placeholder="you@example.com" />',
          label: 'input[name="email"]',
        },
      ],
    },
    {
      id: "button-name",
      name: "Buttons must have discernible text",
      impact: "serious",
      description:
        "Buttons must have discernible text so that users of assistive technologies can identify the button's purpose.",
      help:
        "Add text content to the button, or use aria-label or aria-labelledby to provide an accessible name.",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/button-name",
      nodes: [
        {
          target: ['button[type="button"]:nth-of-type(2)'],
          html: '<button><svg aria-hidden="true">…</svg></button>',
          label: 'button without text content',
        },
      ],
    },
    {
      id: "image-alt",
      name: "Images must have alternate text",
      impact: "moderate",
      description:
        "Informational images must have alternate text so that users who cannot see the image can understand its content.",
      help:
        "Add an alt attribute describing the image's content and function. Decorative images should use alt=\"\".",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/image-alt",
      nodes: [
        {
          target: ['img[src="/globe.svg"]'],
          html: '<img src="/globe.svg" alt="" />',
          label: 'img[src="/globe.svg"]',
        },
      ],
    },
  ],
  totalIssues: 4,
  criticalHighIssues: 3,
};
