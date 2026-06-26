import type { ReactNode } from "react";

import { SiteHeader } from "./site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="pt-[calc(var(--header-height)+0.75rem)]">{children}</main>
    </>
  );
}
