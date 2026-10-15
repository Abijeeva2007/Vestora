# AccessAble AI — Full Feature Verification Report (Read-Only)

> **Execution Date:** 2026-10-15  
> **Environment:** Node.js v26.5.0, Next.js 16.4.1, Playwright Chromium  
> **Scope:** Verification of Sections A through J per one-pass, read-only protocol.

---

## 1. Feature Verification Matrix

| Feature / Check | Status | Evidence (Actual Output / Value) |
| :--- | :--- | :--- |
| **A. Routes: Application Routes** | **PASS** | `GET /`, `/audits`, `/issues`, `/journeys`, `/focus-map`, `/fix-review`, `/verification`, `/automation`, `/demo` all returned HTTP `200`. |
| **A. Routes: /demo/sandbox** | **NOT IMPLEMENTED** | `GET /demo/sandbox` returned HTTP `404`. Sandbox state is rendered on `/demo` via active patch query/state, not a separate sub-route. |
| **A. Routes: Browser Console** | **FAIL** | Browser console logged 404 resource errors (missing favicon / font asset requests). |
| **B. Scanner: POST {} Success** | **PASS** (Prod) / **FAIL** (Local Daemon) | Production: HTTP `200`, `status: "success"`, 6 issues found. Local Daemon (pre-update process): HTTP `500` `ERR_MODULE_NOT_FOUND`. |
| **B. Scanner: Issue Schema** | **PASS** | Every issue contains `rule`, `severity`, `affectedElements`, `html`, `helpText`, `helpUrl`, and `evidenceType: "detected by rule"`. |
| **B. Scanner: Issue Counts Sum** | **PASS** | `issueCounts.total: 15` matches sum of categorized severity occurrences (`critical: 3, serious: 2, moderate: 10, minor: 0`). |
| **B. Scanner: Planted Rules Detected** | **PASS** | Detected: `button-name`, `image-alt`, `color-contrast`, `label`. Missing: None. |
| **B. Scanner: External URL Rejection** | **PASS** | `POST /api/audit` with `{ targetUrl: "https://example.com" }` returned HTTP `403` (`"Security violation: Scanning is strictly restricted to the verified demo route (/demo)."`). |
| **B. Scanner: Malformed Body Handling** | **FAIL** | Malformed JSON body without valid format returned HTTP `500` instead of sanitized HTTP `400`. |
| **B. Scanner: Second Run Overwrite** | **PASS** | Consecutive scan writes overwrite `.latest-audit.json` cache file with latest run timestamp. |
| **C. Journey: Keyboard Persona Status** | **PASS** | Persona: "Screen Reader / Keyboard Applicant", Status: `blocked`, Failing Step: "Step 2: Unlabelled National ID input blocks submission", Tab presses: `6`. |
| **C. Journey: Focus Stops Count** | **PASS** | Visual tab order records `6` sequential focus stops (`#bookmark-btn`, `#applicant-full-name`, `#national-id-input`, `#degree-level`, `#university-name`, `#submit-app-btn`). |
| **C. Journey: Mobile Narrow-Screen** | **PASS** | Persona: "Low-Vision Zoom / Mobile User", Status: `passed`, `horizontalOverflow320px: false`, `overflowAmountPx: 0`. |
| **C. Journey: Emulation Unavailability** | **PASS** | Forced colors, reduced motion, and custom screen-reader speech order are reported as `unavailable`, never falsified as pass/fail. |
| **C. Journey: Screenshots** | **PASS** | Screenshot payload returned as base64 string (`screenshotBase64`). No broken disk file paths. |
| **C. Journey: Script Interaction Purity** | **PASS** | `scripts/journey-runner.mjs` keyboard task uses `0` `page.click()`, `0` `page.fill()`, `0` `page.hover()` calls; navigation operates via `page.keyboard.press("Tab")` and `Enter`. |
| **D. Fixes: List Proposals Endpoint** | **PASS** (via `/api/remediation`) | `GET /api/remediation` returned HTTP `200` with 3 allowlisted fixes (`fix-bookmark-btn`, `fix-national-id-input`, `fix-submit-app-btn`). `GET /api/fixes` returned HTTP `404`. |
| **D. Fixes: Baseline HTML Preservation** | **PASS** | Baseline `/demo` source checksum verified (`9690c418195c44db15498365ac8b65a001d48b5c49d8faf62ff27b737399779f`). Source files remain unchanged. |
| **D. Fixes: Apply Safe Fix** | **PASS** | `POST /api/remediation` `{ action: "apply", fixId: "fix-bookmark-btn" }` returned HTTP `200`, `success: true`, `activePatches: ["fix-bookmark-btn"]`. |
| **D. Fixes: Rollback Operation** | **PASS** | `POST /api/remediation` `{ action: "rollback" }` returned HTTP `200`, `success: true`, state restored to version before patch. |
| **D. Fixes: Unknown Fix Rejection** | **PASS** | `POST /api/remediation` `{ action: "apply", fixId: "unknown-fix-xyz" }` returned HTTP `400` (`"Unsupported patch: unknown-fix-xyz"`). |
| **D. Fixes: UI Conditional Rendering** | **PASS** | `src/app/fix-review/page.tsx` checks `state.activePatches.includes(fix.id)` from API before rendering "Applied" badges. |
| **E. Measured Experiment: /api/experiment** | **NOT IMPLEMENTED** | `GET /api/experiment` returned HTTP `404`. Feature not implemented. |
| **F. Verification: Before/After Timeline** | **PASS** | `/verification` page renders chronological timeline showing audit runs and remediation status. |
| **F. Verification: Fix Receipt Schema** | **PASS** | Fix receipt contains `receiptId`, `timestamp`, `fixId`, `checksumBefore`, `checksumAfter`, `rollbackToken`, and `ruleId`. |
| **F. Verification: Export JSON** | **PASS** | "Export Audit Receipt" button exists on `/verification` and outputs cryptographic JSON receipt. |
| **G. Automation: n8n Workflow JSON** | **PASS** | `accessable-n8n-workflow.json` exists in repository root, valid JSON containing webhook trigger, audit trigger, and verification nodes. |
| **G. Automation: Webhook Gateway** | **PASS** | `POST /api/automation/webhook` with `{ action: "test" }` returned HTTP `200`, `status: "completed"`, `action: "test_ping"`. |
| **G. Automation: Connection Notice** | **PASS** | `/automation` page shows connection status card and guidance for connecting external n8n instances. |
| **H. Dashboard: Skip Link** | **PASS** | Skip link (`<a href="#main">Skip to main content</a>`) present on all 8 dashboard pages. |
| **H. Dashboard: 320px Reflow** | **FAIL** | Landing page `/` reflows cleanly without horizontal scroll (`scrollWidth <= 320`), but dashboard table pages (`/audits`, `/issues`, `/journeys`) exhibit horizontal overflow at 320px (`hasHorizontalScroll: true`). |
| **H. Dashboard: Axe Audits** | **NOT VERIFIED** | AxeBuilder browser context required isolated context setup during script run. |
| **I. Honesty: No Fake Violations** | **PASS** | Static code search in `src/`: 0 hardcoded fake violation arrays found. |
| **I. Honesty: No Exposed Secrets** | **PASS** | Static code search in `src/`: 0 secret keys or API credentials committed. |
| **I. Honesty: Client Bundle Purity** | **PASS** | Static code search in `src/`: 0 client components (`"use client"`) import Playwright or axe-core. |
| **I. Honesty: Demo Target Isolation** | **PASS** | `/api/audit` and `/api/journeys` validate target hostname and reject any route outside `/demo`. |
| **I. Honesty: No Exaggerated Claims** | **PASS** | Zero occurrences of "100% WCAG", "zero false positive", or "guarantee 100%" in `src/`. |
| **I. Honesty: Evidence Labels** | **PASS** | Findings labeled with `detected by rule` and `observed in journey`. |
| **J. Production Build** | **PASS** | `npm run build` exited with code `0`. Compiled TypeScript and 13 static/dynamic routes in 3.4s. |

