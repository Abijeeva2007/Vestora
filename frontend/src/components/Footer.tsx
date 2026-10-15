import { Container } from "./Container";

/** Site footer. */
export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-6 dark:border-zinc-800">
      <Container className="flex flex-col items-center justify-between gap-2 text-xs text-zinc-500 sm:flex-row">
        <span>BYTEATHON 2026 starter</span>
        <span>Next.js + FastAPI</span>
      </Container>
    </footer>
  );
}
