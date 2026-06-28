import { SmsBookIcon } from "@/components/admin/sms-configuration-icons";

export function SmsPageHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2563ff]">
          OPEN SPOT
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-[#0b1328] sm:text-5xl">
          Configuration SMS
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[#64748b]">
          Gérez l&apos;envoi de SMS, les modèles, les tests et la conformité en toute
          simplicité.
        </p>
      </div>

      <a
        className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-[#e1e9f5] bg-white px-5 text-sm font-bold text-[#0b1328] shadow-[0_4px_16px_rgba(15,23,42,0.04)] transition hover:bg-[#f8fbff]"
        href="https://github.com/KirolosSeliman/Open-Spot/blob/main/docs/sms-compliance-notes.md"
        rel="noreferrer"
        target="_blank"
        title="Documentation conformité SMS"
      >
        <SmsBookIcon className="h-4 w-4" />
        Documentation
      </a>
    </div>
  );
}
