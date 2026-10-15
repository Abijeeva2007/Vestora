import Link from "next/link";
import { Container } from "./Container";

/** Site header with a placeholder brand mark. */
export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-black/70">
      <Container className="flex h-14 items-center justify-between">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          Vestora
        </Link>
        <span className="text-xs text-zinc-500">BYTEATHON 2026</span>
      </Container>
    </header>
  );
}
