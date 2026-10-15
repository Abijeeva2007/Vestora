"use client";

import { create } from "zustand";
import type { JourneyRun } from "@/types";

interface JourneyStore {
  currentJourney: JourneyRun | null;
  isRunning: boolean;
  error: string | null;
  hasLoadedInitial: boolean;
  fetchLatestJourney: () => Promise<void>;
  runJourneyTests: () => Promise<void>;
  clearError: () => void;
}

export const useJourneyStore = create<JourneyStore>((set, get) => ({
  currentJourney: null,
  isRunning: false,
  error: null,
  hasLoadedInitial: false,

  clearError: () => set({ error: null }),

  fetchLatestJourney: async () => {
    if (get().hasLoadedInitial) return;
    try {
      const res = await fetch("/api/journeys");
      if (res.ok) {
        const data = await res.json();
        if (data.latestRun) {
          set({ currentJourney: data.latestRun, hasLoadedInitial: true });
          return;
        }
      }
    } catch {}
    set({ hasLoadedInitial: true });
  },

  runJourneyTests: async () => {
    if (get().isRunning) return;
    set({ isRunning: true, error: null });

    try {
      const res = await fetch("/api/journeys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.errorMessage || `Journey test failed with status ${res.status}`);
      }

      set({
        currentJourney: data as JourneyRun,
        isRunning: false,
        error: null,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred during journey testing.";
      set({
        error: message,
        isRunning: false,
      });
    }
  },
}));
