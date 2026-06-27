import { SubscriptionDiamondIcon } from "@/components/subscription/subscription-icons";

export function SubscriptionHero({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="relative overflow-hidden rounded-[22px] border border-[#dde5f0] bg-white p-8 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:p-12 sm:pb-14 lg:p-14 lg:pb-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#eef4ff]/90 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-8 top-8 hidden h-40 w-40 rounded-full border border-[#dbeafe]/80 bg-gradient-to-br from-[#eff6ff] to-[#f8fbff] sm:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 hidden h-32 w-72 opacity-70 sm:block"
      >
        <svg className="h-full w-full" fill="none" viewBox="0 0 288 128">
          <path
            d="M0 96C48 72 96 104 144 88C192 72 240 96 288 80"
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <path
            d="M0 112C56 92 112 116 168 98C224 80 256 108 288 96"
            stroke="#dbeafe"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#2563ff]">
          <SubscriptionDiamondIcon className="h-3.5 w-3.5 text-[#2563ff]" />
          Open Spot
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-[#07142f] sm:text-5xl lg:text-[3.35rem] lg:leading-[1.05]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#50617d] sm:text-base">
          {description}
        </p>
      </div>
    </header>
  );
}
