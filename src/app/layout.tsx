import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Open Spot — Récupérez vos annulations par SMS",
  description:
    "Open Spot aide les salons, barbiers, esthétiques, ongleries et commerces à rendez-vous à remplir leurs annulations de dernière minute avec des alertes SMS contrôlées."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
