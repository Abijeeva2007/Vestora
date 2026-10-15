import { NextResponse } from "next/server";
import { getRemediationState } from "@/lib/remediation-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = getRemediationState();

  return NextResponse.json(
    {
      status: "healthy",
      service: "accessable-ai",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      environment: process.env.NODE_ENV || "production",
      remediationVersion: state.version,
      activePatchesCount: state.activePatches.length,
      activePatches: state.activePatches,
      nodeVersion: process.version,
    },
    { status: 200 }
  );
}
