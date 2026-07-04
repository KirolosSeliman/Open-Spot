import Link from "next/link";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { InternalSeoLinks } from "@/components/seo/InternalSeoLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import type { CommercialPageData } from "@/lib/seo/pages";
import { BOOK_CALL_PATH } from "@/lib/seo/site";
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd
} from "@/lib/seo/structured-data";

function ContentSection({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--line)] pt-10">
      <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-base leading-7 text-[var(--muted)]">{children}</div>
    </section>
  );
}

export function SeoLandingPage({ data }: { data: CommercialPageData }) {
  const breadcrumbItems = [
    { name: "Accueil", path: "/" },
    { name: data.h1, path: data.path }
  ];

  return (
    <PageShell>
      <JsonLd
        data={[
          buildWebPageJsonLd({
            title: data.title,
            description: data.description,
            path: data.path
          }),
          buildBreadcrumbJsonLd(breadcrumbItems)
        ]}
      />

      <div className="mx-auto w-full max-w-3xl px-[var(--page-x)] pb-16 pt-8 sm:pb-24">
        <Breadcrumbs
          items={[
            { label: "Accueil", href: "/" },
            { label: data.h1 }
          ]}
        />

        <header>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            {data.h1}
          </h1>
          <p className="mt-5 text-base leading-7 text-[var(--muted)] sm:text-lg">{data.intro}</p>
        </header>

        <div className="mt-12 space-y-10">
          <ContentSection title={data.problem.title}>
            {data.problem.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </ContentSection>

          <ContentSection title={data.solution.title}>
            {data.solution.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </ContentSection>

          <ContentSection title={data.howItWorks.title}>
            <ol className="list-decimal space-y-3 pl-5">
              {data.howItWorks.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </ContentSection>

          <ContentSection title={data.smsExample.title}>
            <blockquote className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-5 text-[var(--foreground)] shadow-[var(--card-shadow)]">
              {data.smsExample.message}
            </blockquote>
          </ContentSection>

          <ContentSection title={data.benefits.title}>
            <ul className="list-disc space-y-3 pl-5">
              {data.benefits.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </ContentSection>

          <ContentSection title={data.manualConfirmation.title}>
            {data.manualConfirmation.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </ContentSection>

          {data.faq.length > 0 ? (
            <ContentSection title="Questions fréquentes">
              <div className="space-y-6">
                {data.faq.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{item.question}</h3>
                    <p className="mt-2">{item.answer}</p>
                  </div>
                ))}
              </div>
            </ContentSection>
          ) : null}

          <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-soft)] p-8 text-center">
            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
              Prêt à remplir vos annulations ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
              Découvrez comment Open Spot peut aider votre commerce à proposer les places libérées
              par SMS, avec confirmation manuelle.
            </p>
            <ButtonLink className="mt-6" href={BOOK_CALL_PATH}>
              Planifier un appel
            </ButtonLink>
          </section>

          {data.relatedLinks.length > 0 ? (
            <ContentSection title="Pages connexes">
              <ul className="space-y-3">
                {data.relatedLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      className="font-semibold text-[var(--primary)] transition hover:text-[var(--primary-strong)]"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </ContentSection>
          ) : null}
        </div>

        <div className="mt-16 border-t border-[var(--line)] pt-12">
          <InternalSeoLinks />
        </div>
      </div>
    </PageShell>
  );
}
