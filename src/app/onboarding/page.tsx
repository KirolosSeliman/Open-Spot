import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createOrganizationAction } from "@/lib/organization/actions";
import { requireOrganizationOnboardingUser } from "@/lib/organization/current";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function OnboardingPage({
  searchParams
}: OnboardingPageProps) {
  await requireOrganizationOnboardingUser();
  const { error } = await searchParams;

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <SectionHeading
          description="Create the organization workspace that will own services, customers, waitlist entries, openings, SMS logs, and reports."
          eyebrow="Organization onboarding"
          title="Set up your merchant workspace."
        />
        <Card className="mt-8">
          {error ? (
            <p className="mb-4 rounded-md border border-[#f2b8b5] bg-[#fdebea] p-3 text-sm text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <form action={createOrganizationAction} className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold" htmlFor="name">
                Business name
                <input
                  className="min-h-11 rounded-md border border-[var(--line)] px-3"
                  id="name"
                  name="name"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold" htmlFor="slug">
                Slug
                <input
                  className="min-h-11 rounded-md border border-[var(--line)] px-3"
                  id="slug"
                  name="slug"
                  placeholder="auto-generated if empty"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold" htmlFor="email">
                Business email
                <input
                  className="min-h-11 rounded-md border border-[var(--line)] px-3"
                  id="email"
                  name="email"
                  type="email"
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold" htmlFor="phone">
                Business phone
                <input
                  className="min-h-11 rounded-md border border-[var(--line)] px-3"
                  id="phone"
                  name="phone"
                />
              </label>
              <label
                className="grid gap-2 text-sm font-semibold"
                htmlFor="timezone"
              >
                Timezone
                <select
                  className="min-h-11 rounded-md border border-[var(--line)] px-3"
                  defaultValue="America/Toronto"
                  id="timezone"
                  name="timezone"
                >
                  <option value="America/Toronto">America/Toronto</option>
                  <option value="America/Montreal">America/Montreal</option>
                </select>
              </label>
              <label
                className="grid gap-2 text-sm font-semibold"
                htmlFor="defaultLanguage"
              >
                Default language
                <select
                  className="min-h-11 rounded-md border border-[var(--line)] px-3"
                  defaultValue="fr"
                  id="defaultLanguage"
                  name="defaultLanguage"
                >
                  <option value="fr">Francais</option>
                  <option value="en">English</option>
                </select>
              </label>
            </div>
            <Button type="submit">Create organization</Button>
          </form>
        </Card>
      </section>
    </PageShell>
  );
}
