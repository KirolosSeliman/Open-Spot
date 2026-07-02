export function SubscriptionPageHeader({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="px-[clamp(1rem,4vw,1.5rem)] pb-6 pt-6 sm:px-8 sm:pb-10 sm:pt-9 lg:px-10 lg:pb-11">
      <div className="max-w-3xl min-w-0">
        <h1 className="os-mobile-page-title font-serif text-[2.65rem] font-bold leading-[1.02] tracking-[-0.02em] text-[#07142f] sm:text-[3.15rem]">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#50617d] sm:text-[15px]">
          {description}
        </p>
      </div>
    </header>
  );
}
