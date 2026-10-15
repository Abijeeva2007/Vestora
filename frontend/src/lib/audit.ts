/** Shared accessibility scan types. */

export type Severity = "critical" | "serious" | "moderate" | "minor";

export interface AccessibilityViolation {
  /** Deque rule id, e.g. 'color-contrast'. */
  id: string;
  /** Human-readable rule name. */
  name: string;
  /** Impact as reported by axe. */
  impact: Severity | null;
  /** Why this matters / how it affects users. */
  description: string;
  /** How to fix the issue. */
  help: string;
  /** URL of the rule's documentation. */
  helpUrl: string;
  /** Nodes that failed this rule. */
  nodes: ViolationNode[];
}

export interface ViolationNode {
  /** Target CSS selector(s), e.g. '#submit'. */
  target: string[];
  /** Snippet of the HTML for context. */
  html: string;
  /** Short label describing the element. */
  label: string;
}

export interface AuditResult {
  /** When the scan finished (ISO UTC). */
  scannedAt: string;
  /** Absolute URL that was scanned. */
  scannedUrl: string;
  /** Whether the scan completed successfully. */
  success: boolean;
  /** Human-readable reason when success is false. */
  errorMessage?: string;
  /** Real axe violations, only when success is true. */
  violations: AccessibilityViolation[];
  /** Total distinct issues (one per violating node per rule, for the UI). */
  totalIssues: number;
  /** Count of critical + serious issues. */
  criticalHighIssues: number;
  /** Count of issues resolved in this pass (0 until remediation tracking is added). */
  resolvedIssues: number;
}

/** Severity bucket used by the overview cards. */
export function bucketForImpact(impact: Severity | null | undefined): "critical" | "high" | "normal" {
  if (impact === "critical" || impact === "serious") return "high";
  if (impact === "moderate") return "normal";
  return "normal";
}

export const PROBLEMATIC_SEVERITY_ORDER: Severity[] = ["critical", "serious", "moderate", "minor"];
