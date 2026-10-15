import { chromium } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const routes = [
  "/",
  "/audits",
  "/issues",
  "/journeys",
  "/focus-map",
  "/fix-review",
  "/verification",
  "/automation"
];

async function runDashboardAxe() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });

  const results = {};

  for (const r of routes) {
    const context = await browser.newContext();
    const page = await context.newPage();
    try {
      await page.goto(`${BASE_URL}${r}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      const axeResult = await new AxeBuilder({ page }).analyze();
      results[r] = {
        violationsCount: axeResult.violations.length,
        violations: axeResult.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodesCount: v.nodes.length,
          target: v.nodes.slice(0, 2).map((n) => n.target)
        }))
      };
      console.log(`Route ${r}: ${axeResult.violations.length} violations`);
      for (const v of results[r].violations) {
        console.log(`  - [${v.impact}] ${v.id}: ${v.description} (${v.nodesCount} nodes)`);
      }
    } catch (err) {
      console.log(`Route ${r}: Error ${err.message}`);
      results[r] = { error: err.message };
    }
    await page.close();
    await context.close();
  }

  await browser.close();
  return results;
}

runDashboardAxe();
