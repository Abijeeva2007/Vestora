import { getRemediationState } from "@/lib/remediation-engine";
import DemoClient from "./DemoClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function DemoPage() {
  const state = getRemediationState();
  return <DemoClient activePatches={state.activePatches} />;
}
