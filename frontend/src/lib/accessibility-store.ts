"use client";

import { create } from "zustand";
import type { ScanResultData } from "@/components/shared-types";

type LastResult =
  | { status: "idle" }
  | { status: "running"; scannedUrl: string }
  | { status: "success"; data: ScanResultData; scannedUrl: string; scannedAt: string }
  | { status: "empty"; scannedUrl: string; scannedAt: string }
  | { status: "error"; error: string; scannedUrl: string; scannedAt: string };

function isNonIdle(r: LastResult): r is Exclude<LastResult, { status: "idle" }> {
  return r.status !== "idle";
}

function filterNonIdle(results: LastResult[]): LastResult[] {
  return results.filter(isNonIdle);
}

const STORE_KEY = "vestora-accessibility-store";

function loadStore(): { sampleMode: boolean; results: LastResult[] } | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      sampleMode: boolean;
      results: LastResult[];
    } | null;
    return parsed && typeof parsed.sampleMode === "boolean" && Array.isArray(parsed.results)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function saveStore(state: { sampleMode: boolean; results: LastResult[] }) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {}
}

export interface AccessibilityStoreReturn {
  sampleMode: boolean;
  results: LastResult[];
  setSampleMode: (next: boolean | ((v: boolean) => boolean)) => void;
  runAudit: () => Promise<void>;
  cancelAudit: () => void;
}

export const useAccessibilityStore = create<AccessibilityStoreReturn>()((set, get) => {
  const initial = loadStore() ?? { sampleMode: false, results: [{ status: "idle" }] };
  set(initial);

  return {
    ...initial,
    setSampleMode(next) {
      set((state) => {
        const nextMode =
          typeof next === "function" ? next(state.sampleMode) : next;
        saveStore({ sampleMode: nextMode, results: state.results });
        return { sampleMode: nextMode };
      });
    },
    runAudit: async function () {
      set((state) => ({
        results: [
          ...state.results,
          { status: "running" as const, scannedUrl: "http://localhost:3000/demo" },
        ],
      }));

      try {
        const response = await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sampleMode: get().sampleMode }),
        });

        if (!response.ok) {
          const text = await response
            .text()
            .catch(() => "The audit request failed.");
          throw new Error(
            text || `Audit request failed with status ${response.status}`,
          );
        }

        const data: ScanResultData = await response.json();
        const scannedAt = new Date().toISOString();
        const scannedUrl = "http://localhost:3000/demo";

        if (data.totalIssues === 0) {
          set((state) => {
            const next = {
              ...state,
              results: [
                ...filterNonIdle(state.results),
                { status: "empty" as const, scannedUrl, scannedAt },
              ],
            };
            saveStore({ sampleMode: state.sampleMode, results: next.results });
            return next;
          });
          return;
        }

        set((state) => {
          const next = {
            ...state,
            results: [
              ...filterNonIdle(state.results),
              { status: "success" as const, data, scannedUrl, scannedAt },
            ],
          };
          saveStore({ sampleMode: state.sampleMode, results: next.results });
          return next;
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while running the audit.";
        set((state) => {
          const next = {
            ...state,
            results: [
              ...filterNonIdle(state.results),
              {
                status: "error" as const,
                error: message,
                scannedUrl: "http://localhost:3000/demo",
                scannedAt: new Date().toISOString(),
              },
            ],
          };
          saveStore({ sampleMode: state.sampleMode, results: next.results });
          return next;
        });
      }
    },
    cancelAudit() {
      set((state) => {
        const next = {
          ...state,
          results: [
            ...filterNonIdle(state.results),
            { status: "idle" as const },
          ],
        };
        saveStore({ sampleMode: state.sampleMode, results: next.results });
        return next;
      });
    },
  };
});

export type { ScanResultData } from "@/components/shared-types";
