"use client";

import Image from "next/image";

import { cn } from "@/lib/utils/cn";

const iosFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

const MESSAGE_AREA_BG = "#ffffff";

function IosMessageBubble({ message }: { message: string }) {
  return (
    <div className="relative max-w-[252px]">
      <div
        className="relative z-[2] rounded-[18px] bg-[#e9e9eb] px-[11px] py-[7px] text-[15px] leading-[1.36] tracking-[-0.015em] text-black"
        style={{ fontFamily: iosFont }}
      >
        {message.split("\n").map((line, index, lines) => (
          <span key={`${index}-${line}`}>
            {line}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        ))}
      </div>
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[-1px] z-[1] block h-[17px] w-[11px] rounded-bl-[10px] bg-[#e9e9eb]"
      />
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[-9px] z-[0] block h-[17px] w-[9px] rounded-br-[8px]"
        style={{ backgroundColor: MESSAGE_AREA_BG }}
      />
    </div>
  );
}

export function SmsPreviewPhone({
  message,
  className
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative mx-auto h-[536px] w-[320px]", className)}
    >
      <Image
        alt=""
        className="pointer-events-none select-none object-contain"
        draggable={false}
        fill
        priority
        sizes="320px"
        src="/images/iphone-sms-preview-frame.png"
      />

      <div
        className="absolute bottom-[72px] left-[10px] right-[10px] top-[114px] z-[2]"
        style={{ backgroundColor: MESSAGE_AREA_BG }}
      />

      <div className="absolute left-[12px] top-[116px] z-[3] max-w-[calc(100%-24px)]">
        <IosMessageBubble message={message} />
      </div>
    </div>
  );
}

export function SmsPreviewPanel({
  previewMessage
}: {
  previewMessage: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-[#dde5f0] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
      <div className="mb-5">
        <h2 className="text-[1.35rem] font-black leading-tight tracking-tight text-[#07142f]">
          Aperçu du SMS
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Voici à quoi ressemblera votre SMS pour le client.
        </p>
      </div>

      <div className="flex justify-center py-1">
        <SmsPreviewPhone message={previewMessage} />
      </div>

      <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-[#64748b]">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-[#94a3b8]"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 10v6M12 7h.01" />
        </svg>
        <span>
          Le message de confirmation manuelle sera envoyé automatiquement au
          client une fois que vous confirmez un répondant.
        </span>
      </p>

      <p className="sr-only">{previewMessage}</p>
    </section>
  );
}
