import type { ConsentStatus } from "@/lib/customers/consent";

const badgeClasses: Record<ConsentStatus, string> = {
  opted_in: "bg-[#dff5eb] text-[#166044]",
  needs_consent: "bg-[#fff3cf] text-[#8a5b00]",
  opted_out: "bg-[#fde2e2] text-[#9f1d1d]"
};

export function ConsentBadge({ status }: { status: ConsentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClasses[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
