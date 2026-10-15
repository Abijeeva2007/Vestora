interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Audit Failed",
  message,
  retryLabel = "Dismiss & Retry",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="p-6 rounded-2xl border border-rose-200 bg-rose-50/50 text-left my-6"
    >
      <div className="flex items-start gap-3.5">
        <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-rose-950">{title}</h3>
          <p className="text-sm text-neutral-700 mt-1 leading-relaxed">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
