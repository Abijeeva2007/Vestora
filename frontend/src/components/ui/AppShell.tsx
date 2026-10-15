"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuditStore } from "@/lib/audit-store";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/audits", label: "Audits" },
  { href: "/issues", label: "Issues" },
  { href: "/journeys", label: "Journeys" },
  { href: "/focus-map", label: "Focus Map" },
  { href: "/fix-review", label: "Fix Review" },
  { href: "/verification", label: "Verification" },
  { href: "/automation", label: "Automation" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isRunning, runAudit } = useAuditStore();

  // If on /demo, render full screen demo page without dashboard frame
  if (pathname.startsWith("/demo")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#EBECEF] p-2 sm:p-4 md:p-6 lg:p-8 flex flex-col justify-start text-[#0A0A0A] font-sans">
      {/* Accessible Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Main Framed Canvas */}
      <div className="w-full max-w-[1480px] mx-auto bg-[#FFFFFF] rounded-[22px] sm:rounded-[36px] md:rounded-[40px] border border-neutral-300/80 shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-4 sm:p-7 md:p-10 flex flex-col min-h-[calc(100vh-3rem)]">
        
        {/* Top Editorial Navigation Bar */}
        <header className="flex items-center justify-between gap-4 border-b border-neutral-100 pb-5 md:pb-6">
          {/* Brand & Platform Stats */}
          <div className="flex items-center gap-5 sm:gap-7">
            <Link
              href="/"
              className="flex items-center gap-2 group text-neutral-950 hover:opacity-80 transition-opacity"
              aria-label="AccessAble AI Home"
            >
              <span className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                AccessAble<span className="font-light text-neutral-400">.ai</span>
              </span>
            </Link>

            {/* Metadata tags beside logo */}
            <div className="hidden lg:flex items-center gap-5 pl-4 border-l border-neutral-200 text-xs">
              <div>
                <p className="font-bold text-neutral-900 leading-none">Automated</p>
                <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">Rule Checks</p>
              </div>
              <div>
                <p className="font-bold text-neutral-900 leading-none">Playwright</p>
                <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">Journey Engine</p>
              </div>
            </div>
          </div>

          {/* Desktop Centered Navigation */}
          <nav className="hidden xl:flex items-center gap-1 bg-neutral-100/70 p-1.5 rounded-full border border-neutral-200/60" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-neutral-950 shadow-xs"
                      : "text-neutral-600 hover:text-neutral-950 hover:bg-white/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Pills */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/demo"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-full border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Demo Target</span>
              <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>

            <button
              type="button"
              onClick={runAudit}
              disabled={isRunning}
              className="px-4 py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
            >
              {isRunning ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  <span>Run Audit</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              type="button"
              onClick={runAudit}
              disabled={isRunning}
              className="sm:hidden px-3 py-1.5 rounded-full bg-neutral-950 text-white text-xs font-semibold"
            >
              {isRunning ? "Scanning..." : "Scan"}
            </button>
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="p-2 rounded-full border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile Slide-down / Overlay Drawer */}
        {mobileOpen && (
          <div
            className="xl:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          >
            <nav
              aria-label="Mobile Navigation"
              className="w-72 max-w-[85vw] h-full bg-white p-6 flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
                  <span className="font-black text-lg">AccessAble.ai</span>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100"
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>
                <ul className="space-y-1.5 mt-6" role="list">
                  {NAV_ITEMS.map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                            active
                              ? "bg-neutral-950 text-white"
                              : "text-neutral-700 hover:bg-neutral-100"
                          }`}
                        >
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="pt-6 border-t border-neutral-200 space-y-2">
                <Link
                  href="/demo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center py-2.5 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-900 hover:bg-neutral-50"
                >
                  Open Demo Target ↗
                </Link>
                <p className="text-[11px] text-neutral-400 text-center">
                  BYTEATHON 2026 • Problem BYTE03
                </p>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content Area */}
        <main id="main-content" className="flex-1 w-full pt-6 md:pt-8">
          {children}
        </main>

        {/* Minimalist Editorial Footer */}
        <footer className="mt-12 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="font-medium text-neutral-800">Playwright & axe-core Runtime: Active</span>
          </div>
          <p className="font-medium">
            AccessAble AI • Autonomous Accessibility Remediation Pipeline • BYTEATHON 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
