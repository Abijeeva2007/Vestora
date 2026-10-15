"use client";

import { useAccessibilityStore, type AccessibilityStoreReturn } from "@/lib/accessibility-store";

type StoreShape = AccessibilityStoreReturn;

export function OverviewCards() {
  const store = useAccessibilityStore() as unknown as StoreShape;

  const results: StoreShape["results"] = store.results;
  const sampleMode: StoreShape["sampleMode"] = store.sampleMode;

  const last = results.at(-1);
  const idle = !last || last.status === "idle";
  const lastSuccess = last && last.status === "success";
  const totalCount = lastSuccess ? last.data.totalIssues : 0;
  const criticalHighCount = lastSuccess ? last.data.criticalHighIssues : 0;

  return (
    <section
      aria-label="Accessibility audit summary"
      className="grid gap-4 sm:grid-cols-3"
    >
      <SummaryCard
        label="Total issues"
        value={String(totalCount)}
        tone={totalCount === 0 ? "neutral" : "critical"}
      />
      <SummaryCard
        label="Critical + high"
        value={String(criticalHighCount)}
        tone={criticalHighCount === 0 ? "neutral" : "critical"}
      />
      <SummaryCard
        label="Resolved"
        value="0"
        tone="neutral"
      />

      {!idle && last && <MetaStrip last={last} sampleMode={sampleMode} />}
    </section>
  );
}

function MetaStrip({ last, sampleMode }: { last: StoreShape["results"][number]; sampleMode: boolean }) {
  const statusText =
    last.status === "idle"
      ? "no results yet"
      : last.status === "running"
        ? "running…"
        : last.status === "error"
          ? "error"
          : last.status === "empty"
            ? "empty"
            : `${sampleMode ? "sample data" : "real scan results"}`;

  const meta: { time: string; url: string } =
    last.status === "idle"
      ? { time: "", url: "" }
      : last.status === "running"
        ? { time: "", url: last.scannedUrl ? ` — ${last.scannedUrl}` : "" }
        : {
            time:
              last.scannedAt !== undefined
                ? ` — ${new Date(last.scannedAt).toLocaleTimeString()}`
                : "",
            url: last.scannedUrl ? ` — ${last.scannedUrl}` : "",
          };

  return (
    <div
      className="sm:col-span-3 rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-black dark:text-zinc-400"
      role="status"
      aria-live="polite"
    >
      <span className="font-medium text-zinc-700 dark:text-zinc-200">Last result:</span>{" "}
      <span className="font-mono">{statusText}</span>
      <span className="text-zinc-400">{meta.time}{meta.url}</span>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "warning" | "critical";
}) {
  const base =
    "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-black";
  const accent =
    tone === "critical"
      ? "border-l-4 border-l-red-600 dark:border-l-red-500"
      : tone === "warning"
        ? "border-l-4 border-l-amber-500 dark:border-l-amber-400"
        : tone === "ok"
          ? "border-l-4 border-l-emerald-500 dark:border-l-emerald-400"
          : "";

  return (
    <div className={`${base} ${accent}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="text-4xl font-semibold leading-none" dir="ltr">
        <span className="tabular-nums">{value}</span>
      </p>
    </div>
  );
}
