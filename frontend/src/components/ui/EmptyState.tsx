interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label="No data"
      className="p-12 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-center flex flex-col items-center justify-center my-6"
    >
      <div className="w-12 h-12 rounded-full border border-neutral-300 bg-white flex items-center justify-center mb-4 shadow-xs">
        <div className="w-3.5 h-3.5 rounded-full bg-neutral-900" />
      </div>
      <h3 className="text-lg font-semibold text-neutral-950 mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-600 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
