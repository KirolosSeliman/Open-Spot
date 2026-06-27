import type { OpeningStatusBadgePresentation } from "@/lib/dashboard/opening-status-badge";
import { cn } from "@/lib/utils/cn";

const toneStyles: Record<
  OpeningStatusBadgePresentation["tone"],
  string
> = {
  success:
    "border-[#bbf7d0] bg-[#ecfdf5] text-[#059669]",
  info: "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]",
  warning:
    "border-[#fde68a] bg-[#fffbeb] text-[#b45309]",
  neutral:
    "border-[#e2e8f0] bg-[#f8fafc] text-[#475569]",
  muted: "border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]"
};

function StatusIcon({
  icon
}: {
  icon: NonNullable<OpeningStatusBadgePresentation["icon"]>;
}) {
  if (icon === "check") {
    return (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8.5 12.2 10.8 14.5 15.8 9.5" />
      </svg>
    );
  }

  if (icon === "send") {
    return (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    );
  }

  if (icon === "clock") {
    return (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  }

  if (icon === "message") {
    return (
      <svg
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  );
}

export function OpeningStatusBadge({
  presentation
}: {
  presentation: OpeningStatusBadgePresentation;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold leading-none",
        toneStyles[presentation.tone]
      )}
    >
      {presentation.icon ? <StatusIcon icon={presentation.icon} /> : null}
      {presentation.label}
    </span>
  );
}
