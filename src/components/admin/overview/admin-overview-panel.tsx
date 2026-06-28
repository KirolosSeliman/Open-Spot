import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export const adminOverviewCardClassName =
  "rounded-[22px] border border-[#e1e9f5] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]";

export function AdminOverviewPanel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section className={cn(adminOverviewCardClassName, "p-6", className)} {...props}>
      {children}
    </section>
  );
}

export function AdminOverviewSectionTitle({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-[1.05rem] font-bold tracking-tight text-[#0b1328]", className)}>
      {children}
    </h2>
  );
}

export function AdminOverviewLink({
  href,
  children
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      className="text-sm font-semibold text-[#2563ff] transition hover:text-[#1d4ed8]"
      href={href}
    >
      {children}
    </a>
  );
}
