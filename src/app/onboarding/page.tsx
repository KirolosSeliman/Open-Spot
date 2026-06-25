import { PageShell } from "@/components/layout/page-shell";
import { OrganizationOnboardingForm } from "@/components/onboarding/organization-onboarding-form";
import { Card } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createOrganizationAction } from "@/lib/organization/actions";
import { requireOrganizationOnboardingUser } from "@/lib/organization/current";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const onboardingCopy = {
  fr: {
    eyebrow: "Configuration",
    title: "Configurez votre commerce.",
    description:
      "Cet espace possédera les services, clients, inscriptions à la liste d’attente, ouvertures, journaux SMS et rapports.",
    checklistTitle: "À préserver dès le départ",
    checklist: ["Nom public clair", "Langue par défaut", "Téléphone et email du commerce", "URL de liste d’attente stable"]
  },
  en: {
    eyebrow: "Setup",
    title: "Configure your business.",
    description:
      "This workspace owns services, customers, waitlist entries, openings, SMS logs, and reports.",
    checklistTitle: "Preserve from day one",
    checklist: ["Clear public name", "Default language", "Business phone and email", "Stable waitlist URL"]
  }
} as const;

export default async function OnboardingPage({
  searchParams
}: OnboardingPageProps) {
  await requireOrganizationOnboardingUser();
  const locale = await getRequestLocale();
  const t = onboardingCopy[locale];
  const { error } = await searchParams;

  return (
    <PageShell>
      <section className="os-container-wide grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-24">
        <div>
          <p className="os-kicker">{t.eyebrow}</p>
          <h1 className="os-page-title mt-5">{t.title}</h1>
          <p className="os-body-large mt-6">{t.description}</p>
          <Card className="mt-8 p-5">
            <h2 className="text-xl font-black">{t.checklistTitle}</h2>
            <div className="mt-5 grid gap-3">
              {t.checklist.map((item) => (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </Card>
        </div>
        <OrganizationOnboardingForm
          action={createOrganizationAction}
          error={error}
          locale={locale}
        />
      </section>
    </PageShell>
  );
}
