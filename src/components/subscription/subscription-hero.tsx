import { SubscriptionDiamondIcon } from "@/components/subscription/subscription-icons";

export function SubscriptionPageHeader({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="relative overflow-hidden border-b border-[#e8eef5] px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[#eef4ff]/80 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-6 hidden h-32 w-32 rounded-full border border-[#dbeafe]/70 bg-gradient-to-br from-[#eff6ff] to-[#f8fbff] sm:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 hidden h-24 w-56 opacity-60 sm:block"
      >
        <svg className="h-full w-full" fill="none" viewBox="0 0 224 96">
          <path
            d="M0 72C40 54 80 78 120 66C160 54 200 72 224 60"
            stroke="#bfdbfe"
            strokeWidth="1.5"
          />
          <path
            d="M0 84C48 68 96 88 144 74C192 60 208 82 224 72"
            stroke="#dbeafe"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      <div className="relative max-w-3xl">
        <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#2563ff]">
          <SubscriptionDiamondIcon className="h-3 w-3 text-[#2563ff]" />
          Open Spot
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[#07142f] sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#50617d] sm:text-[15px] sm:leading-7">
          {description}
        </p>
      </div>
    </header>
  );
}
