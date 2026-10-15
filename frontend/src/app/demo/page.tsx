import { getRemediationState } from "@/lib/remediation-engine";
import DemoClient from "./DemoClient";

export const dynamic = "force-dynamic";

export default function DemoPage() {
  const state = getRemediationState();
  return <DemoClient activePatches={state.activePatches} />;
}
