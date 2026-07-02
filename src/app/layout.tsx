import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { getRequestLocale } from "@/lib/i18n/locale";
import { buildSiteStructuredData } from "@/lib/seo/json-ld";
import { createRootSiteMetadata } from "@/lib/seo/metadata";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

import "./globals.css";

export const metadata: Metadata = createRootSiteMetadata();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();

  const structuredData = buildSiteStructuredData(resolveConfiguredSiteUrl());

  return (
    <html lang={locale}>
      <body>
        {structuredData.map((entry) => (
          <JsonLdScript data={entry} key={String(entry["@type"])} />
        ))}
        {children}
      </body>
    </html>
  );
}