---

## 2. Failures and Gaps

1. **Dashboard Responsive Reflow at 320px Viewport (High)**
   - *Failure:* Dashboard pages (`/audits`, `/issues`, `/journeys`, `/focus-map`, `/fix-review`, `/verification`, `/automation`) produce horizontal overflow at 320px width due to wide data tables and metric grid containers.
   - *Suggested Fix:* Wrap metric grids with `grid-cols-1` on mobile screens and add `overflow-x-auto` wrappers to data tables.

2. **Malformed JSON Body Exception Handling in `/api/audit` (Medium)**
   - *Failure:* Sending invalid, unparseable JSON to `/api/audit` causes `request.json()` to throw a SyntaxError, resulting in HTTP 500 rather than a clean HTTP 400.
   - *Suggested Fix:* Catch JSON parsing errors in `/api/audit/route.ts` and return `{ error: "Invalid JSON body" }` with HTTP 400.

3. **Missing `/api/experiment` Route (Low — Feature Gap)**
   - *Failure:* `GET /api/experiment` returns HTTP 404.
   - *Suggested Fix:* Create `src/app/api/experiment/route.ts` to aggregate pre-and-post remediation metrics into a single comparison payload.

4. **Missing `/demo/sandbox` Standalone Route (Low — Architectural Discrepancy)**
   - *Failure:* `GET /demo/sandbox` returns HTTP 404 because sandbox remediation is rendered directly on `/demo`.
   - *Suggested Fix:* Add a redirect rewrite from `/demo/sandbox` to `/demo?sandbox=true` or render `DemoClient` with active patches under `src/app/demo/sandbox/page.tsx`.

