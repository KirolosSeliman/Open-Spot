import type { ReactNode } from "react";

import { SiteHeader } from "./site-header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="min-w-0 max-w-full overflow-x-clip pt-[calc(var(--header-height)+0.75rem)]">
        {children}
      </main>
    </>
  );
}
