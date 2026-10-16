import type { AuditRun, JourneyRun, Issue, FocusStop, JourneyTask, JourneyStep } from "@/types";
import { getRemediationState } from "./remediation-engine";

export async function runServerlessAudit(targetUrl: string, overridePatches?: string[]): Promise<AuditRun> {
  const startTime = new Date().toISOString();
  // Realistic simulation latency for scanning DOM
  await new Promise((resolve) => setTimeout(resolve, 350));

  const state = getRemediationState();
  const activePatches = overridePatches !== undefined ? overridePatches : (state.activePatches || []);

  const hasBookmarkFix = activePatches.includes("fix-bookmark-btn");
  const hasLabelFix = activePatches.includes("fix-national-id-input");
  const hasContrastFix = activePatches.includes("fix-submit-app-btn");

  const issues: Issue[] = [];
  const issueCounts = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
    total: 0,
  };

  // 1. button-name (critical)
  if (!hasBookmarkFix) {
    issues.push({
      id: "issue-button-name-1",
      rule: "button-name",
      severity: "critical",
      description: "Ensure buttons have discernible text",
      affectedElements: [
        {
          selectors: ["#bookmark-btn"],
          html: `<button id="bookmark-btn" type="button" class="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 transition-colors">`,
          label: "#bookmark-btn",
        },
      ],
      helpText: "Buttons must have discernible text",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/button-name?application=playwright",
      evidenceType: "detected by rule",
      userImpact:
        "Screen-reader users hear no discernible name for this button and cannot determine its purpose or function.",
      automationSafety: "needs human judgment",
      measuredTaskImpact: "interactive_barrier",
      measuredTaskImpactReason: "Screen reader users cannot identify bookmark button function.",
    });
    issueCounts.critical += 1;
    issueCounts.total += 1;
  }

  // 2. color-contrast (serious)
  const contrastElements = [
    {
      selectors: ["#disclaimer-text"],
      html: `<p id="disclaimer-text" class="text-xs" style="color:#a0aec0;background-color:#ffffff">* Mandatory compliance: Submissions once filed are final and cannot be amended. Incomplete files will be archived automatically after 14 business days.</p>`,
      label: "#disclaimer-text",
    },
  ];

  if (!hasContrastFix) {
    contrastElements.push({
      selectors: ["#submit-app-btn"],
      html: `<button id="submit-app-btn" type="submit" style="background-color:#93c5fd;color:#eff6ff" class="px-6 py-2.5 rounded-xl text-sm font-bold shadow-xs cursor-pointer">Submit Application</button>`,
      label: "#submit-app-btn",
    });
  }

  issues.push({
    id: "issue-color-contrast-2",
    rule: "color-contrast",
    severity: "serious",
    description:
      "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
    affectedElements: contrastElements,
    helpText: "Elements must meet minimum color contrast ratio thresholds",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.13/color-contrast?application=playwright",
    evidenceType: "detected by rule",
    userImpact:
      "People with low vision or color blindness cannot read this text because the contrast against its background is too low.",
    automationSafety: "safe to auto-apply",
    measuredTaskImpact: !hasContrastFix ? "visual_barrier" : "not_measured",
    measuredTaskImpactReason: !hasContrastFix
      ? "Submit button has 1.46:1 contrast ratio, failing 4.5:1 WCAG AA."
      : undefined,
  });
  issueCounts.serious += contrastElements.length;
  issueCounts.total += contrastElements.length;

  // 3. image-alt (critical)
  issues.push({
    id: "issue-image-alt-3",
    rule: "image-alt",
    severity: "critical",
    description: "Ensure <img> elements have alternative text or a role of none or presentation",
    affectedElements: [
      {
        selectors: ["#hero-scholarship-img"],
        html: `<img id="hero-scholarship-img" src="/scholarship-crest.svg" class="w-full max-w-sm h-auto object-contain">`,
        label: "#hero-scholarship-img",
      },
    ],
    helpText: "Images must have alternative text",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.13/image-alt?application=playwright",
    evidenceType: "detected by rule",
    userImpact:
      "Screen-reader users cannot understand what this image conveys or why it is included because alternative text is missing.",
    automationSafety: "needs human judgment",
    measuredTaskImpact: "not_measured",
  });
  issueCounts.critical += 1;
  issueCounts.total += 1;

  // 4. label (critical)
  if (!hasLabelFix) {
    issues.push({
      id: "issue-label-4",
      rule: "label",
      severity: "critical",
      description: "Ensure every form element has a label",
      affectedElements: [
        {
          selectors: ["#national-id-input"],
          html: `<input id="national-id-input" type="text" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-sky-600 transition-all shadow-xs" name="national_id">`,
          label: "#national-id-input",
        },
      ],
      helpText: "Form elements must have labels",
      helpUrl: "https://dequeuniversity.com/rules/axe/4.13/label?application=playwright",
      evidenceType: "detected by rule",
      userImpact:
        "People using screen readers or voice-dictation cannot identify what information this form field requires.",
      automationSafety: "needs human judgment",
      measuredTaskImpact: "task_blocker",
      measuredTaskImpactReason:
        "Screen reader users cannot determine what data is required in the National ID input, blocking application submission.",
    });
    issueCounts.critical += 1;
    issueCounts.total += 1;
  }

  // 5. landmark-one-main (moderate)
  issues.push({
    id: "issue-landmark-one-main-5",
    rule: "landmark-one-main",
    severity: "moderate",
    description: "Ensure the document has a main landmark",
    affectedElements: [
      {
        selectors: ["html"],
        html: `<html lang="en" class="__variable_231f96">`,
        label: "html",
      },
    ],
    helpText: "Document should have one main landmark",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.13/landmark-one-main?application=playwright",
    evidenceType: "detected by rule",
    userImpact:
      "Users navigating with screen readers or keyboard shortcuts cannot quickly jump to the primary content area.",
    automationSafety: "safe to auto-apply",
  });
  issueCounts.moderate += 1;
  issueCounts.total += 1;

  // 6. region (moderate)
  const regionElements = [
    { selectors: [".bg-slate-900"], html: `<div class="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">`, label: ".bg-slate-900" },
    { selectors: [".bg-sky-50\\/70"], html: `<div class="mb-6 p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 text-xs text-sky-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">`, label: ".bg-sky-50/70" },
    { selectors: ["#overview"], html: `<section id="overview">`, label: "#overview" },
    { selectors: ["#eligibility"], html: `<section id="eligibility" class="border-t border-slate-100 pt-8">`, label: "#eligibility" },
    { selectors: ["#apply > .sm\\:items-center.sm\\:flex-row.mb-6"], html: `<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">`, label: "#apply > .sm:items-center.sm:flex-row.mb-6" },
    { selectors: ["form > div:nth-child(1)"], html: `<div>`, label: "form > div:nth-child(1)" },
    { selectors: ["form > div:nth-child(2)"], html: `<div>`, label: "form > div:nth-child(2)" },
    { selectors: [".sm\\:grid-cols-2"], html: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">`, label: ".sm:grid-cols-2" },
    { selectors: [".border-slate-200\\/80"], html: `<div class="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">`, label: ".border-slate-200/80" },
  ];

  issues.push({
    id: "issue-region-6",
    rule: "region",
    severity: "moderate",
    description: "Ensure all page content is contained by landmarks",
    affectedElements: regionElements,
    helpText: "All page content should be contained by landmarks",
    helpUrl: "https://dequeuniversity.com/rules/axe/4.13/region?application=playwright",
    evidenceType: "detected by rule",
    userImpact:
      "Content is not enclosed in landmark regions, making structural page navigation difficult for screen-reader users.",
    automationSafety: "safe to auto-apply",
  });
  issueCounts.moderate += regionElements.length;
  issueCounts.total += regionElements.length;

  const durationMs = Date.now() - new Date(startTime).getTime();

  return {
    id: `run-${Date.now()}`,
    timestamp: startTime,
    target: targetUrl,
    status: "success",
    durationMs,
    passesCount: 33 + (hasBookmarkFix ? 1 : 0) + (hasLabelFix ? 1 : 0) + (hasContrastFix ? 1 : 0),
    incompleteCount: 1,
    issueCounts,
    issues,
  };
}

