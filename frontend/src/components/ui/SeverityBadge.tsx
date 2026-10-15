import type { Severity } from "@/types";

interface SeverityBadgeProps {
  severity: Severity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  const styles: Record<Severity, { label: string; bg: string; text: string; dot: string; border: string }> = {
    critical: {
      label: "Critical",
      bg: "bg-rose-50",
      text: "text-rose-950 font-semibold",
      dot: "bg-rose-600",
      border: "border-rose-200",
    },
    serious: {
      label: "Serious",
      bg: "bg-amber-50",
      text: "text-amber-950 font-semibold",
      dot: "bg-amber-600",
      border: "border-amber-200",
    },
    moderate: {
      label: "Moderate",
      bg: "bg-neutral-100",
      text: "text-neutral-800",
      dot: "bg-neutral-500",
      border: "border-neutral-200",
    },
    minor: {
      label: "Minor",
      bg: "bg-neutral-50",
      text: "text-neutral-600",
      dot: "bg-neutral-400",
      border: "border-neutral-200",
    },
  };

  const current = styles[severity] || styles.minor;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${current.bg} ${current.text} ${current.border}`}
      aria-label={`Severity: ${current.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} aria-hidden="true" />
      <span>{current.label}</span>
    </span>
  );
}
