import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { getStorageDir } from "@/lib/remediation-engine";
import { runServerlessJourney } from "@/lib/serverless-scanner";
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

    // Run journey runner (serverless resilient)
    let rawRunResult: JourneyRun;
    if (process.env.VERCEL) {
      rawRunResult = await runServerlessJourney(resolvedDemoUrl);
    } else {
      try {
        const internalScanUrl = resolveInternalScanUrl();
        rawRunResult = await runJourneyProcess(internalScanUrl);
        if (
          rawRunResult.status === "error" &&
          (rawRunResult.errorMessage?.includes("ERR_MODULE_NOT_FOUND") ||
            rawRunResult.errorMessage?.includes("browserType.launch") ||
            rawRunResult.errorMessage?.includes("playwright"))
        ) {
          rawRunResult = await runServerlessJourney(resolvedDemoUrl);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Playwright runner unavailable, falling back to serverless journey runner:", msg);
        rawRunResult = await runServerlessJourney(resolvedDemoUrl);
      }
    }

    const runResult: JourneyRun = {
      ...rawRunResult,
      target: resolvedDemoUrl,
    };

    if (runResult.status === "error") {
      return NextResponse.json(runResult, { status: 500 });
    }

    inMemoryLatestRun = runResult;
    try {
      writeFileSync(CACHE_FILE, JSON.stringify(runResult, null, 2), "utf-8");
    } catch {}

    return NextResponse.json(runResult);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred during journey test execution.";
    return NextResponse.json(
      {
        id: `journey-err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        target: resolveDemoUrl(request),
        status: "error",
        tasks: [],
        focusStops: [],
        viewportWidth: 1024,
        viewportHeight: 800,
        horizontalOverflow320px: false,
        overflowAmountPx: 0,
        trapDetected: false,
        unreachableControlsCount: 0,
        errorMessage,
      },
      { status: 500 }
    );
  }
}

async function runJourneyProcess(url: string): Promise<JourneyRun> {
  const { spawn } = await import("node:child_process");
  const scriptPath = join(process.cwd(), "scripts", "journey-runner.mjs");

  return new Promise((resolve, reject) => {
    const child = spawn("sh", ["-c", `node "${scriptPath}" "${url}"`], {
      cwd: process.cwd(),
      env: { ...process.env, TARGET_URL: url },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill("SIGTERM");
      } catch {}
      reject(new Error(`Journey test timed out after ${TIMEOUT_MS / 1000} seconds.`));
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Failed to start journey runner process: ${err.message}`));
    });

    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);

      try {
        const trimmed = stdout.trim();
        if (!trimmed) {
          throw new Error(stderr || `Process exited with code ${code} without output.`);
        }
        const parsed = JSON.parse(trimmed) as JourneyRun;
        resolve(parsed);
      } catch (err) {
        reject(
          new Error(
            stderr ||
              (err instanceof Error
                ? err.message
                : `Failed to parse journey runner output: ${stdout.slice(0, 300)}`)
          )
        );
      }
    });
  });
}
