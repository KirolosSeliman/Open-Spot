import { SubscriptionDiamondIcon } from "@/components/subscription/subscription-icons";

export function SubscriptionPageHeader({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="relative overflow-hidden px-6 pb-8 pt-7 sm:px-8 sm:pb-10 sm:pt-9 lg:px-10 lg:pb-11">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-20 h-56 w-56 rounded-full bg-[#dbeafe]/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-4 hidden h-36 w-36 rounded-full border border-[#dbeafe]/80 bg-gradient-to-br from-[#eff6ff] to-[#f8fbff] sm:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2 right-0 hidden h-28 w-64 opacity-70 md:block"
      >
        <svg className="h-full w-full" fill="none" viewBox="0 0 256 112">
          <path
            d="M0 84C48 64 96 92 144 76C192 60 224 88 256 74"
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <path
            d="M0 98C56 78 112 104 168 86C224 68 240 96 256 84"
            stroke="#dbeafe"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative max-w-3xl">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[#2563eb]">
          <SubscriptionDiamondIcon className="h-3 w-3 text-[#2563eb]" />
          Open Spot
        </p>
        <h1 className="mt-4 font-serif text-[2.65rem] font-bold leading-[1.02] tracking-[-0.02em] text-[#07142f] sm:text-[3.15rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#50617d] sm:text-[15px]">
          {description}
        </p>
      </div>
    </header>
  );
}
