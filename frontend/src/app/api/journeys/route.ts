import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { z } from "zod";
import { getStorageDir } from "@/lib/remediation-engine";
import { executeJourneyScan } from "@/lib/scan-engine";
import {
  sameOriginOnly,
  rateLimit,
  acquireRunLock,
  releaseRunLock,
  validateTargetUrl,
} from "@/lib/security";
import type { JourneyRun } from "@/types";

const DEMO_PATH = "/demo";
const TIMEOUT_MS = 60_000;
const CACHE_FILE = join(getStorageDir(), ".latest-journey.json");

const JourneyRequestSchema = z.object({
  targetUrl: z.string().optional(),
}).strict();

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
  const originCheck = sameOriginOnly(request);
  if (!originCheck.valid) {
    return originCheck.response!;
  }

  const rl = rateLimit(request, "journeys", 10, 60_000);
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
            retryable: false,
          },
          { status: 400 }
        );
      }
    }

    const validation = JourneyRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          code: "INVALID_REQUEST",
          message: "Invalid payload parameters.",
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
            error: "Security violation: Journey tests are strictly restricted to the verified demo route (/demo).",
            retryable: false,
          },
          { status: 403 }
        );
      }
    }

    // Run journey via unified engine
    const internalScanUrl = resolveInternalScanUrl();
    const runResult = await executeJourneyScan(resolvedDemoUrl, internalScanUrl);

    if (runResult.status === "error") {
      return NextResponse.json(
        {
          code: "JOURNEY_SCAN_ERROR",
          message: "The keyboard journey test could not be completed. Please retry.",
          retryable: true,
        },
        { status: 500 }
      );
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
  } finally {
    releaseRunLock();
  }
}
