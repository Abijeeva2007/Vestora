import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyReceiptSignature } from "@/lib/security";

export const dynamic = "force-dynamic";

const VerifySchema = z.object({
  receipt: z.record(z.string(), z.any()),
}).or(z.record(z.string(), z.any()));

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json(
        {
          code: "INVALID_PAYLOAD",
          message: "Expected a JSON object containing receipt data.",
          retryable: false,
          valid: false,
        },
        { status: 400 }
      );
    }

    const parseResult = VerifySchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          code: "INVALID_PAYLOAD",
          message: "Malformed receipt payload structure.",
          retryable: false,
          valid: false,
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    const receipt = "receipt" in payload && payload.receipt ? payload.receipt : payload;

    const verification = verifyReceiptSignature(receipt);

    return NextResponse.json({
      valid: verification.valid,
      status: verification.status,
      reason: verification.reason,
    });
  } catch (err) {
    console.error("Receipt verification internal error:", err);
    return NextResponse.json(
      {
        code: "VERIFY_INTERNAL_ERROR",
        message: "An issue occurred while verifying receipt signature.",
        retryable: true,
        valid: false,
      },
      { status: 500 }
    );
  }
}
