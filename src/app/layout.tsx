import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { BingSiteVerificationMeta } from "@/components/seo/site-verification";
import { GlobalStructuredData } from "@/components/seo/structured-data";
import { getRequestLocale } from "@/lib/i18n/locale";
import { rootSeoMetadata } from "@/lib/seo/metadata";
import { absoluteUrl } from "@/lib/seo/site";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

import "./globals.css";

const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;

export const metadata: Metadata = {
  metadataBase: new URL(resolveConfiguredSiteUrl()),
  ...rootSeoMetadata,
  icons: {
    apple: "/brand/open-spot-logo-mark.png",
    icon: "/brand/open-spot-logo-mark.png"
  },
  ...(googleSiteVerification
    ? {
        verification: {
          google: googleSiteVerification
        }
      }
    : {}),
  alternates: {
    canonical: absoluteUrl("/")
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <head>
        <BingSiteVerificationMeta />
        <GlobalStructuredData />
      </head>
      <body>{children}</body>
    </html>
  );
}
