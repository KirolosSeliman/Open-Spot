import { SmsBookIcon } from "@/components/admin/sms-configuration-icons";

export function SmsPageHeader({ organizationName }: { organizationName: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">
          {organizationName}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0b1328]">
          Configuration SMS
        </h1>
      </div>

      <a
        className="inline-flex min-h-10 items-center gap-2 self-start rounded-lg border border-[#e1e9f5] bg-white px-4 text-sm font-semibold text-[#0b1328] hover:bg-[#f8fafc]"
        href="https://github.com/KirolosSeliman/Open-Spot/blob/main/docs/sms-compliance-notes.md"
        rel="noreferrer"
        target="_blank"
      >
        <SmsBookIcon className="h-4 w-4" />
        Doc
      </a>
    </div>
  );
}
