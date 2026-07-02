import Link from "next/link";
import type { ReactNode } from "react";

import { PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";

type SeoContentSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type SeoLandingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: SeoContentSection[];
  ctaLabel?: string;
  ctaHref?: string;
  children?: ReactNode;
};

export function SeoLandingPage({
  eyebrow,
  title,
  description,
  sections,
  ctaLabel = "Réserver un appel",
  ctaHref = "/book-call/questions",
  children
}: SeoLandingPageProps) {
  return (
    <PageShell>
      <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">{description}</p>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <Card key={section.title}>
              <h2 className="text-xl font-bold text-[var(--foreground)]">{section.title}</h2>
              <div className="mt-3 space-y-3 text-[var(--muted)]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets ? (
                  <ul className="list-disc space-y-2 pl-5">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </Card>
          ))}
        </div>

        {children}

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            className="inline-flex rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-black text-white transition hover:bg-[var(--primary-strong)]"
            href={ctaHref}
          >
            {ctaLabel}
          </Link>
          <Link
            className="text-sm font-bold text-[var(--primary)] underline-offset-4 hover:underline"
            href="/"
          >
            Retour à l&apos;accueil Open Spot
          </Link>
        </div>
      </article>
    </PageShell>
  );
}
