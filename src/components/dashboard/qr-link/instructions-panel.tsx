import type { ReactNode } from "react";

import { CopyUrlButton } from "./copy-actions";
import { ExternalLinkIcon, LinkIcon, SendIcon, TabletIcon } from "./icons";

export function InstructionsPanel({
  publicUrl,
  kioskUrl
}: {
  publicUrl: string;
  kioskUrl: string;
}) {
  return (
    <section
      className="min-h-[420px] rounded-[22px] border border-[#e2e8f0] bg-white p-8 shadow-[0_18px_55px_rgba(15,23,42,0.06)]"
      data-dashboard-surface="panel"
    >
      <div className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2563ff]">
          <SendIcon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-lg font-extrabold text-[#07142f]">
          Instructions d&apos;impression et de partage
        </h2>
      </div>

      <div className="grid gap-4 text-[15px] leading-[1.65] text-[#64748b]">
        <p>
          Placez le QR code à la réception, sur Instagram, Facebook, Google
          Business Profile ou dans un message manuel.
        </p>
        <p>
          Le formulaire public demande un consentement SMS explicite. Sans
          consentement, le client ne devient pas éligible aux SMS.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        <ShareLinkRow
          action={<CopyUrlButton value={publicUrl} />}
          icon={<LinkIcon className="h-[18px] w-[18px]" />}
          title="Lien d'inscription public"
          url={publicUrl}
        />
        <ShareLinkRow
          action={
            <a
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 text-sm font-bold text-[#2563ff] transition hover:bg-[#f8fbff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
              href={kioskUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Ouvrir le kiosque
              <ExternalLinkIcon className="h-4 w-4" />
            </a>
          }
          icon={<TabletIcon className="h-[18px] w-[18px]" />}
          title="Mode kiosque tablette"
          url={kioskUrl}
        />
      </div>
    </section>
  );
}

function ShareLinkRow({
  action,
  icon,
  title,
  url
}: {
  action: ReactNode;
  icon: ReactNode;
  title: string;
  url: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#e2e8f0] bg-[#fcfdff] p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[#2563ff]">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-extrabold text-[#07142f]">{title}</p>
          <p className="mt-1 break-all text-sm text-[#64748b]">{url}</p>
        </div>
      </div>
      <div className="shrink-0 sm:ml-auto">{action}</div>
    </div>
  );
}
