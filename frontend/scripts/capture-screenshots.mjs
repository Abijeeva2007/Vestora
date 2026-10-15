import { chromium } from "playwright";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUT_DIR = join(process.cwd(), "..", "docs", "screenshots");

if (!existsSync(OUT_DIR)) {
  mkdirSync(OUT_DIR, { recursive: true });
}

const routes = [
  { name: "01-dashboard.png", path: "/" },
  { name: "02-audits.png", path: "/audits" },
  { name: "03-issues.png", path: "/issues" },
  { name: "04-journeys.png", path: "/journeys" },
  { name: "05-focus-map.png", path: "/focus-map" },
  { name: "06-fix-review.png", path: "/fix-review" },
  { name: "07-verification.png", path: "/verification" },
  { name: "08-automation.png", path: "/automation" },
  { name: "09-demo-target.png", path: "/demo" },
];

async function capture() {
  console.log("Launching Chromium for screenshot capture...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  for (const r of routes) {
    const url = `${BASE_URL}${r.path}`;
    console.log(`Capturing ${r.name} from ${url}...`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(1000);
      const targetPath = join(OUT_DIR, r.name);
      await page.screenshot({ path: targetPath, fullPage: false });
      console.log(`Saved ${targetPath}`);
    } catch (err) {
      console.error(`Failed to capture ${r.name}:`, err.message);
    }
  }

  await browser.close();
  console.log("Screenshot capture complete.");
}

capture().catch((err) => {
  console.error("Capture process error:", err);
  process.exit(1);
});
