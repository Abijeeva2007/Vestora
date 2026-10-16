"use client";

import React from "react";

interface AiBadgeProps {
  label?: string;
}

export function AiBadge({ label = "AI-suggested, needs review" }: AiBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-purple-700 bg-purple-50/80 border border-dashed border-purple-400">
      <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-200/90 text-purple-900 px-1 py-0.2 rounded font-mono">
        AI-written
      </span>
      <span>{label}</span>
    </span>
  );
}