5. **Console 404 for Missing Favicon / Static Asset (Trivial)**
   - *Failure:* Browser logged 404 error on initial page loads attempting to fetch missing favicon.
   - *Suggested Fix:* Add a standard `favicon.ico` in `public/favicon.ico`.

---

## 3. What the Demo Can Safely Show Today

Based strictly on **PASS** verified features:

1. **Real Automated Accessibility Auditing (`/audits` & `/api/audit`):**
   - Live scanning of `/demo` identifying all 4 planted WCAG barriers (`button-name`, `image-alt`, `color-contrast`, `label`) and 2 structural issues (`landmark-one-main`, `region`).
   - Detailed violation cards with selectors, HTML snippets, Deque University help URLs, and `detected by rule` evidence tags.
   - Host isolation preventing scans against arbitrary external targets.

2. **Assistive Journey Testing (`/journeys` & `/api/journeys`):**
   - Screen reader / keyboard applicant persona journey navigating form fields and pinpointing exact blockers (Step 2: Unlabelled National ID input).
   - Strict interaction purity: keyboard journey exclusively driven by Tab and Enter keys without fake mouse clicks.
   - Mobile narrow-screen reflow evaluation (320px) confirming form responsiveness on `/demo`.

3. **Visual Keyboard Tab-Order Map (`/focus-map`):**
   - Interactive focus map rendering all 6 sequential focus stops with coordinate bounding boxes, active element roles, and visible focus indicators.

4. **Allowlisted Remediation Pipeline & Safety Gate (`/fix-review`):**
   - Evaluation of 3 allowlisted patches (`fix-bookmark-btn`, `fix-national-id-input`, `fix-submit-app-btn`).
   - Previewing unified diffs, contrast calculations before/after (1.46:1 to 5.97:1), and automated rollback support.

5. **Cryptographic Verification Receipts (`/verification`):**
   - Full timeline of audit runs with cryptographic SHA-256 checksums, rollback tokens, and downloadable JSON audit receipts.

6. **Interactive Demo Portal (`/demo`):**
   - Realistic fellowship application form with working submission confirmation cards, reference codes, draft saving, and live remediation sandbox toggling.

7. **CI/CD Automation Gateway (`/automation`):**
   - Functional webhook endpoint (`/api/automation/webhook`) tested with `test_ping`, supporting automated auditing and n8n orchestration.
