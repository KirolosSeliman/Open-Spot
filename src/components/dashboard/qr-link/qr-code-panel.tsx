import { QrCode } from "@/components/waitlist/qr-code";

import { CopyUrlBar } from "./copy-actions";
import { ExternalLinkIcon, QrLinkIcon } from "./icons";

export function QrCodePanel({ publicUrl, qrUrl }: { publicUrl: string; qrUrl: string }) {
  return (
    <section
      className="flex min-h-[420px] flex-col rounded-[22px] border border-[#e2e8f0] bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.06)]"
      data-dashboard-surface="panel"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2563ff]">
          <QrLinkIcon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-extrabold text-[#07142f]">QR code liste d&apos;attente</h2>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="rounded-2xl border border-[#e2e8f0] bg-white p-4">
          <QrCode
            alt="QR code vers le formulaire public de liste d'attente"
            value={qrUrl}
          />
        </div>

        <div className="w-full">
          <CopyUrlBar value={qrUrl} />
        </div>

        <a
          className="inline-flex min-h-[56px] w-full max-w-[320px] items-center justify-center gap-2 rounded-xl bg-[#2563ff] px-6 text-sm font-extrabold text-white shadow-[0_16px_36px_rgba(37,99,255,0.24)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff] sm:w-auto"
          href={publicUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Ouvrir le formulaire public
          <ExternalLinkIcon className="h-[18px] w-[18px]" />
        </a>
      </div>
    </section>
  );
}
