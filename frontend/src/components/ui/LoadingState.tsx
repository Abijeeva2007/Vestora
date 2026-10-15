interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Running axe-core scan on Chromium...",
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="p-12 rounded-2xl border border-neutral-200 bg-neutral-50/50 text-center flex flex-col items-center justify-center my-6"
    >
      <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mb-4" />
      <h3 className="text-base font-semibold text-neutral-900">{message}</h3>
      <p className="text-xs text-neutral-500 mt-1 max-w-sm">
        Testing elements, color contrast, accessible names, and DOM structure.
      </p>
    </div>
  );
}
