import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { InternalLinks } from "@/components/marketing/internal-links";
import { SeoFaq } from "@/components/marketing/seo-faq";
import { PageStructuredData } from "@/components/seo/page-structured-data";
import { Card } from "@/components/ui/card";
import type { CommercialSeoPage } from "@/lib/seo/public-pages";

export function IndustrySeoPage({ page }: { page: CommercialSeoPage }) {
  return (
    <PageShell>
      <PageStructuredData
        breadcrumbs={[
          { name: "Accueil", path: "/" },
          { name: "Secteurs", path: "/industries" },
          { name: page.eyebrow, path: page.path }
        ]}
        faq={page.faq}
        path={page.path}
      />

      <section className="os-container-wide min-w-0 py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="os-kicker">{page.eyebrow}</p>
          <h1 className="os-page-title mt-5">{page.h1}</h1>
          <p className="os-body-large mt-6">{page.intro}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="os-primary-cta" href="/book-call/questions">
              Réserver un appel
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line)] bg-white px-6 text-sm font-black text-[var(--foreground)] transition hover:bg-slate-100" href="/how-it-works">
              Voir le workflow
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {page.sections.map((section) => (
            <Card className="p-6" key={section.title} variant="metric">
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                {section.body}
              </p>
            </Card>
          ))}
        </div>

        <section className="mt-14 rounded-[2rem] border border-[var(--line)] bg-white p-6 shadow-[var(--card-shadow)] sm:p-8">
          <p className="os-kicker">Workflow</p>
          <h2 className="os-section-title mt-3">De l’ouverture au client confirmé</h2>
          <ol className="mt-7 grid gap-4 lg:grid-cols-5">
            {page.workflow.map((step, index) => (
              <li
                className="rounded-[1rem] border border-[var(--line)] bg-slate-50 p-5"
                key={step}
              >
                <span className="text-sm font-black text-[var(--primary)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-sm font-bold leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          <Card className="p-6" variant="soft">
            <h2 className="text-2xl font-black">Confirmation manuelle visible</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {page.manualValidationCopy}
            </p>
          </Card>
          <Card className="p-6" variant="soft">
            <h2 className="text-2xl font-black">Consentement SMS clair</h2>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {page.smsConsentCopy}
            </p>
          </Card>
        </div>

        <section className="mt-14 rounded-[2rem] bg-[#050505] p-6 text-white shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-8">
          <p className="text-sm font-black uppercase tracking-wide text-white/55">
            Exemple de SMS
          </p>
          <p className="mt-4 text-2xl font-black leading-snug">
            “{page.smsExample}”
          </p>
        </section>

        <div className="mt-14 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <SeoFaq items={page.faq} />
          <div className="grid gap-4 content-start">
            <InternalLinks links={page.internalLinks} />
            <InternalLinks links={page.relatedSectorLinks} title="Secteurs connexes" />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
