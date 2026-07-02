import type { Metadata } from "next";
import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { brand } from "@/lib/brand";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Contact",
  description:
    "Contactez Open Spot pour en savoir plus sur la récupération d'annulations par SMS pour salons, barbiers, spas et cliniques beauté.",
  path: "/contact"
});

export default function ContactPage() {
  return (
    <PageShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
          Contact
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
          Parler à {brand.brandName}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
          Pour découvrir si {brand.brandName} convient à votre commerce, réservez un court appel
          ou consultez les pages légales du site officiel {brand.canonicalUrl}.
        </p>

        <div className="mt-8 grid gap-4">
          <Card>
            <h2 className="text-xl font-bold">Réserver un appel</h2>
            <p className="mt-2 text-[var(--muted)]">
              Le moyen le plus simple de poser vos questions sur le flux SMS, le consentement et la
              validation manuelle.
            </p>
            <Link
              className="mt-4 inline-flex rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--primary-strong)]"
              href="/book-call/questions"
            >
              Réserver un appel
            </Link>
          </Card>

          <Card>
            <h2 className="text-xl font-bold">Informations légales</h2>
            <p className="mt-2 text-[var(--muted)]">
              Politique de confidentialité, conditions d&apos;utilisation et consentement SMS.
            </p>
            <ul className="mt-4 space-y-2 text-sm font-bold text-[var(--primary)]">
              <li>
                <Link className="hover:underline" href="/politique-confidentialite">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/conditions-utilisation">
                  Conditions d&apos;utilisation
                </Link>
              </li>
              <li>
                <Link className="hover:underline" href="/consentement-sms">
                  Consentement SMS
                </Link>
              </li>
            </ul>
          </Card>
        </div>

        <p className="mt-8 text-sm text-[var(--muted)]">
          <Link className="font-bold text-[var(--primary)] hover:underline" href="/">
            Retour à l&apos;accueil Open Spot
          </Link>
        </p>
      </section>
    </PageShell>
  );
}
