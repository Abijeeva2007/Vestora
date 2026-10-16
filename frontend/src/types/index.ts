/**
 * AccessAble AI — shared TypeScript types.
 * All phases import from this single module.
 */

export type Severity = "critical" | "serious" | "moderate" | "minor";

export type AutomationSafety =
  | "safe to auto-apply"
  | "needs human judgment"
  | "cannot be automated";

export type EvidenceType = "detected by rule" | "observed in journey";

export type MeasuredTaskImpact =
  | "task_blocker"
  | "interactive_barrier"
  | "visual_barrier"
  | "not_measured";

export interface AffectedElement {
  selectors: string[];
  html: string;
  label: string;
}

export interface Issue {
  id: string;
  rule: string;
  severity: Severity;
  description: string;
  affectedElements: AffectedElement[];
  helpText: string;
  helpUrl: string;
  evidenceType: EvidenceType;
  userImpact: string;
  automationSafety?: AutomationSafety;
  measuredImpact?: number;
  measuredTaskImpact?: MeasuredTaskImpact;
  measuredTaskImpactReason?: string;
  inferredFromJourney?: boolean;
  tabPressesBefore?: number;
  tabPressesAfter?: number;
  failingStep?: string;
  rollbackToken?: string;
}

export type ScanEngine = "full" | "lightweight";

export interface AuditRun {
  id: string;
  timestamp: string;
  target: string;
  status: "success" | "error" | "running";
  engine?: ScanEngine;
  durationMs?: number;
  passesCount?: number;
  incompleteCount?: number;
  issueCounts: {
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    total: number;
  };
  issues: Issue[];
  errorMessage?: string;
  isSnapshot?: boolean;
  snapshotLabel?: string;
  engineNotice?: string;
  complianceNotice?: string;
  findingsSummary?: string;
  isPublicTarget?: boolean;
}

// ---------------------------------------------------------------------------
// Phase 2 — Journey Testing & Visual Focus Map
// ---------------------------------------------------------------------------

export type TaskStatus = "passed" | "failed" | "blocked" | "not_run";

export interface FocusStop {
  order: number;
  selector: string;
  role: string;
  name: string;
  visibleFocus: boolean;
  observations?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface JourneyStep {
  stepNumber: number;
  description: string;
  status: "passed" | "failed" | "blocked";
  failingReason?: string;
  selector?: string;
}

export interface JourneyTask {
  id: string;
  title: string;
  persona: string;
  condition: string;
  status: TaskStatus;
  tabPresses: number;
  failingStep?: string;
  explanation: string;
  steps: JourneyStep[];
  linkedIssueRules?: string[];
}

export interface JourneyRun {
  id: string;
  timestamp: string;
  target: string;
  status: "success" | "error";
  engine?: ScanEngine;
  tasks: JourneyTask[];
  focusStops: FocusStop[];
  screenshotBase64?: string;
  viewportWidth: number;
  viewportHeight: number;
  horizontalOverflow320px: boolean;
  overflowAmountPx: number;
  trapDetected: boolean;
  unreachableControlsCount: number;
  errorMessage?: string;
}

export interface PersonaTaskResult {
  persona: string;
  task: string;
  completed: boolean;
  engine?: ScanEngine;
  failingStep?: string;
  tabPresses?: number;
  issueIds: string[];
}

// ---------------------------------------------------------------------------
// Phase 3 — Safe Remediation & Verification Pipeline
// ---------------------------------------------------------------------------

export type FixStatus =
  | "proposed"
  | "approved"
  | "applied"
  | "rejected"
  | "rolled_back";

export interface FixProposal {
  id: string;
  issueId: string;
  ruleId: string;
  selector: string;
  description: string;
  evidenceSource: string;
  recommendedPatch: string;
  diff: string;
  automationSafety: AutomationSafety;
  expectedOutcome: string;
  status: FixStatus;
  contrastBefore?: number;
  contrastAfter?: number;
  wcagThreshold?: number;
  rollbackToken?: string;
}

export interface SafetyGateResult {
  passed: boolean;
  allowlistMatch: boolean;
  visibleTextUnchanged: boolean;
  interactionCheck: boolean;
  unexpectedDomChanges: boolean;
  details: string[];
}

export interface FixReceipt {
  receiptId: string;
  fixId: string;
  rule: string;
  selector: string;
  timestamp: string;
  target: string;
  originalChecksum: string;
  patchDescription: string;
  appliedDiff: string;
  automationSafety: AutomationSafety;
  safetyGate: SafetyGateResult;
  engine?: ScanEngine;
  beforeScan: {
    totalIssues: number;
    targetedRuleViolations: number;
  };
  afterScan: {
    totalIssues: number;
    targetedRuleViolations: number;
  };
  beforeJourney?: {
    taskStatus: string;
    failingStep?: string;
  };
  afterJourney?: {
    taskStatus: string;
    failingStep?: string;
  };
  resolved: boolean;
  newRegressions: string[];
  rollbackToken: string;
  finalStatus: "verified_resolved" | "verification_failed" | "rolled_back";
  knownLimitations: string[];
  signature?: string;
  signatureAlgorithm?: string;
  signatureStatus?: "signed" | "unsigned" | "invalid";
}

export interface RemediationSnapshot {
  rollbackToken: string;
  version: number;
  activePatches: string[];
  fixId: string;
  timestamp: string;
}

export interface RemediationState {
  version: number;
  originalChecksum: string;
  activePatches: string[];
  rollbackHistory: RemediationSnapshot[];
  latestReceipt: FixReceipt | null;
}

export interface VerificationReport {
  auditRunId: string;
  timestamp: string;
  engine?: ScanEngine;
  resolvedCount: number;
  remainingCount: number;
  results: VerificationResult[];
}

export interface VerificationResult {
  issueId: string;
  rule: string;
  fixed: boolean;
  measuredImpact?: number;
}
