import type { ReactNode } from "react";

/** Centered page wrapper with consistent horizontal padding. */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 ${className}`.trim()}>
      {children}
    </div>
  );
}
