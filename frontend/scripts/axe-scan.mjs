/**
 * AccessAble AI — axe-core accessibility scanner.
 * Standalone Node.js script executed by the /api/audit route handler.
 */

import { chromium } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const USER_IMPACT_MAP = {
  "color-contrast": "People with low vision or color blindness cannot read this text because the contrast against its background is too low.",
  "image-alt": "Screen-reader users cannot understand what this image conveys or why it is included because alternative text is missing.",
  "label": "People using screen readers or voice-dictation cannot identify what information this form field requires.",
  "button-name": "Screen-reader users hear no discernible name for this button and cannot determine its purpose or function.",
  "html-has-lang": "Assistive technologies cannot determine the document language, potentially reading text with incorrect speech synthesizer pronunciation.",
  "landmark-one-main": "Users navigating with screen readers or keyboard shortcuts cannot quickly jump to the primary content area.",
  "link-name": "Users of assistive technologies cannot tell where this link leads because discernible text is missing.",
  "region": "Content is not enclosed in landmark regions, making structural page navigation difficult for screen-reader users."
};

function getUserImpact(ruleId) {
  return (
    USER_IMPACT_MAP[ruleId] ||
    "Users relying on assistive technologies or keyboard navigation experience barriers interacting with this element."
  );
}

function normalizeSeverity(impact) {
  if (impact === "critical" || impact === "serious" || impact === "moderate" || impact === "minor") {
    return impact;
  }
  return "minor";
}

async function runScan(targetUrl) {
  let browser = null;
  const startTime = new Date().toISOString();
  let timedOut = false;

  const HARD_TIMEOUT_MS = 20000;
  const timer = setTimeout(async () => {
    timedOut = true;
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    const errRun = {
      id: `run-err-${Date.now()}`,
      timestamp: startTime,
      target: targetUrl,
      status: "error",
      durationMs: HARD_TIMEOUT_MS,
      passesCount: 0,
      incompleteCount: 0,
      issueCounts: { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 },
      issues: [],
      errorMessage: "Hard timeout exceeded (20s)"
    };
    process.stdout.write(JSON.stringify(errRun) + "\n");
    process.exit(1);
  }, HARD_TIMEOUT_MS);

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
    });

    const context = await browser.newContext({
      acceptDownloads: false
    });
    const page = await context.newPage();

    page.on("popup", (p) => p.close().catch(() => {}));

    let targetOrigin = "";
    try {
      targetOrigin = new URL(targetUrl).origin;
    } catch {}

    await page.route("**/*", (route) => {
      try {
        const reqUrl = new URL(route.request().url());
        if (
          !targetOrigin ||
          reqUrl.origin === targetOrigin ||
          reqUrl.protocol === "data:" ||
          reqUrl.protocol === "blob:"
        ) {
          route.continue();
        } else {
          route.abort();
        }
      } catch {
        route.abort();
      }
    });

    // Navigate to local target with timeout
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    try {
      await page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {}

    // Execute axe analysis
    const results = await new AxeBuilder({ page }).analyze();

    const issues = [];
    const issueCounts = {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
      total: 0
    };

    (results.violations || []).forEach((violation, vIdx) => {
      const severity = normalizeSeverity(violation.impact);

      const affectedElements = (violation.nodes || []).map((node) => {
        const selectors = Array.isArray(node.target) ? node.target : [String(node.target)];
        const html = typeof node.html === "string" ? node.html : String(node.html || "");
        return {
          selectors,
          html: html.slice(0, 500),
          label: selectors.join(", ") || "element"
        };
      });

      // Count each affected element instance as an issue occurrence
      const count = affectedElements.length > 0 ? affectedElements.length : 1;
      issueCounts[severity] += count;
      issueCounts.total += count;

      issues.push({
        id: `issue-${violation.id}-${vIdx + 1}`,
        rule: violation.id,
        severity,
        description: violation.description || "",
        affectedElements,
        helpText: violation.help || "",
        helpUrl: violation.helpUrl || "",
        evidenceType: "detected by rule",
        userImpact: getUserImpact(violation.id),
        automationSafety:
          severity === "critical"
            ? "needs human judgment"
            : violation.id === "image-alt"
            ? "needs human judgment"
            : "safe to auto-apply"
      });
    });

    const durationMs = Date.now() - new Date(startTime).getTime();
    const passesCount = (results.passes || []).length;
    const incompleteCount = (results.incomplete || []).length;

    const auditRun = {
      id: `run-${Date.now()}`,
      timestamp: startTime,
      target: targetUrl,
      status: "success",
      durationMs,
      passesCount,
      incompleteCount,
      issueCounts,
      issues
    };

    process.stdout.write(JSON.stringify(auditRun) + "\n");
  } catch (error) {
    if (timedOut) return;
    const durationMs = Date.now() - new Date(startTime).getTime();
    const errRun = {
      id: `run-err-${Date.now()}`,
      timestamp: startTime,
      target: targetUrl,
      status: "error",
      durationMs,
      passesCount: 0,
      incompleteCount: 0,
      issueCounts: { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 },
      issues: [],
      errorMessage: error instanceof Error ? error.message : "Scanning failed"
    };
    process.stdout.write(JSON.stringify(errRun) + "\n");
  } finally {
    clearTimeout(timer);
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

const target = process.argv[2] || process.env.TARGET_URL || "http://localhost:3000/demo";
runScan(target);
