import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type SiteHeaderShellProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export function SiteHeaderShell({
  children,
  className,
  innerClassName
}: SiteHeaderShellProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-[rgba(247,249,253,0.78)] px-3 py-3 backdrop-blur",
        className
      )}
    >
      <div className={cn("mx-auto max-w-6xl px-1 sm:px-2", innerClassName)}>
        {children}
      </div>
    </header>
  );
}
