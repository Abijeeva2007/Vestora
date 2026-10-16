import { timingSafeEqual, createHmac } from "node:crypto";
import { NextResponse } from "next/server";

// In-memory rate limits reset per serverless instance
interface RateLimitBucket {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitBucket>();

// Single-run concurrency lock per instance
let isRunActive = false;

export function acquireRunLock(): boolean {
  if (isRunActive) {
    return false;
  }
  isRunActive = true;
  return true;
}

export function releaseRunLock(): void {
  isRunActive = false;
}

export function constantTimeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf-8");
    const bufB = Buffer.from(b, "utf-8");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export function requireApiKey(req: Request): { valid: boolean; response?: NextResponse } {
  const configuredSecret = process.env.AUTOMATION_API_KEY;
  if (!configuredSecret || configuredSecret.trim() === "") {
    return {
      valid: false,
      response: NextResponse.json(
        {
          code: "AUTOMATION_API_KEY_UNCONFIGURED",
          message: "Automation API key is not configured on this server.",
          retryable: false,
        },
        { status: 503 }
      ),
    };
  }

  const providedKey = req.headers.get("x-api-key");
  if (!providedKey || !constantTimeEqual(providedKey, configuredSecret)) {
    return {
      valid: false,
      response: NextResponse.json(
        {
          code: "UNAUTHORIZED",
          message: "Invalid or missing x-api-key header.",
          retryable: false,
        },
        { status: 401 }
      ),
    };
  }

  return { valid: true };
}

export function sameOriginOnly(req: Request): { valid: boolean; response?: NextResponse } {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const candidate = origin || referer;
  if (candidate && host) {
    try {
      const parsed = new URL(candidate);
      if (parsed.host.toLowerCase() !== host.toLowerCase()) {
        return {
          valid: false,
          response: NextResponse.json(
            {
              code: "FORBIDDEN_ORIGIN",
              message: "Cross-origin requests are forbidden.",
              retryable: false,
            },
            { status: 403 }
          ),
        };
      }
    } catch {
      return {
        valid: false,
        response: NextResponse.json(
          {
            code: "FORBIDDEN_ORIGIN",
            message: "Malformed origin or referer header.",
            retryable: false,
          },
          { status: 403 }
        ),
      };
    }
  }

  return { valid: true };
}

export function rateLimit(
  req: Request,
  actionKey: string,
  limit: number,
  windowMs: number
): { allowed: boolean; response?: NextResponse } {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const mapKey = `${actionKey}:${ip}`;

  const now = Date.now();
  const bucket = rateLimitMap.get(mapKey) || { timestamps: [] };

  bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (bucket.timestamps.length >= limit) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          code: "RATE_LIMIT_EXCEEDED",
          message: "Too many requests. Please try again shortly.",
          retryable: true,
        },
        { status: 429 }
      ),
    };
  }

  bucket.timestamps.push(now);
  rateLimitMap.set(mapKey, bucket);
  return { allowed: true };
}

const ALLOWED_DEMO_PATHS = ["/demo", "/demo/sandbox"];

export function validateTargetUrl(
  targetUrl: string,
  hostHeader?: string | null
): { valid: boolean; normalized?: string; error?: string } {
  if (!targetUrl || typeof targetUrl !== "string") {
    return { valid: false, error: "targetUrl must be a string." };
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return { valid: false, error: "targetUrl is not a valid absolute URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, error: "targetUrl must use http or https protocol." };
  }

  const path = parsed.pathname;
  const isAllowedPath = ALLOWED_DEMO_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
  if (!isAllowedPath) {
    return { valid: false, error: `targetUrl path "${path}" is not in the allowed demo routes list.` };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const matchesHost = hostHeader && parsed.host.toLowerCase() === hostHeader.toLowerCase();

  if (!isLocal && !matchesHost) {
    return { valid: false, error: "Scanning external targets is strictly disabled." };
  }

  return { valid: true, normalized: parsed.href };
}

export function canonicalJsonStringify(obj: any): string {
  if (obj === null || typeof obj !== "object") {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalJsonStringify).join(",")}]`;
  }
  const keys = Object.keys(obj).sort();
  const entries = keys.map((k) => `${JSON.stringify(k)}:${canonicalJsonStringify(obj[k])}`);
  return `{${entries.join(",")}}`;
}

export function signReceiptPayload(receipt: Record<string, any>): {
  signature?: string;
  algorithm: string;
  status: "signed" | "unsigned";
} {
  const secret = process.env.RECEIPT_SIGNING_SECRET;
  if (!secret || secret.trim() === "") {
    return {
      algorithm: "none",
      status: "unsigned",
    };
  }

  const { signature: _sig, signatureStatus: _st, ...canonicalData } = receipt;
  const canonicalString = canonicalJsonStringify(canonicalData);
  const signature = createHmac("sha256", secret).update(canonicalString).digest("hex");

  return {
    signature,
    algorithm: "HMAC-SHA256",
    status: "signed",
  };
}

export function verifyReceiptSignature(receipt: Record<string, any>): {
  valid: boolean;
  status: "signed" | "unsigned" | "invalid";
  reason?: string;
} {
  const secret = process.env.RECEIPT_SIGNING_SECRET;
  if (!secret || secret.trim() === "") {
    return { valid: false, status: "unsigned", reason: "Signing secret not configured on this server." };
  }

  const { signature, signatureStatus, ...canonicalData } = receipt;
  if (!signature || typeof signature !== "string") {
    return { valid: false, status: "unsigned", reason: "Receipt does not contain a signature." };
  }

  const canonicalString = canonicalJsonStringify(canonicalData);
  const expectedSignature = createHmac("sha256", secret).update(canonicalString).digest("hex");

  if (!constantTimeEqual(signature, expectedSignature)) {
    return { valid: false, status: "invalid", reason: "Signature mismatch. Content may have been modified." };
  }

  return { valid: true, status: "signed" };
}

export function sanitizeFileName(name: string): string {
  if (typeof name !== "string") {
    throw new Error("Invalid filename argument");
  }
  if (name.includes("/") || name.includes("\\") || name.includes("..")) {
    throw new Error("Invalid filename: directory traversal detected");
  }
  return name.replace(/[^a-zA-Z0-9_.-]/g, "_");
}
