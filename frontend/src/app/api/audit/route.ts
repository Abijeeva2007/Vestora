import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import type { AuditRun } from "@/types";
import { getStorageDir } from "@/lib/remediation-engine";
import { executeAuditScan } from "@/lib/scan-engine";

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
  try {
    // Validate request body: catch malformed JSON and validate payload fields
    let body: Record<string, unknown> = {};
    const rawText = await request.text().catch(() => "");
    if (rawText.trim().length > 0) {
      try {
        const parsed = JSON.parse(rawText);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          return NextResponse.json(
            { error: "Invalid JSON body: expected a JSON object." },
            { status: 400 }
          );
        }
        body = parsed as Record<string, unknown>;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body: malformed JSON format." },
          { status: 400 }
        );
      }
    }

    // Validate supported fields
    const allowedKeys = ["targetUrl"];
    for (const key of Object.keys(body)) {
      if (!allowedKeys.includes(key)) {
        return NextResponse.json(
          { error: `Invalid payload: unsupported field '${key}'.` },
          { status: 400 }
        );
      }
    }

    if (body.targetUrl !== undefined && typeof body.targetUrl !== "string") {
      return NextResponse.json(
        { error: "Invalid payload: targetUrl must be a string." },
        { status: 400 }
      );
    }

    const clientHost = request.headers.get("host") || "localhost:3000";
    const resolvedDemoUrl = resolveDemoUrl(request);

    // If a targetUrl is explicitly passed, verify it points STRICTLY to /demo on this host/origin
    if (body.targetUrl) {
      try {
        const parsed = new URL(body.targetUrl as string);
        const isAllowedHost =
          parsed.host === clientHost ||
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1";

        if (!isAllowedHost || parsed.pathname !== DEMO_PATH) {
          return NextResponse.json(
            {
              error: "Security violation: Scanning is strictly restricted to the verified demo route (/demo).",
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json({ error: "Invalid target URL." }, { status: 400 });
      }
    }

    // Run scanner via unified engine
    const internalScanUrl = resolveInternalScanUrl();
    const auditRun = await executeAuditScan(resolvedDemoUrl, internalScanUrl);

    if (auditRun.status === "error") {
      return NextResponse.json({
        code: "AUDIT_SCAN_ERROR",
        message: "The accessibility scan could not be completed. Please retry.",
        retryable: true,
      }, { status: 500 });
    }

    // Persist run
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
  }
}
