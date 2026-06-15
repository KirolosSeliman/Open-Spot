import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { getRequestLocale } from "@/lib/i18n/locale";

import "./globals.css";

export const metadata: Metadata = {
  title: "Open Spot — Récupérez vos annulations par SMS",
  description:
    "Open Spot aide les salons, barbiers, esthétiques, ongleries et commerces à rendez-vous à remplir leurs annulations de dernière minute avec des alertes SMS contrôlées."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
