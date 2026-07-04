import Link from "next/link";

import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { InternalSeoLinks } from "@/components/seo/InternalSeoLinks";
import { JsonLd } from "@/components/seo/JsonLd";
import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import type { ArticlePageData } from "@/lib/seo/pages";
import { BOOK_CALL_PATH } from "@/lib/seo/site";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd
} from "@/lib/seo/structured-data";

export function SeoArticlePage({ data }: { data: ArticlePageData }) {
  const breadcrumbItems = [
    { name: "Accueil", path: "/" },
    { name: data.h1, path: data.path }
  ];

  return (
    <PageShell>
      <JsonLd
        data={[
          buildArticleJsonLd({
            headline: data.h1,
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

        <article className="mt-12 space-y-10">
          {data.sections.map((section) => (
            <section className="border-t border-[var(--line)] pt-10" key={section.title}>
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">
                {section.title}
              </h2>
              <div className="mt-5 space-y-4 text-base leading-7 text-[var(--muted)]">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.list ? (
                  <ul className="space-y-4">
                    {section.list.map((item) => (
                      <li
                        className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-5 text-[var(--foreground)] shadow-[var(--card-shadow)]"
                        key={item}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </section>
          ))}

          {data.practicalExample ? (
            <section className="border-t border-[var(--line)] pt-10">
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">
                {data.practicalExample.title}
              </h2>
              <p className="mt-5 text-base leading-7 text-[var(--muted)]">
                {data.practicalExample.content}
              </p>
            </section>
          ) : null}

          {data.mistakesToAvoid ? (
            <section className="border-t border-[var(--line)] pt-10">
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">
                {data.mistakesToAvoid.title}
              </h2>
              <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-7 text-[var(--muted)]">
                {data.mistakesToAvoid.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {data.faq ? (
            <section className="border-t border-[var(--line)] pt-10">
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">
                Questions fréquentes
              </h2>
              <div className="mt-5 space-y-6 text-base leading-7 text-[var(--muted)]">
                {data.faq.map((item) => (
                  <div key={item.question}>
                    <h3 className="text-lg font-bold text-[var(--foreground)]">{item.question}</h3>
                    <p className="mt-2">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[var(--surface-soft)] p-8 text-center">
            <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)]">
              Besoin d&apos;une solution concrète ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
              Open Spot aide les commerces à proposer les places libérées par SMS, avec confirmation
              manuelle par l&apos;équipe.
            </p>
            <ButtonLink className="mt-6" href={BOOK_CALL_PATH}>
              Planifier un appel
            </ButtonLink>
          </section>

          {data.relatedLinks.length > 0 ? (
            <section className="border-t border-[var(--line)] pt-10">
              <h2 className="text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">
                Aller plus loin
              </h2>
              <ul className="mt-5 space-y-3 text-base leading-7">
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
            </section>
          ) : null}
        </article>

        <div className="mt-16 border-t border-[var(--line)] pt-12">
          <InternalSeoLinks />
        </div>
      </div>
    </PageShell>
  );
}
