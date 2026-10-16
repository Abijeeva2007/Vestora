import { join } from "node:path";
import { existsSync } from "node:fs";
import type { AuditRun, JourneyRun, ScanEngine } from "@/types";
import { runServerlessAudit, runServerlessJourney } from "./serverless-scanner";

export function getEngine(): ScanEngine {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return "lightweight";
  }
  if (process.env.SCAN_ENGINE === "lightweight") {
    return "lightweight";
  }
  return "full";
}

export function getEngineLabel(engine?: ScanEngine): string {
  return engine === "full" ? "Engine: Full browser" : "Engine: Lightweight hosted scan";
}

const SCAN_TIMEOUT_MS = 60_000;

export async function executeAuditScan(
  targetUrl: string,
  internalScanUrl: string,
  overridePatches?: string[]
): Promise<AuditRun> {
  const engine = getEngine();

  if (engine === "lightweight") {
    const res = await runServerlessAudit(targetUrl, overridePatches);
    return { ...res, engine: "lightweight" };
  }

  try {
    const res = await runFullPlaywrightAxe(internalScanUrl);
    if (!res || res.status === "error") {
      const fallback = await runServerlessAudit(targetUrl, overridePatches);
      return { ...fallback, engine: "lightweight" };
    }
    return { ...res, engine: "full", target: targetUrl };
  } catch (err) {
    console.warn("Full browser audit failed, falling back to lightweight hosted scan:", err instanceof Error ? err.message : err);
    const fallback = await runServerlessAudit(targetUrl, overridePatches);
    return { ...fallback, engine: "lightweight" };
  }
}

export async function executeJourneyScan(
  targetUrl: string,
  internalScanUrl: string,
  overridePatches?: string[]
): Promise<JourneyRun> {
  const engine = getEngine();

  if (engine === "lightweight") {
    const res = await runServerlessJourney(targetUrl, overridePatches);
    return { ...res, engine: "lightweight" };
  }

  try {
    const res = await runFullPlaywrightJourney(internalScanUrl);
    if (!res || res.status === "error") {
      const fallback = await runServerlessJourney(targetUrl, overridePatches);
      return { ...fallback, engine: "lightweight" };
    }
    return { ...res, engine: "full", target: targetUrl };
  } catch (err) {
    console.warn("Full browser journey failed, falling back to lightweight hosted scan:", err instanceof Error ? err.message : err);
    const fallback = await runServerlessJourney(targetUrl, overridePatches);
    return { ...fallback, engine: "lightweight" };
  }
}

async function runFullPlaywrightAxe(url: string): Promise<AuditRun> {
  const { spawn } = await import("node:child_process");
  const scriptPath = join(process.cwd(), "scripts", "axe-scan.mjs");
  if (!existsSync(scriptPath)) {
    throw new Error(`axe-scan.mjs not found at ${scriptPath}`);
  }

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
      try { child.kill("SIGTERM"); } catch {}
      reject(new Error(`Scan timed out after ${SCAN_TIMEOUT_MS / 1000} seconds.`));
    }, SCAN_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`Failed to start axe process: ${err.message}`));
    });

    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        const trimmed = stdout.trim();
        if (!trimmed) throw new Error(stderr || `Process exited with code ${code}`);
        resolve(JSON.parse(trimmed) as AuditRun);
      } catch (err) {
        reject(new Error(stderr || (err instanceof Error ? err.message : "Parse error")));
      }
    });
  });
}

async function runFullPlaywrightJourney(url: string): Promise<JourneyRun> {
  const { spawn } = await import("node:child_process");
  const scriptPath = join(process.cwd(), "scripts", "journey-runner.mjs");
  if (!existsSync(scriptPath)) {
    throw new Error(`journey-runner.mjs not found at ${scriptPath}`);
  }

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
      try { child.kill("SIGTERM"); } catch {}
      reject(new Error("Journey test timed out"));
    }, 75_000);

    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });

    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        const trimmed = stdout.trim();
        if (!trimmed) throw new Error(stderr || `Process exited with code ${code}`);
        resolve(JSON.parse(trimmed) as JourneyRun);
      } catch (err) {
        reject(new Error(stderr || (err instanceof Error ? err.message : "Parse error")));
      }
    });
  });
}
