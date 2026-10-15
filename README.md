# AccessAble AI — The Invisible Barrier (BYTEATHON 2026)

> **Problem Statement BYTE03: “The Invisible Barrier”**  
> AI-assisted accessibility remediation and verification platform that detects programmatic barriers, tests whether users with disabilities can complete real tasks, safely applies allowlisted fixes through a pre-commit safety gate, and issues cryptographically verifiable compliance receipts.

[![Integration Tests](https://img.shields.io/badge/tests-18%20passed-emerald)](frontend/tests)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.1-black)](https://nextjs.org/)
[![Playwright](https://img.shields.io/badge/Playwright-Chromium-45ba4b)](https://playwright.dev/)
[![axe-core](https://img.shields.io/badge/axe--core-4.13-blue)](https://www.deque.com/axe/)
[![n8n Compatible](https://img.shields.io/badge/n8n-Workflow%20Ready-ea4b71)](accessable-n8n-workflow.json)

---

## 1. Why AccessAble AI?

Traditional accessibility linters only detect syntactic rule violations (e.g., missing labels or low contrast) but cannot tell you whether a user can actually finish an application form. Conversely, manual audits don't scale to fast-moving pull requests.

**AccessAble AI introduces a dual-engine paradigm:**
1. **Automated Rule Engine (`/api/audit`)**: Headless Chromium + `axe-core` sweeps the DOM to detect programmatic WCAG 2.1 AA violations.
2. **User Journey & Focus Engine (`/api/journeys`)**: Playwright runs multi-step browser tasks under simulated assistive conditions (Keyboard-only sighted navigation, Screen reader / Keyboard applicant flow, and 320px viewport reflow).
3. **Safe Remediation Pipeline (`/api/remediation`)**: Allowlisted, deterministic patches with pre-commit safety gates (strict selector matching, visible text preservation, zero side-effect verification, and cryptographic rollback tokens).
4. **Verifiable Receipts (`/verification`)**: SHA-256 baseline checksums, before/after violation comparisons, and downloadable JSON fix receipts.
5. **Continuous n8n Automation (`/api/automation/webhook`)**: Orchestrates PR checks and blocks regressions before code hits production.

---

## 2. System Architecture & Routes

```
AccessAble AI
├── /                 Overview dashboard & live barrier breakdown
├── /audits           Automated axe-core + Chromium scanner
├── /issues           Prioritized issue explorer & User Task Impact Matrix
├── /journeys         Real Playwright multi-step task evaluations
├── /focus-map        Interactive visual keyboard tab-order overlay
├── /fix-review       Allowlist patch inspector & safety gate verification
├── /verification     Cryptographic fix receipts & chronological timeline
├── /automation       n8n webhook gateway & CI/CD trigger tester
└── /demo             Controlled scholarship portal testing target
```

### Server API Endpoints

- `GET /api/audit` & `POST /api/audit`: Executes headless Chromium axe-core scan on verified demo target with strict SSRF protection.
- `GET /api/journeys` & `POST /api/journeys`: Launches Playwright journey test scenarios, captures full-page screenshot, and calculates sequential tab stops.
- `GET /api/remediation` & `POST /api/remediation`: Evaluates safety gates, applies sandbox patches (`apply`), rolls back versions (`rollback`), and restores baselines (`reset`).
- `GET /api/automation/webhook` & `POST /api/automation/webhook`: Validates incoming webhooks with optional `N8N_WEBHOOK_SECRET` header, triggers scans/journeys, and returns verifiable execution receipts.

---

## 3. The Controlled Demo Target (`/demo`)

The `/demo` route renders an authentic **Global Leaders Fellowship 2026** portal containing 4 controlled accessibility barriers:

| Barrier Hook | Element Selector | axe-core Rule | Measured Journey Impact | Supported Patch |
| :--- | :--- | :--- | :--- | :--- |
| **Hook 1** | `#bookmark-btn` | `button-name` | Unnamed icon button spoken as "(none)" | `fix-bookmark-btn` |
| **Hook 2** | `#national-id-input` | `label` | **Task Blocker**: Halted at Step 2; screen reader user receives no prompt | `fix-national-id-input` |
| **Hook 3** | `#submit-app-btn` | `color-contrast` | 1.46:1 contrast ratio (fails WCAG AA 4.5:1 minimum) | `fix-submit-app-btn` |
| **Hook 4** | `.hover-menu a` | Interactive Barrier | 3 submenu links bypassed during keyboard sequential navigation | N/A (Observed) |

---

## 4. Quick Start & Prerequisites

### Prerequisites
- Node.js 20+ (tested on Node v20 & v26)
- npm

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
```

### 3. Run Test Suite
```bash
npm test
```
*Executes all 18 unit, integration, and webhook security tests across 7 suites.*

### 4. Build for Production
```bash
npm run build
```
*Compiles all 9 routes and API endpoints cleanly using Webpack.*

### 5. Launch Server
```bash
npm start
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 5. Judge Demonstration Flow (Step-by-Step)

1. **Step 1 — Baseline Inspection**:
   - Visit `http://localhost:3000/demo` to see the fellowship application target.
   - Visit `http://localhost:3000/audits` and click **Start Audit**. View detected violations and scan duration.
2. **Step 2 — Journey Testing**:
   - Navigate to `http://localhost:3000/journeys` and click **Run Journey Tests**.
   - Notice Scenario 2 (*Scholarship Application Flow*) is **BLOCKED at Step 2** because `#national-id-input` has no programmatic label.
3. **Step 3 — Visual Focus Map**:
   - Open `http://localhost:3000/focus-map` to inspect the full-page screenshot overlay with numbered tab stops and red indicators on controls missing accessible names.
4. **Step 4 — User Task Impact Matrix**:
   - Open `http://localhost:3000/issues` and view the **User Task Impact Matrix**, which prioritizes the `#national-id-input` task blocker ahead of visual styling issues.
5. **Step 5 — Safe Remediation**:
   - Open `http://localhost:3000/fix-review`. Select `fix-national-id-input`.
   - Inspect the patch diff, visible text preservation check, and pre-commit safety gate.
   - Click **Apply Fix & Re-Verify**.
6. **Step 6 — Cryptographic Verification Receipt**:
   - Open `http://localhost:3000/verification`.
   - Inspect the **Chronological Evidence Timeline** showing the complete 7-stage lifecycle (`Audit → Finding → Patch → Safety Gate → Sandbox Application → Re-Scan → Receipt Issued`).
   - Click **Export JSON Fix Receipt** to download `accessable-fix-receipt-*.json`.
   - Click **Rollback Fix** to demonstrate instant reversion to baseline.
7. **Step 7 — n8n CI/CD Webhook Gateway**:
   - Navigate to `http://localhost:3000/automation`.
   - Click **Test Local Endpoint (`/api/automation/webhook`)** to execute a live test request and view the server execution receipt.
   - Click **Download .json** to obtain `accessable-n8n-workflow.json`.

---

## 6. Security & Guardrails

- **Strict SSRF Protection**: Scanner endpoints enforce local origin matching and only allow testing the `/demo` target route.
- **Pre-Commit Safety Gate**: Rejects unapproved DOM modifications, protects against CSS layout destruction, and ensures visible text remains unchanged.
- **Rollback Tokens**: Every state modification generates a rollback snapshot with sequential version tracking.
- **Webhook HMAC Secret Verification**: Validates `x-n8n-secret` and `Authorization: Bearer` headers on incoming webhook requests.
