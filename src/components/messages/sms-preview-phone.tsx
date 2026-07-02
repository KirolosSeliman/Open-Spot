"use client";

import { cn } from "@/lib/utils/cn";

const iosFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

function StatusBar() {
  return (
    <div
      className="relative shrink-0 px-[18px] pb-[2px] pt-[10px]"
      style={{ fontFamily: iosFont }}
    >
      <div className="mx-auto mb-[8px] h-[24px] w-[88px] rounded-full bg-black" />
      <div className="flex items-center justify-between text-[15px] font-semibold leading-none tracking-[-0.02em] text-black">
        <span>9:41</span>
        <div className="flex items-center gap-[5px]">
          <svg aria-hidden="true" className="h-[10px] w-[16px]" viewBox="0 0 16 10">
            <rect fill="currentColor" height="2.5" rx="0.5" width="1.8" x="0" y="7" />
            <rect fill="currentColor" height="4" rx="0.5" width="1.8" x="3" y="5.5" />
            <rect fill="currentColor" height="5.5" rx="0.5" width="1.8" x="6" y="4" />
            <rect fill="currentColor" height="7.5" rx="0.5" width="1.8" x="9" y="2" />
          </svg>
          <svg aria-hidden="true" className="h-[10px] w-[14px]" viewBox="0 0 14 10">
            <path
              d="M7 2.1c1.65 0 3.15.65 4.25 1.75l1.1-1.1C10.4 1.4 8.55.6 7 .6S2.6 1.4 1.55 2.75l1.1 1.1C3.75 2.75 5.25 2.1 7 2.1Z"
              fill="currentColor"
            />
            <path
              d="M7 4.9c.95 0 1.75.35 2.4 1l1.1-1.1c-.95-.85-2.15-1.3-3.5-1.3s-2.55.45-3.5 1.3l1.1 1.1c.65-.65 1.45-1 2.4-1Z"
              fill="currentColor"
            />
            <circle cx="7" cy="8.6" fill="currentColor" r="1.05" />
          </svg>
          <svg aria-hidden="true" className="h-[10px] w-[22px]" viewBox="0 0 22 10">
            <rect
              fill="none"
              height="8.5"
              rx="2.2"
              stroke="currentColor"
              strokeWidth="0.9"
              width="19"
              x="0.5"
              y="0.8"
            />
            <rect fill="currentColor" height="5.2" rx="0.9" width="14" x="2" y="2.4" />
            <rect fill="currentColor" height="3.2" rx="0.8" width="1.4" x="19.2" y="3.4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function MessagesNavBar() {
  return (
    <div className="relative shrink-0 border-b border-[#d1d1d6] bg-[#f9f9f9]/95 px-[14px] pb-[8px] pt-[2px] backdrop-blur-xl">
      <div
        className="absolute left-[6px] top-[16px] text-[22px] font-light leading-none text-[#007aff]"
        style={{ fontFamily: iosFont }}
      >
        ‹
      </div>
      <div className="flex flex-col items-center">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#c7c7cc] text-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          <svg aria-hidden="true" className="h-[22px] w-[22px]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
          </svg>
        </div>
        <p
          className="mt-[2px] text-[11px] leading-[13px] text-[#8e8e93]"
          style={{ fontFamily: iosFont }}
        >
          Open Spot ›
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: string }) {
  return (
    <div className="relative inline-block max-w-[92%]">
      <div
        className="relative z-[2] rounded-[18px] bg-[#e9e9eb] px-[12px] py-[8px] text-[15px] leading-[1.38] tracking-[-0.015em] text-black"
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
        className="absolute bottom-0 left-[-9px] z-0 block h-[17px] w-[9px] rounded-br-[8px] bg-white"
      />
    </div>
  );
}

function MessageArea({ message }: { message: string }) {
  return (
    <div
      className="min-h-0 flex-1 overflow-y-auto bg-white px-[14px] pb-[10px] pt-[12px]"
      style={{ fontFamily: iosFont }}
    >
      <div className="mb-[10px] text-center">
        <p className="text-[11px] leading-[13px] text-[#8e8e93]">iMessage</p>
      </div>
      <MessageBubble message={message} />
    </div>
  );
}

function InputBar() {
  return (
    <div className="shrink-0 border-t border-[#d1d1d6] bg-[#f9f9f9]/95 px-[8px] pb-[7px] pt-[8px] backdrop-blur-xl">
      <div className="flex items-end gap-[8px]">
        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#e5e5ea] text-[#8e8e93] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]">
          <svg
            aria-hidden="true"
            className="h-[14px] w-[14px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
        </div>
        <div className="relative flex min-h-[34px] flex-1 items-center rounded-[18px] border border-[#c7c7cc] bg-white px-[12px] py-[7px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]">
          <span className="text-[16px] leading-none text-[#c7c7cc]" style={{ fontFamily: iosFont }}>
            iMessage
          </span>
          <svg
            aria-hidden="true"
            className="absolute right-[10px] top-1/2 h-[16px] w-[11px] -translate-y-1/2 text-[#8e8e93]"
            fill="currentColor"
            viewBox="0 0 11 16"
          >
            <path d="M5.5 1.2a3.8 3.8 0 0 1 3.8 3.8v2.9a3.8 3.8 0 1 1-7.6 0V5A3.8 3.8 0 0 1 5.5 1.2Zm0 12.4a1.9 1.9 0 0 0 1.9-1.9H3.6A1.9 1.9 0 0 0 5.5 13.6Z" />
          </svg>
        </div>
      </div>
      <div className="mx-auto mt-[8px] h-[4px] w-[108px] rounded-full bg-black/90" />
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
    <div className={cn("mx-auto w-full max-w-[min(280px,100%)]", className)}>
      <div className="relative mx-auto w-full max-w-[280px]">
        <div className="pointer-events-none absolute -left-[2px] top-[104px] h-[20px] w-[3px] rounded-full bg-[#d1d1d6]" />
        <div className="pointer-events-none absolute -left-[2px] top-[138px] h-[36px] w-[3px] rounded-full bg-[#d1d1d6]" />
        <div className="pointer-events-none absolute -left-[2px] top-[182px] h-[36px] w-[3px] rounded-full bg-[#d1d1d6]" />
        <div className="pointer-events-none absolute -right-[2px] top-[156px] h-[54px] w-[3px] rounded-full bg-[#d1d1d6]" />

        <div className="rounded-[46px] bg-gradient-to-b from-[#fafafa] via-[#ececef] to-[#dedee3] p-[2px] shadow-[0_24px_48px_rgba(15,23,42,0.14),0_8px_16px_rgba(15,23,42,0.08)]">
          <div className="rounded-[44px] bg-gradient-to-b from-[#ffffff] to-[#ececee] p-[1px]">
            <div className="overflow-hidden rounded-[43px] border-[2.5px] border-[#101010] bg-[#101010]">
              <div
                aria-hidden="true"
                className="flex h-[560px] w-[271px] flex-col overflow-hidden bg-white antialiased"
              >
                <StatusBar />
                <MessagesNavBar />
                <MessageArea message={message} />
                <InputBar />
              </div>
            </div>
          </div>
        </div>
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
    <section className="min-w-0 rounded-[1.35rem] border border-[#dde5f0] bg-white p-[clamp(1rem,4vw,1.75rem)] shadow-[0_10px_30px_rgba(15,23,42,0.05)] sm:p-7">
      <div className="mb-6">
        <h2 className="text-[1.35rem] font-black leading-tight tracking-tight text-[#07142f]">
          Aperçu du SMS
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Voici à quoi ressemblera votre SMS pour le client.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-[1.25rem] bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc] px-4 py-10">
        <SmsPreviewPhone message={previewMessage} />
      </div>

      <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-[#64748b]">
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
