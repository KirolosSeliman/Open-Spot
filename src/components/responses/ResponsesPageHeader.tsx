import type { ReactNode } from "react";

export function ResponsesPageHeader({
  title,
  description,
  tabs
}: {
  title: string;
  description: string;
  tabs: ReactNode;
}) {
  return (
    <section className="grid gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
          Open Spot
        </p>
        <h1 className="mt-2 text-[1.75rem] font-black tracking-tight text-[var(--foreground)] sm:text-[2rem]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]">
          {description}
        </p>
      </div>
      {tabs}
    </section>
  );
}
