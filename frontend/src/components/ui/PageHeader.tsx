export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-neutral-200/80 pb-6">
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-1.5">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-950">
          {title}
        </h1>
        <p className="mt-1.5 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-3xl">
          {description}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
