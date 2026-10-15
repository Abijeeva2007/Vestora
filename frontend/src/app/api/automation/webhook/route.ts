import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { getRemediationState } from "@/lib/remediation-engine";

export const dynamic = "force-dynamic";

const DEMO_PATH = "/demo";
const TIMEOUT_MS = 60_000;

function resolveDemoUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}${DEMO_PATH}`;
}

function resolveInternalScanUrl(): string {
  if (process.env.INTERNAL_TARGET_URL) {
    return process.env.INTERNAL_TARGET_URL;
  }
  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}${DEMO_PATH}`;
}

function verifyWebhookSecret(request: NextRequest): boolean {
  const expectedSecret = process.env.N8N_WEBHOOK_SECRET;
  if (!expectedSecret) {
    // If no secret configured in environment, allow local test triggers
    return true;
  }

  const customHeader = request.headers.get("x-n8n-secret");
  const authHeader = request.headers.get("authorization");

  if (customHeader === expectedSecret) return true;
  if (authHeader === `Bearer ${expectedSecret}`) return true;

  return false;
}

export async function GET() {
  const isSecretConfigured = Boolean(process.env.N8N_WEBHOOK_SECRET);
  const webhookUrl = process.env.N8N_WEBHOOK_URL || null;
  const state = getRemediationState();

  return NextResponse.json({
    status: "ready",
    webhookConfigured: isSecretConfigured,
    externalWebhookUrl: webhookUrl,
    activePatchesCount: state.activePatches.length,
    activePatches: state.activePatches,
    supportedActions: ["audit", "journey", "test", "status"],
    endpoint: "/api/automation/webhook",
    version: "1.0.0",
  });
}

export async function POST(request: NextRequest) {
  const executionId = `exec_n8n_${Date.now()}`;
  const timestamp = new Date().toISOString();

  // 1. Verify Secret
  if (!verifyWebhookSecret(request)) {
    return NextResponse.json(
      {
        executionId,
        timestamp,
        status: "unauthorized",
        error: "Unauthorized: Invalid or missing webhook secret (x-n8n-secret header required).",
      },
      { status: 401 }
    );
  }

  // 2. Parse payload
  let body: { action?: string; event?: string; targetUrl?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = (body.action || body.event || "test").toLowerCase();
  const demoUrl = resolveDemoUrl(request);

  if (action === "test" || action === "ping") {
    return NextResponse.json({
      executionId,
      timestamp,
      status: "completed",
      action: "test_ping",
      message: "Webhook connection verified successfully.",
      target: demoUrl,
      remediationVersion: getRemediationState().version,
    });
  }

  if (action === "status") {
    return NextResponse.json({
      executionId,
      timestamp,
      status: "completed",
      action: "status",
      remediationState: getRemediationState(),
    });
  }

  if (action === "audit" || action === "scan") {
    const { spawn } = await import("node:child_process");
    const scriptPath = join(process.cwd(), "scripts", "axe-scan.mjs");
    const internalScanUrl = resolveInternalScanUrl();

    try {
      const rawScanResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const child = spawn("sh", ["-c", `node "${scriptPath}" "${internalScanUrl}"`], {
          cwd: process.cwd(),
          env: { ...process.env, TARGET_URL: internalScanUrl },
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
          try { child.kill("SIGTERM"); } catch {}
          reject(new Error("Axe scan timed out"));
        }, TIMEOUT_MS);

        child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
        child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

        child.on("exit", (code) => {
          clearTimeout(timer);
          try {
            resolve(JSON.parse(stdout.trim()));
          } catch {
            reject(new Error(stderr || `Process exited with code ${code}`));
          }
        });
      });

      return NextResponse.json({
        executionId,
        timestamp,
        status: "completed",
        action: "audit",
        result: {
          ...rawScanResult,
          target: demoUrl,
        },
      });
    } catch (err) {
      return NextResponse.json(
        {
          executionId,
          timestamp,
          status: "failed",
          action: "audit",
          error: err instanceof Error ? err.message : "Audit failed",
        },
        { status: 500 }
      );
    }
  }

  if (action === "journey") {
    const { spawn } = await import("node:child_process");
    const scriptPath = join(process.cwd(), "scripts", "journey-runner.mjs");
    const internalScanUrl = resolveInternalScanUrl();

    try {
      const rawJourneyResult = await new Promise<Record<string, unknown>>((resolve, reject) => {
        const child = spawn("sh", ["-c", `node "${scriptPath}" "${internalScanUrl}"`], {
          cwd: process.cwd(),
          env: { ...process.env, TARGET_URL: internalScanUrl },
          stdio: ["ignore", "pipe", "pipe"],
        });

        let stdout = "";
        let stderr = "";
        const timer = setTimeout(() => {
          try { child.kill("SIGTERM"); } catch {}
          reject(new Error("Journey test timed out"));
        }, TIMEOUT_MS);

        child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
        child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

        child.on("exit", (code) => {
          clearTimeout(timer);
          try {
            resolve(JSON.parse(stdout.trim()));
          } catch {
            reject(new Error(stderr || `Process exited with code ${code}`));
          }
        });
      });

      return NextResponse.json({
        executionId,
        timestamp,
        status: "completed",
        action: "journey",
        result: {
          ...rawJourneyResult,
          target: demoUrl,
        },
      });
    } catch (err) {
      return NextResponse.json(
        {
          executionId,
          timestamp,
          status: "failed",
          action: "journey",
          error: err instanceof Error ? err.message : "Journey failed",
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      executionId,
      timestamp,
      status: "rejected",
      error: `Unknown action '${action}'. Supported actions: 'test', 'audit', 'journey', 'status'.`,
    },
    { status: 400 }
  );
}
