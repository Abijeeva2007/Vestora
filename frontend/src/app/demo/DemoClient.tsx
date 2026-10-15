"use client";

/**
 * AccessAble AI — Realistic Scholarship Portal Demo Target
 * Route: /demo
 *
 * Implements a realistic fellowship & scholarship application portal for the
 * Global Leaders & Research Council 2026. Deliberately includes 4 controlled
 * WCAG 2.1 AA barriers for automated axe-core & Playwright journey testing:
 *   1. Icon button without accessible name: #bookmark-btn (axe: button-name)
 *   2. Image missing alt attribute: #hero-scholarship-img (axe: image-alt)
 *   3. Input lacking programmatic label: #national-id-input (axe: label)
 *   4. Low-contrast submit button: #submit-app-btn (axe: color-contrast)
 *   5. Hover-only submenu links: .hover-nav-item .hover-menu (journey: unreachable controls)
 */

interface DemoClientProps {
  activePatches?: string[];
}

export default function DemoClient({ activePatches = [] }: DemoClientProps) {
  const hasBookmarkFix = activePatches.includes("fix-bookmark-btn");
  const hasLabelFix = activePatches.includes("fix-national-id-input");
  const hasContrastFix = activePatches.includes("fix-submit-app-btn");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased pb-20">
      {/* Top institution bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-medium text-slate-200">Global Leaders Fellowship Program 2026</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Department of Higher Education &amp; Research</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Cycle: Cohort Fall 2026</span>
            <span>Ref: GLF-9024-AA</span>
            <span className="text-amber-300 font-medium">Deadline: Nov 30, 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Remediation Status Banner if patches are active */}
        {activePatches.length > 0 ? (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                ✓
              </span>
              <div>
                <p className="font-semibold text-emerald-950">
                  Active Remediation Patches Applied ({activePatches.length})
                </p>
                <p className="text-emerald-700 text-[11px]">
                  Sandbox patches active: {activePatches.join(", ")}. Changes can be audited or rolled back at any time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Patched State
              </span>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white font-bold text-xs">
                !
              </span>
              <div>
                <p className="font-semibold text-sky-950">
                  AccessAble AI Controlled Testing Target
                </p>
                <p className="text-sky-800 text-[11px]">
                  This portal contains intentional accessibility barriers (unnamed icon button, unlabeled ID field, low contrast submit button, hover-only dropdown navigation) for testing.
                </p>
              </div>
            </div>
            <span className="bg-sky-100 text-sky-800 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Baseline Mode
            </span>
          </div>
        )}

        {/* Main Portal Container */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Header */}
          <header className="p-6 sm:p-8 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold mb-3">
                  <span>Admissions Cycle 2026/27</span>
                  <span>•</span>
                  <span>Full Funding + Research Grant</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Global Leaders Fellowship 2026
                </h1>
                <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                  Supporting exceptional scholars worldwide pursuing graduate and doctoral research in science, public leadership, and global development.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                >
                  Print Guide
                </button>

                {/* HOOK 1: #bookmark-btn */}
                {hasBookmarkFix ? (
                  <button
                    id="bookmark-btn"
                    type="button"
                    aria-label="Bookmark scholarship program"
                    title="Bookmark scholarship program"
                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                ) : (
                  <button
                    id="bookmark-btn"
                    type="button"
                    className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Navigation with HOOK 4: Hover-only dropdown navigation */}
            <nav className="mt-8 flex flex-wrap items-center gap-6 text-sm font-medium border-t border-slate-100 pt-5" aria-label="Portal Navigation">
              <a href="#overview" className="text-sky-700 hover:text-sky-900 hover:underline">
                Overview
              </a>

              {/* Hover-only dropdown (barrier for keyboard users) */}
              <div className="relative hover-nav-item group">
                <span
                  tabIndex={-1}
                  className="text-slate-600 group-hover:text-slate-900 cursor-pointer inline-flex items-center gap-1 select-none py-1"
                >
                  Scholarship Types <span className="text-[10px]">▼</span>
                </span>
                <style>{`
                  .hover-nav-item .hover-menu { display: none; }
                  .hover-nav-item:hover .hover-menu { display: block; }
                `}</style>
                <div className="hover-menu absolute left-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-2">
                  <a href="#undergrad" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                    Undergraduate Grant
                  </a>
                  <a href="#postgrad" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                    Postgraduate Fellowship
                  </a>
                  <a href="#doctoral" className="block px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                    Doctoral Research Award
                  </a>
                </div>
              </div>

              <a href="#eligibility" className="text-slate-600 hover:text-slate-900 hover:underline">
                Eligibility
              </a>
              <a href="#apply" className="text-slate-600 hover:text-slate-900 hover:underline">
                Application Form
              </a>
              <a href="#contact" className="text-slate-600 hover:text-slate-900 hover:underline">
                Contact &amp; Support
              </a>
            </nav>
          </header>

          <div className="p-6 sm:p-8 space-y-10">
            {/* Program Overview & Hero */}
            <section id="overview">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Program Overview</h2>
                <span className="text-xs text-slate-500 font-mono">Grant Value: $45,000 / Year</span>
              </div>

              {/* HOOK 2: Image without alt attribute */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6 flex flex-col items-center justify-center mb-6">
                <img
                  id="hero-scholarship-img"
                  src="/scholarship-crest.svg"
                  className="w-full max-w-sm h-auto object-contain"
                />
              </div>

              <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
                The Global Leaders Fellowship provides full educational coverage, stipend allowances, and international research grants for outstanding applicants accepted into participating graduate institutions. Awardees join an international community of scholars committed to civic transformation.
              </p>
            </section>

            {/* Eligibility Highlights Grid */}
            <section id="eligibility" className="border-t border-slate-100 pt-8">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight mb-4">Eligibility Criteria</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs mb-3">
                    01
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Academic Distinction</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Minimum GPA of 3.5 / 4.0 or equivalent first-class honors in your qualifying degree program.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs mb-3">
                    02
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Research Proposal</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    A 1,000-word statement demonstrating clear scholarly inquiry and social utility.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center text-xs mb-3">
                    03
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Institutional Endorsement</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Two formal recommendations from academic supervisors or accredited faculty members.
                  </p>
                </div>
              </div>
            </section>

            {/* Candidate Application Form */}
            <section id="apply" className="border-t border-slate-100 pt-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Candidate Application Form</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Complete your candidate profile to file for scholarship assessment.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">Step 1 of 3:</span>
                  <span>Identity &amp; Credentials</span>
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {/* Properly labeled field (tested in journey runner) */}
                <div>
                  <label htmlFor="applicant-full-name" className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Full Legal Name
                  </label>
                  <input
                    id="applicant-full-name"
                    type="text"
                    defaultValue="Alex Mercer"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all shadow-xs"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Enter your name exactly as it appears on your passport or official national identity record.
                  </p>
                </div>

                {/* HOOK 3: #national-id-input */}
                {hasLabelFix ? (
                  <div>
                    <label htmlFor="national-id-input" className="block text-sm font-semibold text-slate-900 mb-1.5">
                      National ID or Passport Number
                    </label>
                    <input
                      id="national-id-input"
                      type="text"
                      name="national_id"
                      placeholder="e.g. A12345678"
                      aria-required="true"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all shadow-xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Programmatically associated label verified by screen reader speech engine.
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="block text-sm font-semibold text-slate-900 mb-1.5">
                      National ID or Passport Number
                    </span>
                    <input
                      id="national-id-input"
                      type="text"
                      name="national_id"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all shadow-xs"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter your government-issued identification number for credentials verification.
                    </p>
                  </div>
                )}

                {/* Additional realistic portal fields (well-labeled) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="degree-level" className="block text-sm font-semibold text-slate-900 mb-1.5">
                      Intended Degree Level
                    </label>
                    <select
                      id="degree-level"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all shadow-xs"
                    >
                      <option>Master of Science / Engineering</option>
                      <option>Doctor of Philosophy (PhD)</option>
                      <option>Postdoctoral Fellowship</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="university-name" className="block text-sm font-semibold text-slate-900 mb-1.5">
                      Target Institution
                    </label>
                    <input
                      id="university-name"
                      type="text"
                      defaultValue="Oxford Institute of Technology"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* HOOK 5: Low-contrast notice text */}
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <p
                    id="disclaimer-text"
                    className="text-xs"
                    style={{ color: "#a0aec0", backgroundColor: "#ffffff" }}
                  >
                    * Mandatory compliance: Submissions once filed are final and cannot be amended. Incomplete files will be archived automatically after 14 business days.
                  </p>
                </div>

                {/* Action buttons with HOOK 4: #submit-app-btn */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Save Draft
                  </button>

                  {hasContrastFix ? (
                    <button
                      id="submit-app-btn"
                      type="submit"
                      style={{ backgroundColor: "#0369A1", color: "#ffffff" }}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs cursor-pointer hover:bg-[#0284C7] transition-colors focus:ring-2 focus:ring-sky-600 focus:outline-none"
                    >
                      Submit Application
                    </button>
                  ) : (
                    <button
                      id="submit-app-btn"
                      type="submit"
                      style={{ backgroundColor: "#93c5fd", color: "#eff6ff" }}
                      className="px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs cursor-pointer"
                    >
                      Submit Application
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>

          {/* Footer */}
          <footer className="text-xs text-slate-500 text-center border-t border-slate-100 py-6 px-4 bg-slate-50/50">
            <p>© 2026 Global Education &amp; Research Fund. All rights reserved. AccessAble AI Controlled Evaluation Target.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
