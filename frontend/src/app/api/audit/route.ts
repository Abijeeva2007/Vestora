import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { z } from "zod";
import type { AuditRun } from "@/types";
import { getStorageDir } from "@/lib/remediation-engine";
import { executeAuditScan } from "@/lib/scan-engine";
import {
  sameOriginOnly,
  rateLimit,
  acquireRunLock,
  releaseRunLock,
  validateTargetUrl,
} from "@/lib/security";

const AuditRequestSchema = z.object({
  targetUrl: z.string().optional(),
}).strict();

const DEMO_PATH = "/demo";
const SCAN_TIMEOUT_MS = 60_000;
const CACHE_FILE = join(getStorageDir(), ".latest-audit.json");

let inMemoryLatestRun: AuditRun | null = null;

// Initialize from file if exists
try {
  if (existsSync(CACHE_FILE)) {
    const raw = readFileSync(CACHE_FILE, "utf-8");
    inMemoryLatestRun = JSON.parse(raw);
  }
} catch {}

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

export async function GET() {
  return NextResponse.json({
    latestRun: inMemoryLatestRun,
  });
}

export async function POST(request: NextRequest) {
  const originCheck = sameOriginOnly(request);
  if (!originCheck.valid) {
    return originCheck.response!;
  }

  const rl = rateLimit(request, "audit", 10, 60_000);
  if (!rl.allowed) {
    return rl.response!;
  }

  if (!acquireRunLock()) {
    return NextResponse.json(
      {
        code: "RUN_IN_PROGRESS",
        message: "A run is already in progress. Please wait for it to complete.",
        retryable: true,
      },
      { status: 429 }
    );
  }

  try {
    let body: Record<string, unknown> = {};
    const rawText = await request.text().catch(() => "");
    if (rawText.trim().length > 0) {
      try {
        const parsed = JSON.parse(rawText);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          return NextResponse.json(
            {
              code: "INVALID_REQUEST",
              message: "Invalid JSON body: expected a JSON object.",
              error: "Invalid JSON body: expected a JSON object.",
              retryable: false,
            },
            { status: 400 }
          );
        }
        body = parsed as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          {
            code: "INVALID_REQUEST",
            message: "Invalid JSON body: malformed JSON format.",
            error: "Invalid JSON body: malformed JSON format.",
            retryable: false,
          },
          { status: 400 }
        );
      }
    }

    // Validate supported fields
    const allowedKeys = ["targetUrl"];
    for (const key of Object.keys(body)) {
      if (!allowedKeys.includes(key)) {
        return NextResponse.json(
          {
            code: "INVALID_REQUEST",
            message: `Invalid payload: unsupported field '${key}'.`,
            error: `Invalid payload: unsupported field '${key}'.`,
            retryable: false,
          },
          { status: 400 }
        );
      }
    }

    if (body.targetUrl !== undefined && typeof body.targetUrl !== "string") {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Invalid payload: targetUrl must be a string.",
          error: "Invalid payload: targetUrl must be a string.",
          retryable: false,
        },
        { status: 400 }
      );
    }

    const validation = AuditRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Invalid request payload.",
          error: "Invalid request payload.",
          retryable: false,
        },
        { status: 400 }
      );
    }

    const clientHost = request.headers.get("host") || "localhost:3000";
    const resolvedDemoUrl = resolveDemoUrl(request);

    if (body.targetUrl) {
      const urlCheck = validateTargetUrl(body.targetUrl as string, clientHost);
      if (!urlCheck.valid) {
        return NextResponse.json(
          {
            code: "FORBIDDEN_TARGET",
            message: urlCheck.error || "Scanning external targets is strictly disabled.",
            error: "Security violation: Scanning is strictly restricted to the verified demo route (/demo).",
            retryable: false,
          },
          { status: 403 }
        );
      }
    }

    // Run scanner via unified engine
    const internalScanUrl = resolveInternalScanUrl();
    const auditRun = await executeAuditScan(resolvedDemoUrl, internalScanUrl);

    if (auditRun.status === "error") {
      return NextResponse.json(
        {
          code: "AUDIT_SCAN_ERROR",
          message: "The accessibility scan could not be completed. Please retry.",
          retryable: true,
        },
        { status: 500 }
      );
    }

    inMemoryLatestRun = auditRun;
    try {
      writeFileSync(CACHE_FILE, JSON.stringify(auditRun, null, 2), "utf-8");
    } catch {}

    return NextResponse.json(auditRun);
  } catch (error) {
    console.error("Internal audit error:", error);
    return NextResponse.json(
      {
        code: "AUDIT_INTERNAL_ERROR",
        message: "The accessibility audit encountered an issue while scanning. Please retry.",
        retryable: true,
      },
      { status: 500 }
    );
  } finally {
    releaseRunLock();
  }
}
