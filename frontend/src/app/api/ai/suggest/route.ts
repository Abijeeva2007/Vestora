import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, sameOriginOnly } from "@/lib/security";
import {
  isAiConfigured,
  explainIssue,
  suggestFix,
  suggestAltText,
  summarizeRun,
} from "@/lib/ai";

const RequestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("status"),
  }),
  z.object({
    action: z.literal("explain"),
    rule: z.string().min(1).max(100),
    severity: z.string().min(1).max(50),
    snippet: z.string().max(1000).optional(),
    helpText: z.string().min(1).max(500),
  }),
  z.object({
    action: z.literal("suggest_fix"),
    rule: z.string().min(1).max(100),
    severity: z.string().min(1).max(50),
    snippet: z.string().min(1).max(1000),
    helpText: z.string().min(1).max(500),
  }),
  z.object({
    action: z.literal("suggest_alt"),
    snippet: z.string().min(1).max(1000),
    context: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("summarize"),
    summary: z.object({
      total: z.number().int().nonnegative(),
      critical: z.number().int().nonnegative(),
      serious: z.number().int().nonnegative(),
      moderate: z.number().int().nonnegative(),
      minor: z.number().int().nonnegative(),
      passedRules: z.number().int().nonnegative(),
    }),
  }),
]);

export async function GET(req: NextRequest) {
  // Allow checking AI availability without origin check
  return NextResponse.json({
    configured: isAiConfigured(),
    model: process.env.AI_MODEL || "claude-haiku-5-5",
    message: isAiConfigured()
      ? "AI assist configured and ready"
      : "AI assist unavailable (API key not configured)",
  });
}

export async function POST(req: NextRequest) {
  const originCheck = sameOriginOnly(req);
  if (!originCheck.valid && originCheck.response) return originCheck.response;

  const rateCheck = rateLimit(req, "ai-suggest", 30, 60000);
  if (!rateCheck.allowed && rateCheck.response) return rateCheck.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  if (data.action === "status") {
    return NextResponse.json({
      configured: isAiConfigured(),
    });
  }

  if (!isAiConfigured()) {
    return NextResponse.json({
      available: false,
      reason: "AI assist is disabled or API key is not configured",
    });
  }

  if (data.action === "explain") {
    const result = await explainIssue({
      rule: data.rule,
      severity: data.severity,
      snippet: data.snippet,
      helpText: data.helpText,
    });
    return NextResponse.json(result);
  }

  if (data.action === "suggest_fix") {
    const result = await suggestFix({
      rule: data.rule,
      severity: data.severity,
      snippet: data.snippet,
      helpText: data.helpText,
    });
    return NextResponse.json(result);
  }

  if (data.action === "suggest_alt") {
    const result = await suggestAltText({
      snippet: data.snippet,
      context: data.context,
    });
    return NextResponse.json(result);
  }

  if (data.action === "summarize") {
    const result = await summarizeRun(data.summary);
    return NextResponse.json(result);
  }

  return NextResponse.json({ available: false, reason: "Unknown action" }, { status: 400 });
}
