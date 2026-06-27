"use client";

import { cn } from "@/lib/utils/cn";

const iosFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

function SideButton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute rounded-full bg-[#4a4a4f]", className)}
    />
  );
}

function StatusIcons() {
  return (
    <div className="flex items-center gap-[5px] text-black">
      <svg aria-hidden="true" className="h-[11px] w-[16px]" viewBox="0 0 16 11">
        <rect fill="currentColor" height="3" rx="0.5" width="2" x="0" y="7" />
        <rect fill="currentColor" height="5" rx="0.5" width="2" x="3" y="5" />
        <rect fill="currentColor" height="7" rx="0.5" width="2" x="6" y="3" />
        <rect fill="currentColor" height="9" rx="0.5" width="2" x="9" y="1" />
      </svg>
      <svg aria-hidden="true" className="h-[11px] w-[14px]" viewBox="0 0 14 11">
        <path
          d="M7 2.2c1.8 0 3.4.7 4.6 1.9l1.2-1.2C11.3 1.5 9.3.5 7 .5S2.7 1.5 1.2 2.9L2.4 4.1C3.6 2.9 5.2 2.2 7 2.2Z"
          fill="currentColor"
        />
        <path
          d="M7 5.2c1 0 1.9.4 2.6 1.1l1.2-1.2C9.6 4.2 8.4 3.7 7 3.7s-2.6.5-3.8 1.4l1.2 1.2c.7-.7 1.6-1.1 2.6-1.1Z"
          fill="currentColor"
        />
        <circle cx="7" cy="9.2" fill="currentColor" r="1.2" />
      </svg>
      <svg aria-hidden="true" className="h-[11px] w-[22px]" viewBox="0 0 22 11">
        <rect
          fill="none"
          height="9"
          rx="2.2"
          stroke="currentColor"
          strokeWidth="1"
          width="19"
          x="0.5"
          y="1"
        />
        <rect fill="currentColor" height="5.5" rx="1" width="14" x="2" y="2.75" />
        <rect fill="currentColor" height="3.5" rx="0.8" width="1.5" x="20" y="3.75" />
      </svg>
    </div>
  );
}

function MessageBubble({ message }: { message: string }) {
  return (
    <div className="relative inline-block max-w-[92%]">
      <div
        className="relative rounded-[18px] bg-[#e9e9eb] px-[11px] py-[8px] text-[15px] leading-[1.34] tracking-[-0.022em] text-black"
        style={{ fontFamily: iosFont }}
      >
        {message.split("\n").map((line, index, lines) => (
          <span key={`${index}-${line}`}>
            {line}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        ))}
        <svg
          aria-hidden="true"
          className="absolute -bottom-[0px] -left-[7px] h-[13px] w-[13px] text-[#e9e9eb]"
          viewBox="0 0 13 13"
        >
          <path d="M13 0C13 7.18 7.18 13 0 13C4.5 9.5 9.5 4.5 13 0Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

function PhoneScreen({ message }: { message: string }) {
  return (
    <div className="overflow-hidden rounded-[2.35rem] bg-white">
      <div className="relative bg-white px-[18px] pb-[6px] pt-[10px]">
        <div className="mx-auto mb-[8px] h-[24px] w-[92px] rounded-full bg-black" />
        <div
          className="flex items-center justify-between text-[15px] font-semibold leading-none text-black"
          style={{ fontFamily: iosFont }}
        >
          <span>9:41</span>
          <StatusIcons />
        </div>
      </div>

      <div className="relative border-b border-[#d1d1d6]/90 bg-[rgba(249,249,249,0.94)] px-[10px] pb-[8px] pt-[2px] backdrop-blur-[20px]">
        <div className="absolute left-[8px] top-[18px] text-[22px] font-light leading-none text-[#007aff]">
          ‹
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#c7c7cc] text-white">
            <svg aria-hidden="true" className="h-[24px] w-[24px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Zm0 2.2c-4.45 0-8.05 2.25-8.05 5.05v.75h16.1v-.75C20.05 16.45 16.45 14.2 12 14.2Z" />
            </svg>
          </div>
          <div
            className="mt-[2px] flex items-center gap-[2px] text-[11px] font-normal text-[#8e8e93]"
            style={{ fontFamily: iosFont }}
          >
            <span className="text-[12px] font-normal text-black">Open Spot</span>
            <span className="text-[10px]">›</span>
          </div>
        </div>
      </div>

      <div
        className="min-h-[390px] bg-white px-[12px] pb-[12px] pt-[14px]"
        style={{ fontFamily: iosFont }}
      >
        <div className="mb-[14px] text-center">
          <p className="text-[11px] font-normal leading-[14px] text-[#8e8e93]">iMessage</p>
          <p className="mt-[2px] text-[11px] font-normal leading-[14px] text-[#8e8e93]">
            Aujourd&apos;hui 9:41
          </p>
        </div>
        <MessageBubble message={message} />
      </div>

      <div className="border-t border-[#d1d1d6]/90 bg-[rgba(249,249,249,0.94)] px-[8px] pb-[8px] pt-[8px] backdrop-blur-[20px]">
        <div className="flex items-end gap-[8px]">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#e5e5ea] text-[#007aff]">
            <svg aria-hidden="true" className="h-[16px] w-[16px]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </div>
          <div className="relative min-h-[34px] flex-1 rounded-[18px] border border-[#c7c7cc] bg-white px-[12px] py-[7px]">
            <span className="text-[16px] leading-none text-[#c7c7cc]">iMessage</span>
            <svg
              aria-hidden="true"
              className="absolute right-[10px] top-1/2 h-[18px] w-[12px] -translate-y-1/2 text-[#8e8e93]"
              fill="currentColor"
              viewBox="0 0 12 18"
            >
              <path d="M6 1.5a4.5 4.5 0 0 1 4.5 4.5v3.5a4.5 4.5 0 1 1-9 0V6A4.5 4.5 0 0 1 6 1.5Zm0 14.2a2.2 2.2 0 0 0 2.2-2.2H3.8A2.2 2.2 0 0 0 6 15.7Z" />
            </svg>
          </div>
        </div>
        <div className="mx-auto mt-[8px] h-[4px] w-[108px] rounded-full bg-black" />
      </div>
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
      className={cn("relative mx-auto w-full max-w-[290px]", className)}
    >
      <SideButton className="left-[-2px] top-[108px] h-[22px] w-[3px]" />
      <SideButton className="left-[-2px] top-[148px] h-[40px] w-[3px]" />
      <SideButton className="left-[-2px] top-[198px] h-[40px] w-[3px]" />
      <SideButton className="right-[-2px] top-[162px] h-[58px] w-[3px]" />

      <div className="overflow-hidden rounded-[2.85rem] border-[7px] border-[#3a3a3c] bg-gradient-to-b from-[#5a5a5f] via-[#3a3a3c] to-[#2c2c2e] p-[2px] shadow-[0_28px_60px_rgba(15,23,42,0.22)]">
        <PhoneScreen message={message} />
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
      <div className="mb-6">
        <h2 className="text-xl font-black tracking-tight text-[#07142f]">
          Aperçu du SMS
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Voici à quoi ressemblera votre SMS pour le client.
        </p>
      </div>

      <SmsPreviewPhone message={previewMessage} />

      <p className="mt-6 flex items-start gap-2 text-sm leading-6 text-[#64748b]">
        <svg
          aria-hidden="true"
          className="mt-0.5 h-4 w-4 shrink-0 text-[#64748b]"
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
