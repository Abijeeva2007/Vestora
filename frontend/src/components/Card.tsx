import type { ReactNode } from "react";

/** Reusable content card. */
export function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 ${className}`.trim()}
    >
      {title ? (
        <h2 className="mb-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      ) : null}
      <div className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">{children}</div>
    </section>
  );
}
