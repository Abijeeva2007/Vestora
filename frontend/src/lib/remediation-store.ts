"use client";

import { create } from "zustand";
import type {
  FixProposal,
  FixReceipt,
  RemediationState,
} from "@/types";

interface RemediationStoreState {
  proposals: FixProposal[];
  activePatches: string[];
  version: number;
  originalChecksum: string;
  latestReceipt: FixReceipt | null;
  isApplying: boolean;
  applyingFixId: string | null;
  isRollingBack: boolean;
  error: string | null;
  successMessage: string | null;
  hasLoadedInitial: boolean;

  fetchRemediationData: () => Promise<void>;
  applyFix: (fixId: string) => Promise<FixReceipt | null>;
  rollbackFix: (rollbackToken?: string) => Promise<boolean>;
  resetAll: () => Promise<void>;
  clearNotifications: () => void;
}

export const useRemediationStore = create<RemediationStoreState>((set, get) => ({
  proposals: [],
  activePatches: [],
  version: 0,
  originalChecksum: "",
  latestReceipt: null,
  isApplying: false,
  applyingFixId: null,
  isRollingBack: false,
  error: null,
  successMessage: null,
  hasLoadedInitial: false,

  clearNotifications: () => set({ error: null, successMessage: null }),

  fetchRemediationData: async () => {
    try {
      const res = await fetch("/api/remediation");
      if (res.ok) {
        const data = await res.json();
        set({
          proposals: data.proposals || [],
          activePatches: data.state?.activePatches || [],
          version: data.state?.version || 0,
          originalChecksum: data.state?.originalChecksum || "",
          latestReceipt: data.latestReceipt || null,
          hasLoadedInitial: true,
        });
      }
    } catch (err) {
      console.error("Failed to fetch remediation data:", err);
    }
  },

  applyFix: async (fixId: string) => {
    set({ isApplying: true, applyingFixId: fixId, error: null, successMessage: null });

    try {
      const res = await fetch("/api/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "apply", fixId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to apply fix.");
      }

      set({
        isApplying: false,
        applyingFixId: null,
        activePatches: data.state?.activePatches || [],
        version: data.state?.version || 0,
        latestReceipt: data.receipt || null,
        successMessage: `Fix successfully applied and verified via axe-core & Playwright! (Receipt: ${data.receipt?.receiptId})`,
      });

      await get().fetchRemediationData();
      return data.receipt as FixReceipt;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Patch application failed.";
      set({
        isApplying: false,
        applyingFixId: null,
        error: message,
      });
      return null;
    }
  },

  rollbackFix: async (rollbackToken?: string) => {
    set({ isRollingBack: true, error: null, successMessage: null });

    try {
      const res = await fetch("/api/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rollback", rollbackToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Rollback failed.");
      }

      set({
        isRollingBack: false,
        activePatches: data.state?.activePatches || [],
        version: data.state?.version || 0,
        successMessage: `Rollback successful. Restored version ${data.restoredVersion}.`,
      });

      await get().fetchRemediationData();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rollback failed.";
      set({
        isRollingBack: false,
        error: message,
      });
      return false;
    }
  },

  resetAll: async () => {
    set({ isRollingBack: true, error: null, successMessage: null });
    try {
      const res = await fetch("/api/remediation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      if (res.ok) {
        const data = await res.json();
        set({
          isRollingBack: false,
          activePatches: [],
          version: data.state?.version || 0,
          latestReceipt: null,
          successMessage: "All patches reset to pristine baseline state.",
        });
        await get().fetchRemediationData();
      }
    } catch {
      set({ isRollingBack: false });
    }
  },
}));
