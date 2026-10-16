import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRemediationState } from "@/lib/remediation-engine";
import { executeAuditScan, executeJourneyScan } from "@/lib/scan-engine";
import { requireApiKey, validateTargetUrl } from "@/lib/security";

export const dynamic = "force-dynamic";

const DEMO_PATH = "/demo";

const WebhookSchema = z.object({
  action: z.string().optional(),
  event: z.string().optional(),
  targetUrl: z.string().optional(),
});

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

export async function GET(request: NextRequest) {
  const auth = requireApiKey(request);
  if (!auth.valid) {
    return auth.response!;
  }

  const state = getRemediationState();
  return NextResponse.json({
    status: "ready",
    webhookConfigured: true,
    activePatchesCount: state.activePatches.length,
    activePatches: state.activePatches,
    supportedActions: ["audit", "journey", "test", "status"],
    endpoint: "/api/automation/webhook",
    version: "1.0.0",
  });
}

export async function POST(request: NextRequest) {
  const auth = requireApiKey(request);
  if (!auth.valid) {
    return auth.response!;
  }

  const executionId = `exec_n8n_${Date.now()}`;
  const timestamp = new Date().toISOString();

  let rawJson: unknown = {};
  try {
    rawJson = await request.json();
  } catch {
    rawJson = {};
  }

  const parseResult = WebhookSchema.safeParse(rawJson);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        executionId,
        timestamp,
        code: "INVALID_PAYLOAD",
        message: "Malformed automation webhook payload.",
        retryable: false,
      },
      { status: 400 }
    );
  }

  const body = parseResult.data;
  const action = (body.action || body.event || "test").toLowerCase();
  const demoUrl = resolveDemoUrl(request);
  const internalScanUrl = resolveInternalScanUrl();

  if (body.targetUrl) {
    const clientHost = request.headers.get("host") || "localhost:3000";
    const targetValidation = validateTargetUrl(body.targetUrl, clientHost);
    if (!targetValidation.valid) {
      return NextResponse.json(
        {
          executionId,
          timestamp,
          code: "FORBIDDEN_TARGET",
          message: targetValidation.error || "Invalid targetUrl for automation.",
          retryable: false,
        },
        { status: 403 }
      );
    }
  }

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
    try {
      const scanResult = await executeAuditScan(demoUrl, internalScanUrl);
      return NextResponse.json({
        executionId,
        timestamp,
        status: scanResult.status === "error" ? "failed" : "completed",
        action: "audit",
        result: scanResult,
      });
    } catch (err) {
      return NextResponse.json(
        {
          executionId,
          timestamp,
          code: "AUTOMATION_AUDIT_ERROR",
          message: "Automated audit execution failed.",
          retryable: true,
        },
        { status: 500 }
      );
    }
  }

  if (action === "journey") {
    try {
      const journeyResult = await executeJourneyScan(demoUrl, internalScanUrl);
      return NextResponse.json({
        executionId,
        timestamp,
        status: journeyResult.status === "error" ? "failed" : "completed",
        action: "journey",
        result: journeyResult,
      });
    } catch (err) {
      return NextResponse.json(
        {
          executionId,
          timestamp,
          code: "AUTOMATION_JOURNEY_ERROR",
          message: "Automated journey execution failed.",
          retryable: true,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      executionId,
      timestamp,
      code: "UNKNOWN_ACTION",
      message: `Unknown action "${action}". Supported: test, audit, journey, status.`,
      retryable: false,
    },
    { status: 400 }
  );
}
