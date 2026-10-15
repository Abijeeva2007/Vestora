"use client";

import { useEffect, useState, useRef } from "react";
import { useJourneyStore } from "@/lib/journey-store";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { StopBadge } from "@/components/ui/StopBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import type { FocusStop } from "@/types";

export default function FocusMapPage() {
  const { currentJourney, isRunning, error, runJourneyTests, fetchLatestJourney } =
    useJourneyStore();
  const [activeStop, setActiveStop] = useState<FocusStop | null>(null);
  const [filterVisibleOnly, setFilterVisibleOnly] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLatestJourney();
  }, [fetchLatestJourney]);

  const stops = currentJourney?.focusStops || [];
  const displayStops = filterVisibleOnly
    ? stops.filter((s) => !s.visibleFocus)
    : stops;

  const missingFocusCount = stops.filter((s) => !s.visibleFocus).length;
  const missingNameCount = stops.filter((s) => s.name === "(none)" || !s.name).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="SPATIAL TRAVERSAL AUDIT"
        title="Visual Tab-Order Map"
        description="Inspect sequential keyboard navigation order, verify visible focus ring indicators, and detect unreachable interactive zones."
        action={
          <button
            type="button"
            onClick={runJourneyTests}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs"
          >
            {isRunning ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                <span>Capturing Map...</span>
              </>
            ) : (
              <span>{currentJourney ? "Rerun Capture" : "Capture Focus Map"}</span>
            )}
          </button>
        }
      />

      {isRunning && (
        <LoadingState message="Capturing full-page screenshot and recording DOM focus coordinates..." />
      )}

      {error && !isRunning && (
        <ErrorState
          title="Focus Map Capture Failed"
          message={error}
          onRetry={runJourneyTests}
        />
      )}

      {!isRunning && !error && !currentJourney && (
        <EmptyState
          title="No Focus Map Captured Yet"
          description="Capture the full-page layout and sequential tab order of the demo scholarship application. This generates an overlay mapping every focusable stop."
          action={
            <button
              type="button"
              onClick={runJourneyTests}
              className="px-6 py-2.5 rounded-full bg-neutral-950 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
            >
              Capture Visual Focus Map
            </button>
          }
        />
      )}

      {!isRunning && !error && currentJourney && (
        <div className="space-y-6">
          {/* Metrics bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
              <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Total Stops</span>
              <span className="text-3xl font-extrabold text-neutral-950 my-1 block">{stops.length}</span>
              <span className="text-xs text-neutral-400 block">Recorded via Tab</span>
            </div>

            <div className="p-6 rounded-[22px] bg-rose-50/60 border border-rose-200/80">
              <span className="text-xs text-rose-800 font-semibold uppercase tracking-wider block">Unverified Focus</span>
              <span className="text-3xl font-extrabold text-rose-600 my-1 block">{missingFocusCount}</span>
              <span className="text-xs text-neutral-500 block">Lacks outline or box-shadow</span>
            </div>

            <div className="p-6 rounded-[22px] bg-amber-50/60 border border-amber-200/80">
              <span className="text-xs text-amber-800 font-semibold uppercase tracking-wider block">Missing Names</span>
              <span className="text-3xl font-extrabold text-amber-600 my-1 block">{missingNameCount}</span>
              <span className="text-xs text-neutral-500 block">Empty aria-label or text</span>
            </div>

            <div className="p-6 rounded-[22px] bg-[#F4F5F7] border border-neutral-200/70">
              <span className="text-xs text-neutral-500 font-semibold uppercase tracking-wider block">Unreachable</span>
              <span className="text-3xl font-extrabold text-neutral-950 my-1 block">{currentJourney.unreachableControlsCount}</span>
              <span className="text-xs text-neutral-400 block">Hover-only dropdown links</span>
            </div>
          </div>

          {/* Legend and Filter Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-100 border border-neutral-200 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold text-neutral-900">Badge Legend:</span>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-neutral-950 text-white flex items-center justify-center font-bold text-[10px]">#</span>
                <span className="text-neutral-700">Verified Visible Focus</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-[10px]">#</span>
                <span className="text-neutral-700">Suppressed Focus Indicator</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-[10px]">!</span>
                <span className="text-neutral-700">Unreachable Hover Control</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer font-medium text-neutral-800">
                <input
                  type="checkbox"
                  checked={filterVisibleOnly}
                  onChange={(e) => setFilterVisibleOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <span>Show only focus-indicator warnings</span>
              </label>
            </div>
          </div>

          {/* Side-by-Side on Desktop, Stacked on Mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Visual Screenshot with Focus Badges Overlay (7 cols) */}
            <div className="lg:col-span-7 border border-neutral-200 rounded-2xl bg-white p-5 shadow-xs overflow-hidden">
              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
                <h2 className="text-sm font-bold text-neutral-950">
                  Interactive Screenshot &amp; Tab Stops Overlay
                </h2>
                <span className="text-xs text-neutral-500 font-mono">
                  /demo ({currentJourney.viewportWidth}px)
                </span>
              </div>

              {currentJourney.screenshotBase64 ? (
                <div
                  ref={containerRef}
                  tabIndex={0}
                  role="region"
                  aria-label="Visual tab order preview canvas"
                  className="relative overflow-auto border border-neutral-200 rounded-xl max-h-[700px] bg-neutral-50 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  {/* Base Screenshot */}
                  <img
                    src={currentJourney.screenshotBase64}
                    alt="Captured render of the demo application with keyboard focus stops overlaid"
                    className="w-full h-auto block select-none"
                  />

                  {/* Badges Overlaid at Exact Bounding Coordinates */}
                  {displayStops.map((stop) => {
                    if (!stop.boundingBox || stop.boundingBox.width === 0) return null;
                    const isSelected = activeStop?.order === stop.order;

                    const leftPercent = (stop.boundingBox.x / (currentJourney.viewportWidth || 1024)) * 100;
                    const topPercent = (stop.boundingBox.y / (currentJourney.viewportHeight || 900)) * 100;

                    return (
                      <div
                        key={stop.order}
                        style={{
                          left: `${Math.min(96, Math.max(2, leftPercent))}%`,
                          top: `${Math.min(98, Math.max(1, topPercent))}%`,
                        }}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer"
                        onClick={() => setActiveStop(stop)}
                        title={`Stop #${stop.order}: ${stop.selector} (${stop.name})`}
                      >
                        <span
                          className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white shadow-md transition-transform hover:scale-125 ${
                            isSelected
                              ? "ring-2 ring-white scale-125 bg-amber-500"
                              : stop.visibleFocus
                              ? "bg-neutral-950"
                              : "bg-rose-600"
                          }`}
                        >
                          {stop.order}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500">
                  Screenshot unavailable.
                </div>
              )}

              <p className="text-xs text-neutral-500 mt-3">
                Click any numbered pin to highlight its details in the list.
              </p>
            </div>

            {/* Focus-Order List (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="border border-neutral-200 rounded-2xl bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
                  <h3 className="text-sm font-bold text-neutral-950">
                    Sequential Focus Stops ({stops.length})
                  </h3>
                  <span className="text-xs text-neutral-400 font-medium">Tab Order</span>
                </div>

                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Tab sequence stop list"
                  className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                >
                  {displayStops.map((stop) => {
                    const isSelected = activeStop?.order === stop.order;
                    return (
                      <div
                        key={stop.order}
                        onClick={() => setActiveStop(isSelected ? null : stop)}
                        className={`p-3.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "border-neutral-900 bg-neutral-100"
                            : stop.visibleFocus
                            ? "border-neutral-200 bg-white hover:bg-neutral-50"
                            : "border-rose-200 bg-rose-50/20 hover:bg-rose-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
                                stop.visibleFocus ? "bg-neutral-950" : "bg-rose-600"
                              }`}
                            >
                              {stop.order}
                            </span>
                            <code className="font-mono text-neutral-900 font-semibold text-[11px] break-all">
                              {stop.selector}
                            </code>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                            {stop.role}
                          </span>
                        </div>

                        <div className="space-y-1 text-neutral-600 pl-7">
                          <div>
                            <span className="font-medium text-neutral-900">Accessible Name: </span>
                            <span className={stop.name === "(none)" ? "text-amber-800 italic" : "text-neutral-900"}>
                              {stop.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-neutral-900">Focus Ring: </span>
                            <span className={stop.visibleFocus ? "text-emerald-700 font-semibold" : "text-rose-600 font-semibold"}>
                              {stop.visibleFocus ? "Verified visible" : "Unverified / Suppressed"}
                            </span>
                          </div>

                          {stop.observations && (
                            <p className="mt-1 text-[11px] text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200 leading-snug">
                              Observation: {stop.observations}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Unreachable Controls Callout */}
              {currentJourney.unreachableControlsCount > 0 && (
                <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/60 text-xs">
                  <div className="flex items-center gap-2 text-amber-950 font-bold mb-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px]">!</span>
                    <span>{currentJourney.unreachableControlsCount} Keyboard-Unreachable Dropdown Links</span>
                  </div>
                  <p className="text-amber-900 leading-relaxed">
                    The &ldquo;Scholarship Types&rdquo; submenu (<code className="font-mono font-bold">#undergrad</code>, <code className="font-mono font-bold">#postgrad</code>, <code className="font-mono font-bold">#doctoral</code>) is implemented with CSS <code className="font-mono">:hover</code> and lacks keyboard focusability.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
