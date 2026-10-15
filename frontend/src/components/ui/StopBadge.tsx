interface StopBadgeProps {
  number: number;
  label?: string;
  isTrap?: boolean;
}

export function StopBadge({ number, label, isTrap }: StopBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
          isTrap
            ? "bg-rose-600 text-white"
            : "bg-neutral-900 text-white"
        }`}
        aria-hidden="true"
      >
        {number}
      </span>
      {label && <span className="text-sm font-medium text-neutral-900">{label}</span>}
    </div>
  );
}
