export interface ScanResultData {
  scannedAt: string;
  scannedUrl: string;
  violations: AccessibilityViolation[];
  totalIssues: number;
  criticalHighIssues: number;
}

export interface AccessibilityViolation {
  id: string;
  name: string;
  impact: AccessibilityImpact | null;
  description: string;
  help: string;
  helpUrl: string;
  nodes: NodeEntry[];
}

export type AccessibilityImpact = "critical" | "serious" | "moderate" | "minor";

export interface NodeEntry {
  target: string[];
  html: string;
  label: string;
}
