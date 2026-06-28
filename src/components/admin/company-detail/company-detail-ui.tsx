import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export const companyDetailCardClassName =
  "rounded-[24px] border border-[#e2eaf5] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-7";

export const companyDetailInputClassName =
  "min-h-11 w-full rounded-[13px] border border-[#e2eaf5] bg-white px-4 text-sm text-[#0b1328] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563ff] focus:ring-4 focus:ring-[#eef5ff] disabled:opacity-60";

export const companyDetailSelectClassName =
  "min-h-11 w-full rounded-[13px] border border-[#e2eaf5] bg-white px-4 text-sm font-semibold text-[#0b1328] outline-none focus:border-[#2563ff] focus:ring-4 focus:ring-[#eef5ff] disabled:opacity-60";

export const companyDetailPrimaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-[13px] bg-[#2563ff] px-5 text-sm font-bold text-white transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff] disabled:opacity-50";

export const companyDetailSecondaryButtonClassName =
  "inline-flex min-h-11 items-center justify-center rounded-[13px] border border-[#e2eaf5] bg-white px-5 text-sm font-bold text-[#0b1328] transition hover:bg-[#eef5ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff] disabled:opacity-50";

export function CompanyDetailCard({
  className,
  children,
  id
}: {
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div className={cn(companyDetailCardClassName, className)} id={id}>
      {children}
    </div>
  );
}

export function CompanyDetailEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2563ff]">
      {children}
    </p>
  );
}

export function CompanyDetailPageTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="mt-2 text-[2rem] font-bold leading-tight text-[#0b1328] sm:text-[2.25rem]">
      {children}
    </h1>
  );
}

export function CompanyDetailDescription({ children }: { children: ReactNode }) {
  return (
    <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[#64748b]">{children}</p>
  );
}

export function CompanyDetailSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-bold text-[#0b1328] sm:text-xl">{children}</h2>;
}

export function CompanyDetailFieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-semibold text-[#64748b]">{children}</span>;
}

export function CompanyDetailIconBadge({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#2563ff]",
        className
      )}
    >
      {children}
    </span>
  );
}