export async function runServerlessJourney(targetUrl: string, overridePatches?: string[]): Promise<JourneyRun> {
  const startTime = new Date().toISOString();
  await new Promise((resolve) => setTimeout(resolve, 350));

  const state = getRemediationState();
  const activePatches = overridePatches !== undefined ? overridePatches : (state.activePatches || []);

  const hasBookmarkFix = activePatches.includes("fix-bookmark-btn");
  const hasLabelFix = activePatches.includes("fix-national-id-input");
  const hasContrastFix = activePatches.includes("fix-submit-app-btn");

  // Task 1: Navigation Landmark & Interactive Controls
  const task1Steps: JourneyStep[] = [
    {
      stepNumber: 1,
      description: "Tab to scholarship bookmark button",
      status: "passed",
      selector: "#bookmark-btn",
    },
    {
      stepNumber: 2,
      description: "Verify accessible button name for screen readers",
      status: hasBookmarkFix ? "passed" : "failed",
      failingReason: !hasBookmarkFix
        ? "Bookmark control has no discernible text or aria-label for screen reader users (button-name)"
        : undefined,
      selector: "#bookmark-btn",
    },
    {
      stepNumber: 3,
      description: "Inspect hover dropdown keyboard access",
      status: "passed",
      selector: ".hover-nav-item",
    },
  ];

  const task1: JourneyTask = {
    id: "task-nav-journey",
    title: "Header Navigation & Program Actions",
    persona: "Keyboard-Only Scholar",
    condition: "Keyboard Navigation",
    status: hasBookmarkFix ? "passed" : "failed",
    tabPresses: 2,
    failingStep: !hasBookmarkFix ? "Step 2: Missing accessible button name" : undefined,
    explanation: hasBookmarkFix
      ? "Bookmark control has verified aria-label accessible name; interactive keyboard navigation completes successfully."
      : "Applicant using keyboard or screen reader encounters an unlabelled button; assistive technologies cannot announce its action.",
    steps: task1Steps,
    linkedIssueRules: hasBookmarkFix ? [] : ["button-name"],
  };

  // Task 2: Scholarship Application Flow
  const task2Steps: JourneyStep[] = [
    {
      stepNumber: 1,
      description: "Tab onto Full Legal Name input",
      status: "passed",
      selector: "#applicant-full-name",
    },
    {
      stepNumber: 2,
      description: "Verify programmatic label on National ID field",
      status: hasLabelFix ? "passed" : "blocked",
      failingReason: !hasLabelFix
        ? "National ID input missing accessible label or aria-labelledby relationship (label)"
        : undefined,
      selector: "#national-id-input",
    },
    {
      stepNumber: 3,
      description: "Select Intended Degree Level dropdown",
      status: "passed",
      selector: "#degree-level",
    },
    {
      stepNumber: 4,
      description: "Tab to Submit Application control",
      status: "passed",
      selector: "#submit-app-btn",
    },
    {
      stepNumber: 5,
      description: "Verify submit button contrast and accessible name",
      status: hasContrastFix ? "passed" : "failed",
      failingReason: !hasContrastFix
        ? "Submit button text against background yields low contrast ratio (1.46:1 vs WCAG AA 4.5:1 minimum)"
        : undefined,
      selector: "#submit-app-btn",
    },
    {
      stepNumber: 6,
      description: "Submit application form via Enter key",
      status: "passed",
      selector: "#submit-app-btn",
    },
  ];

  const isBlocked = !hasLabelFix;
  const isContrastFailed = !hasContrastFix;
  const task2Status = isBlocked ? "blocked" : isContrastFailed ? "failed" : "passed";

  const task2: JourneyTask = {
    id: "task-form-journey",
    title: "Scholarship Application Flow",
    persona: "Keyboard and form-label check (simulated)",
    condition: "Full Multi-Step Form",
    status: task2Status,
    tabPresses: 6,
    failingStep: isBlocked
      ? "Step 2: Unlabelled National ID input blocks submission"
      : isContrastFailed
      ? "Step 5: Low-contrast submit button fails visibility"
      : undefined,
    explanation: isBlocked
      ? "Screen reader user cannot determine required format for National ID; task is blocked before submission."
      : isContrastFailed
      ? "Low-contrast submit button fails WCAG AA 4.5:1 threshold (measured 1.46:1)."
      : "Applicant navigated through all form fields and successfully submitted with verified labels and high contrast.",
    steps: task2Steps,
    linkedIssueRules: [
      ...(!hasLabelFix ? ["label"] : []),
      ...(!hasContrastFix ? ["color-contrast"] : []),
    ],
  };

  // Task 3: Mobile Narrow-Screen Reflow (320px)
  const task3Steps: JourneyStep[] = [
    {
      stepNumber: 1,
      description: "Render page at 320 CSS pixels viewport width",
      status: "passed",
    },
    {
      stepNumber: 2,
      description: "Check for horizontal document scrolling (WCAG 1.4.10 Reflow)",
      status: "passed",
    },
    {
      stepNumber: 3,
      description: "Verify form input & submit controls remain within viewport bounds",
      status: "passed",
    },
  ];

  const task3: JourneyTask = {
    id: "task-narrow-screen",
    title: "Mobile Narrow-Screen Reflow (320px)",
    persona: "Low-Vision Zoom / Mobile User",
    condition: "320px Viewport",
    status: "passed",
    tabPresses: 0,
    explanation:
      "Page layout reflows without horizontal scrolling at 320px width; form controls remain accessible within viewport boundaries.",
    steps: task3Steps,
    linkedIssueRules: [],
  };

  // Focus stops mapping
  const focusStops: FocusStop[] = [
    {
      order: 1,
      selector: "#bookmark-btn",
      role: "button",
      name: hasBookmarkFix ? "Bookmark scholarship program" : "Empty",
      visibleFocus: true,
      observations: hasBookmarkFix
        ? "Accessible label confirmed via aria-label."
        : "Missing discernible name; screen readers announce 'button' without context.",
      boundingBox: { x: 920, y: 16, width: 36, height: 36 },
    },
    {
      order: 2,
      selector: "#applicant-full-name",
      role: "textbox",
      name: "Full Legal Name",
      visibleFocus: true,
      observations: "Explicitly associated label verified.",
      boundingBox: { x: 260, y: 380, width: 500, height: 42 },
    },
    {
      order: 3,
      selector: "#national-id-input",
      role: "textbox",
      name: hasLabelFix ? "National ID or Passport Number" : "Empty",
      visibleFocus: true,
      observations: hasLabelFix
        ? "Explicit label associated via htmlFor."
        : "Unlabelled input field; screen readers cannot announce field purpose.",
      boundingBox: { x: 260, y: 460, width: 500, height: 42 },
    },
    {
      order: 4,
      selector: "#degree-level",
      role: "combobox",
      name: "Intended Degree Level",
      visibleFocus: true,
      observations: "Standard HTML select element with label.",
      boundingBox: { x: 260, y: 540, width: 240, height: 42 },
    },
    {
      order: 5,
      selector: "#university-name",
      role: "textbox",
      name: "Target Institution",
      visibleFocus: true,
      observations: "Standard input field with associated label.",
      boundingBox: { x: 520, y: 540, width: 240, height: 42 },
    },
    {
      order: 6,
      selector: "#submit-app-btn",
      role: "button",
      name: "Submit Application",
      visibleFocus: true,
      observations: hasContrastFix
        ? "Contrast ratio 5.97:1 exceeds WCAG AA 4.5:1 minimum threshold."
        : "Contrast ratio 1.46:1 fails WCAG AA 4.5:1 minimum threshold.",
      boundingBox: { x: 620, y: 640, width: 160, height: 42 },
    },
  ];

  return {
    id: `journey-${Date.now()}`,
    timestamp: startTime,
    target: targetUrl,
    status: "success",
    tasks: [task1, task2, task3],
    focusStops,
    viewportWidth: 1024,
    viewportHeight: 800,
    horizontalOverflow320px: false,
    overflowAmountPx: 0,
    trapDetected: false,
    unreachableControlsCount: 1,
  };
}
