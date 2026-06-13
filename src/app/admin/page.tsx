import { PageShell } from "@/components/layout/page-shell";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Card } from "@/components/ui/card";
import { getCurrentPlatformAdminAccess } from "@/lib/auth/platform-admin";
import { redirect } from "next/navigation";

const adminCards = [
  {
    title: "Organisations",
    description: "À connecter aux données plateforme."
  },
  {
    title: "Utilisateurs",
    description: "À connecter aux profils et membres d'organisations."
  },
  {
    title: "SMS",
    description: "À connecter aux messages sortants, entrants et callbacks."
  },
  {
    title: "Annulations",
    description: "À connecter aux openings et validations manuelles."
  },
  {
    title: "Rendez-vous",
    description: "À connecter aux confirmations et rappels."
  },
  {
    title: "Santé opérationnelle",
    description: "À connecter aux erreurs récentes et signaux d'activité."
  }
];

export default async function AdminPage() {
  const access = await getCurrentPlatformAdminAccess();

  if (access.status === "unauthenticated") {
    redirect("/sign-in?redirect=/admin");
  }

  if (access.status === "forbidden") {
    redirect("/dashboard");
  }

  return (
    <PageShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        {access.status === "unconfigured" ? (
          <>
            <SectionHeading
              description="L'accès admin plateforme reste verrouillé tant que la configuration serveur n'est pas complète."
              eyebrow="Admin"
              title="Admin Open Spot"
            />
            <Card className="mt-8">
              <p className="text-sm leading-6 text-[var(--muted)]">
                {access.message}
              </p>
            </Card>
          </>
        ) : (
          <>
            <SectionHeading
              description="Vue interne plateforme. Accès limité aux emails autorisés côté serveur."
              eyebrow="Admin Open Spot"
              title="Vue interne plateforme"
            />
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold">
                {access.email}
              </span>
              <a
                className="inline-flex min-h-11 items-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
                href="/dashboard"
              >
                Retour au dashboard commerce
              </a>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {adminCards.map((card) => (
                <Card key={card.title}>
                  <h2 className="text-lg font-black text-[var(--foreground)]">
                    {card.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {card.description}
                  </p>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>
    </PageShell>
  );
}
