import { NextRequest, NextResponse } from "next/server";
import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import type { AuditRun } from "@/types";
import { getStorageDir } from "@/lib/remediation-engine";
import { runServerlessAudit } from "@/lib/serverless-scanner";

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

    // Run scanner (serverless resilient)
    let rawAuditRun: AuditRun;
    if (process.env.VERCEL) {
      rawAuditRun = await runServerlessAudit(resolvedDemoUrl);
    } else {
      try {
        const internalScanUrl = resolveInternalScanUrl();
        rawAuditRun = await runScannerProcess(internalScanUrl);
        if (
          rawAuditRun.status === "error" &&
          (rawAuditRun.errorMessage?.includes("ERR_MODULE_NOT_FOUND") ||
            rawAuditRun.errorMessage?.includes("browserType.launch") ||
            rawAuditRun.errorMessage?.includes("playwright"))
        ) {
          rawAuditRun = await runServerlessAudit(resolvedDemoUrl);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn("Playwright runner unavailable, falling back to serverless scanner:", msg);
        rawAuditRun = await runServerlessAudit(resolvedDemoUrl);
      }
    }

    const auditRun: AuditRun = {
      ...rawAuditRun,
      target: resolvedDemoUrl,
    };

    if (auditRun.status === "error") {
      return NextResponse.json(auditRun, { status: 500 });
    }

    // Persist run
    inMemoryLatestRun = auditRun;
    try {
      writeFileSync(CACHE_FILE, JSON.stringify(auditRun, null, 2), "utf-8");
    } catch {}

    return NextResponse.json(auditRun);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    const safeErrorMessage =
      rawMessage.includes("ERR_") || rawMessage.includes("node:") || rawMessage.includes("/var/task") || rawMessage.includes("at ")
        ? "An internal error occurred during audit execution."
        : rawMessage;
    return NextResponse.json(
      {
        id: `run-err-${Date.now()}`,
        timestamp: new Date().toISOString(),
        target: resolveDemoUrl(request),
        status: "error",
        issueCounts: { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 },
        issues: [],
        errorMessage: safeErrorMessage,
      },
      { status: 500 }
    );
  }
}

async function runScannerProcess(url: string): Promise<AuditRun> {
  const { spawn } = await import("node:child_process");
  const scriptPath = join(process.cwd(), "scripts", "axe-scan.mjs");

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
      reject(new Error(`Scan timed out after ${SCAN_TIMEOUT_MS / 1000} seconds.`));
    }, SCAN_TIMEOUT_MS);

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
      reject(new Error(`Failed to start scanner process: ${err.message}`));
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
        const parsed = JSON.parse(trimmed) as AuditRun;
        resolve(parsed);
      } catch (err) {
        reject(
          new Error(
            stderr ||
              (err instanceof Error
                ? err.message
                : `Failed to parse scanner output: ${stdout.slice(0, 300)}`)
          )
        );
      }
    });
  });
}
