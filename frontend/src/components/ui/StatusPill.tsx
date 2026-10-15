export type StatusType = "pass" | "fail" | "warning" | "unavailable" | "running";

interface StatusPillProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md";
}

export function StatusPill({ status, label, size = "md" }: StatusPillProps) {
  const configs: Record<
    StatusType,
    { text: string; bg: string; border: string; color: string; dot: string }
  > = {
    pass: {
      text: label || "Passed",
      bg: "bg-neutral-100",
      border: "border-neutral-200",
      color: "text-neutral-900",
      dot: "bg-emerald-500",
    },
    fail: {
      text: label || "Failed",
      bg: "bg-neutral-100",
      border: "border-neutral-200",
      color: "text-neutral-900",
      dot: "bg-rose-500",
    },
    warning: {
      text: label || "Warning",
      bg: "bg-neutral-100",
      border: "border-neutral-200",
      color: "text-neutral-900",
      dot: "bg-amber-500",
    },
    unavailable: {
      text: label || "Unavailable",
      bg: "bg-neutral-100",
      border: "border-neutral-200",
      color: "text-neutral-500",
      dot: "bg-neutral-400",
    },
    running: {
      text: label || "Scanning...",
      bg: "bg-neutral-900",
      border: "border-neutral-900",
      color: "text-white",
      dot: "bg-emerald-400 animate-pulse",
    },
  };

  const cfg = configs[status];
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${cfg.bg} ${cfg.border} ${cfg.color} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} aria-hidden="true" />
      <span>{cfg.text}</span>
    </span>
  );
}
