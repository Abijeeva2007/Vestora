"use client";

import { create } from "zustand";
import type { AuditRun } from "@/types";

interface AuditStore {
  currentRun: AuditRun | null;
  isRunning: boolean;
  error: string | null;
  hasLoadedInitial: boolean;
  publicScanEnabled: boolean;
  fetchLatestRun: () => Promise<void>;
  runAudit: (targetUrl?: unknown) => Promise<void>;
  clearError: () => void;
}

export const useAuditStore = create<AuditStore>((set, get) => ({
  currentRun: null,
  isRunning: false,
  error: null,
  hasLoadedInitial: false,
  publicScanEnabled: false,

  clearError: () => set({ error: null }),

  fetchLatestRun: async () => {
    if (get().hasLoadedInitial) return;
    try {
      const res = await fetch("/api/audit");
      if (res.ok) {
        const data = await res.json();
        set({
          currentRun: data.latestRun || null,
          publicScanEnabled: Boolean(data.publicScanEnabled),
          hasLoadedInitial: true,
        });
        return;
      }
    } catch {}
    set({ hasLoadedInitial: true });
  },

  runAudit: async (targetUrl?: unknown) => {
    if (get().isRunning) return;
    set({ isRunning: true, error: null });

    try {
      const validUrl = typeof targetUrl === "string" && targetUrl.trim() !== "" ? targetUrl.trim() : undefined;
      const payload = validUrl ? { targetUrl: validUrl } : {};
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || data.errorMessage || `Audit failed with status ${res.status}`);
      }

      set({
        currentRun: data as AuditRun,
        isRunning: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred while executing the audit.";
      set({
        error: message,
        isRunning: false,
      });
    }
  },
}));
