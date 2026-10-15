import { StatusPill } from "./StatusPill";

interface UnavailableNoticeProps {
  featureName: string;
  description: string;
  statusLabel?: string;
  extraAction?: React.ReactNode;
}

export function UnavailableNotice({
  featureName,
  description,
  statusLabel = "Unavailable: coming in a later phase",
  extraAction,
}: UnavailableNoticeProps) {
  return (
    <div
      role="region"
      aria-label={`${featureName} status`}
      className="p-8 rounded-2xl border border-neutral-200 bg-neutral-50/70 max-w-2xl my-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <StatusPill status="unavailable" label={statusLabel} />
      </div>
      <h3 className="text-lg font-bold text-neutral-950 mb-2">{featureName}</h3>
      <p className="text-sm text-neutral-600 leading-relaxed mb-6">{description}</p>
      {extraAction && <div className="pt-4 border-t border-neutral-200">{extraAction}</div>}
    </div>
  );
}
