import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "2e Chance RDV — Récupérez vos annulations par SMS",
  description:
    "2e Chance RDV aide les salons, barbiers, esthétiques, ongleries et commerces à rendez-vous à remplir leurs annulations de dernière minute avec des alertes SMS contrôlées."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
