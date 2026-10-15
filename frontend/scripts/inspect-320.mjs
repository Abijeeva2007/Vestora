import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const routes = [
  "/",
  "/audits",
  "/issues",
  "/journeys",
  "/focus-map",
  "/fix-review",
  "/verification",
  "/automation",
  "/demo",
  "/demo/sandbox"
];

async function inspect() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"]
  });

  for (const r of routes) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 320, height: 640 });
    try {
      await page.goto(`${BASE_URL}${r}`, { waitUntil: "domcontentloaded", timeout: 10000 });
      const overflowData = await page.evaluate(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const overflowingElements = [];

        const all = document.querySelectorAll("*");
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 320 || rect.right > 320) {
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              id: el.id,
              className: el.className ? String(el.className).slice(0, 80) : "",
              width: Math.round(rect.width),
              right: Math.round(rect.right),
              text: el.innerText ? el.innerText.slice(0, 40) : ""
            });
          }
        }
        return {
          docScrollWidth,
          bodyScrollWidth,
          hasOverflow: docScrollWidth > 320,
          overflowingCount: overflowingElements.length,
          topOverflowing: overflowingElements.slice(0, 8)
        };
      });

      console.log(`Route: ${r} -> docScrollWidth: ${overflowData.docScrollWidth}px (hasOverflow: ${overflowData.hasOverflow})`);
      if (overflowData.hasOverflow) {
        console.log("  Top overflowing elements:");
        for (const el of overflowData.topOverflowing) {
          console.log(`    <${el.tag} id="${el.id}" class="${el.className}"> width: ${el.width}px, right: ${el.right}px`);
        }
      }
    } catch (err) {
      console.log(`Route: ${r} -> ERR: ${err.message}`);
    }
    await page.close();
  }

  await browser.close();
}

inspect();
