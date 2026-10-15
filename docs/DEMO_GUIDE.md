# AccessAble AI — 5-Minute Judge Demonstration Guide

> **BYTEATHON 2026 Round 2 — Problem Statement BYTE03: “The Invisible Barrier”**  
> **Repository:** [https://github.com/Abijeeva2007/Vestora](https://github.com/Abijeeva2007/Vestora)  
> **Target Audience:** Technical Judges, Accessibility Leads, and Evaluation Panel  
> **Presentation Duration:** Exactly 5 Minutes  

---

## Quick Reference Route Map

| Stage | Time | Route | Core Concept Demonstrated |
|:---:|:---:|:---|:---|
| **1** | 0:00 – 0:45 | [`/demo`](http://localhost:3000/demo) | The Problem: Controlled real-world barriers on a scholarship portal |
| **2** | 0:45 – 1:30 | [`/audits`](http://localhost:3000/audits) | Automated Detection: axe-core + Chromium DOM violation sweep |
| **3** | 1:30 – 2:30 | [`/journeys`](http://localhost:3000/journeys) & [`/focus-map`](http://localhost:3000/focus-map) | User Journey Impact: Simulated assistive tasks & visual tab order |
| **4** | 2:30 – 3:15 | [`/issues`](http://localhost:3000/issues) | Prioritization: User Task Impact Matrix separating blockers from noise |
| **5** | 3:15 – 4:15 | [`/fix-review`](http://localhost:3000/fix-review) | Safe Remediation: Pre-commit safety gate with allowlisted diffs |
| **6** | 4:15 – 4:45 | [`/verification`](http://localhost:3000/verification) | Verification: Audit receipts with SHA-256 integrity checksums & rollback |
| **7** | 4:45 – 5:00 | [`/automation`](http://localhost:3000/automation) | CI/CD Integration: Webhook gateway & ready-to-import n8n workflow |

---

## Detailed Step-by-Step Script

### Stage 1: The Invisible Barrier in Action (0:00 – 0:45)
- **Route to Open:** `http://localhost:3000/demo`
- **Action to Perform:**
  1. Open the page and briefly scroll through the **Global Leaders Fellowship Program 2026** portal.
  2. Press <kbd>Tab</kbd> to demonstrate keyboard navigation.
  3. Point out the bookmark icon button, the National ID input, and the light-blue Submit Application button.
- **Expected Observation:**
  - The bookmark icon has no visible name.
  - The National ID input has visible helper text above it, but no programmatic `<label>` tag.
  - The submit button text `#eff6ff` on `#93c5fd` has very low visual contrast (1.46:1).
- **Key Sentence for Judges:**
  > *"Traditional linters see code syntax, but users experience task barriers. On this scholarship portal, an applicant using a screen reader is completely blocked at the National ID input because there is no programmatic association between the label and the field."*

---

### Stage 2: Automated axe-core Audit (0:45 – 1:30)
- **Route to Open:** `http://localhost:3000/audits`
- **Action to Perform:**
  1. Click the **Start Audit** button (or view the pre-scanned results).
  2. Observe the real-time progress indicator and final report card.
- **Expected Observation:**
  - Fast execution (~850ms) via headless Chromium + axe-core 4.13.
  - Breakdown: 14 total issues detected (2 Critical, 2 Serious, 10 Moderate).
  - Specific rules flagged: `label` (`#national-id-input`), `color-contrast` (`#submit-app-btn`), and `image-alt`.
- **Key Sentence for Judges:**
  > *"AccessAble AI runs genuine axe-core rules against real browser DOM in under one second, capturing raw element selectors, failure summaries, and WCAG criteria without external dependencies."*

---

### Stage 3: Real User Journeys & Visual Focus Map (1:30 – 2:30)
- **Routes to Open:** `http://localhost:3000/journeys` then `http://localhost:3000/focus-map`
- **Action to Perform:**
  1. On `/journeys`, click **Run Journey Tests** (or inspect recent execution).
  2. Review the 3 simulated personas:
     - Scenario 1: *Keyboard-Only Scholar* (Header & Program Actions)
     - Scenario 2: *Screen Reader / Keyboard Applicant* (Scholarship Application Flow)
     - Scenario 3: *Low-Vision Zoom / Mobile User* (320px Narrow-Screen Reflow)
  3. Click over to `/focus-map` to inspect the visual tab sequence.
- **Expected Observation:**
  - Scenario 2 is explicitly marked **BLOCKED at Step 2** (`National ID input missing accessible label`).
  - Scenario 3 **PASSED** (0px horizontal overflow verified at 320px).
  - The Focus Map visualizes numbered tab stops (Stop 1 to Stop 6) with red highlight on unlabelled controls.
- **Key Sentence for Judges:**
  > *"This is our core innovation: we don't stop at listing violations. Playwright drives authentic multi-step user journeys under simulated assistive constraints to prove whether a user is actually blocked from completing the task."*

---

### Stage 4: Prioritizing with User Task Impact Matrix (2:30 – 3:15)
- **Route to Open:** `http://localhost:3000/issues`
- **Action to Perform:**
  1. Scroll down to the **User Task Impact Matrix**.
  2. Compare the categorization: **Task Blockers** vs **Visual Barriers** vs **Unmeasured Rules**.
- **Expected Observation:**
  - `#national-id-input` is elevated to **Task Blocker** because it broke Scenario 2.
  - `#submit-app-btn` is classified as **Visual Barrier** (contrast 1.46:1).
  - Generic landmark suggestions are categorized as structural enhancements.
- **Key Sentence for Judges:**
  > *"Developers are drowning in hundreds of raw accessibility warnings. Our matrix correlates syntactic violations directly with live browser journeys, so teams immediately fix the barriers that actually prevent users from finishing forms."*

---

### Stage 5: Pre-Commit Safety Gate & Verified Remediation (3:15 – 4:15)
- **Route to Open:** `http://localhost:3000/fix-review`
- **Action to Perform:**
  1. Select `fix-national-id-input` from the patch list.
  2. Show the pre-commit safety gate checklist:
     - Allowlist template match: Confirmed
     - Visible text unchanged: Confirmed (`"National ID or Passport Number"`)
     - Zero unexpected DOM side effects: Confirmed
  3. Click **Apply Fix & Re-Verify**.
- **Expected Observation:**
  - Patch is safely applied to the controlled sandbox state.
  - State version increments automatically.
  - Cryptographic rollback token is created (`rb_*`).
- **Key Sentence for Judges:**
  > *"We reject hallucinated AI fixes that destroy layouts. AccessAble AI uses allowlisted, deterministic patch templates validated by a strict pre-commit safety gate that guarantees visible text preservation and DOM containment before touching code."*

---

### Stage 6: Verifiable Audit Receipts & Instant Rollback (4:15 – 4:45)
- **Route to Open:** `http://localhost:3000/verification`
- **Action to Perform:**
  1. Review the **Chronological Evidence Timeline** tracking all 7 stages from initial audit to receipt.
  2. Click **Export JSON** to inspect the downloadable receipt file.
  3. Point out the SHA-256 baseline checksum (`originalChecksum`) and rollback token.
  4. (Optional) Click **Rollback Fix** to prove instant baseline restoration.
- **Expected Observation:**
  - Fully formed JSON receipt conforming to `FixReceipt` schema with before/after comparisons and safety gate results.
- **Key Sentence for Judges:**
  > *"Every fix produces an auditable verification receipt with SHA-256 baseline checksums and deterministic rollback tokens, providing compliance teams with tamper-evident proof of remediation."*

---

### Stage 7: CI/CD Webhook & n8n Automation (4:45 – 5:00)
- **Route to Open:** `http://localhost:3000/automation`
- **Action to Perform:**
  1. Click **Test Local Endpoint (`/api/automation/webhook`)**.
  2. Show the instant JSON execution receipt with execution ID and timestamp.
  3. Point out the **Download .json** button for `accessable-n8n-workflow.json`.
- **Key Sentence for Judges:**
  > *"Our webhook gateway integrates into GitHub Actions or n8n workflows, giving teams an automated gate that tests PRs and blocks accessibility regressions before code ever reaches production."*

---

## Recovery Instructions & Troubleshooting

If unexpected behavior occurs during a live demonstration, follow these quick recovery steps:

| Symptom | Rapid Fix Command / Action |
|:---|:---|
| **Port 3000 in use or server down** | Run `cd frontend && npm start` (or `npm run dev`) in a clean terminal. |
| **Scan timeout or network pause** | Click the page refresh button. The API automatically reads from `.latest-audit.json` cache so data displays instantly. |
| **State inconsistent after multiple patch tests** | Open `/fix-review` and click **Reset to Baseline**, or send `POST /api/remediation` with `{"action":"reset"}`. |
| **Playwright browser missing** | Run `npx playwright install chromium` inside `frontend/`. |

---

## Backup Plan (Static Evidence & Screenshots)

If live execution is unavailable (e.g. conference Wi-Fi failure or hardware glitch), switch smoothly to pre-captured authentic evidence:

1. **Pre-Captured High-Resolution Screenshots:**
   - All 9 application states are captured from the running application and stored in [`docs/screenshots/`](screenshots/):
     - `01-dashboard.png` — Overview metrics & barrier distribution
     - `02-audits.png` — Live axe-core rule scan
     - `03-issues.png` — User Task Impact Matrix
     - `04-journeys.png` — 3 simulated persona outcomes
     - `05-focus-map.png` — Visual numbered tab order overlay
     - `06-fix-review.png` — Pre-commit safety gate & patch diffs
     - `07-verification.png` — Chronological timeline & cryptographic receipt
     - `08-automation.png` — Webhook gateway & n8n trigger
     - `09-demo-target.png` — Controlled scholarship application portal
2. **Recorded Verification Report:**
   - Refer to [`VERIFY_REPORT.md`](../VERIFY_REPORT.md) in the repository root for verified test outputs, 320px viewport measurements, and axe-core zero-violation logs.
