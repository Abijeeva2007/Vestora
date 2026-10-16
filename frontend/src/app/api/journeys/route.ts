import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { getStorageDir } from "@/lib/remediation-engine";
import { executeJourneyScan } from "@/lib/scan-engine";
import type { JourneyRun } from "@/types";

const DEMO_PATH = "/demo";
const TIMEOUT_MS = 60_000;
const CACHE_FILE = join(getStorageDir(), ".latest-journey.json");

let inMemoryLatestRun: JourneyRun | null = null;

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
    let body: { targetUrl?: string } = {};
    try {
      body = await request.json();
    } catch {}

    const clientHost = request.headers.get("host") || "localhost:3000";
    const resolvedDemoUrl = resolveDemoUrl(request);

    // Security restriction: strictly enforce verified demo target
    if (body.targetUrl) {
      try {
        const parsed = new URL(body.targetUrl);
        const isAllowedHost =
          parsed.host === clientHost ||
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1";

        if (!isAllowedHost || parsed.pathname !== DEMO_PATH) {
          return NextResponse.json(
            {
              error: "Security violation: Journey tests are strictly restricted to the verified demo route (/demo).",
            },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json({ error: "Invalid target URL." }, { status: 400 });
      }
    }

    // Run journey via unified engine
    const internalScanUrl = resolveInternalScanUrl();
    const runResult = await executeJourneyScan(resolvedDemoUrl, internalScanUrl);

    if (runResult.status === "error") {
      return NextResponse.json({
        code: "JOURNEY_SCAN_ERROR",
        message: "The keyboard journey test could not be completed. Please retry.",
        retryable: true,
      }, { status: 500 });
    }

    inMemoryLatestRun = runResult;
    try {
      writeFileSync(CACHE_FILE, JSON.stringify(runResult, null, 2), "utf-8");
    } catch {}

    return NextResponse.json(runResult);
  } catch (error) {
    console.error("Internal journey error:", error);
    return NextResponse.json(
      {
        code: "JOURNEY_INTERNAL_ERROR",
        message: "The keyboard journey test encountered an issue while executing. Please retry.",
        retryable: true,
      },
      { status: 500 }
    );
  }
}
