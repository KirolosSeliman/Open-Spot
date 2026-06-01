import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";
import {
  loadDashboardOverview,
  type DashboardOverview
} from "@/lib/dashboard/real-data";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

const setupItems = [
  {
    href: "/dashboard/services",
    label: "Ajouter vos services",
    description: "Definissez les prestations qui pourront remplir une annulation."
  },
  {
    href: "/dashboard/clients",
    label: "Ajouter vos clients",
    description: "Importez ou ajoutez des clients avec leur statut de consentement."
  },
  {
    href: "/dashboard/waitlist",
    label: "Creer votre liste d'attente",
    description: "Classez les clients interesses par service et disponibilite."
  },
  {
    href: "/dashboard/new-cancellation",
    label: "Creer votre premiere annulation",
    description: "Preparez une opportunite sans envoyer de SMS reel."
  },
  {
    href: "/dashboard/messages",
    label: "Simuler une alerte SMS",
    description: "Verifiez le message avant toute integration provider."
  }
];

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

function getFallbackOverview(organizationName: string): DashboardOverview {
  return {
    organizationName,
    customersCount: 0,
    waitlistEntriesCount: 0,
    servicesCount: 0,
    openingsCount: 0,
    pendingRepliesCount: 0,
    recoveredBookingsCount: 0,
    recoveredRevenueCents: 0,
    smsSentCount: 0,
    setup: {
      hasServices: false,
      hasCustomers: false,
      hasWaitlistEntries: false,
      hasOpenings: false
    }
  };
}

export default async function DashboardPage() {
  const workspace = await getActiveOrganizationWorkspace();
  const organizationName =
    workspace.status === "ready" ? workspace.organization.name : "Open Spot";
  const overview =
    workspace.status === "ready"
      ? await loadDashboardOverview({
          organizationId: workspace.organization.id,
          organizationName: workspace.organization.name
        })
      : getFallbackOverview(organizationName);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_16px_32px_rgba(35,117,107,0.2)] transition hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            href="/dashboard/new-cancellation"
          >
            Nouvelle annulation
          </Link>
        }
        description={`Votre espace est pret. ${organizationName} utilise maintenant des donnees reelles ou des etats vides, jamais des clients de demo.`}
        title={`Tableau de bord de ${overview.organizationName}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          detail="Clients reels rattaches a cette organisation."
          label="Clients"
          value={String(overview.customersCount)}
        />
        <MetricCard
          detail="Services reels configures dans votre espace."
          label="Services"
          value={String(overview.servicesCount)}
        />
        <MetricCard
          detail="Entrees reelles de liste d'attente."
          label="Liste d'attente"
          value={String(overview.waitlistEntriesCount)}
        />
        <MetricCard
          detail="Opportunites d'annulation enregistrees."
          label="Annulations ouvertes"
          value={String(overview.openingsCount)}
          tone="amber"
        />
        <MetricCard
          detail="Messages sortants enregistres pour cette organisation."
          label="SMS envoyes"
          value={String(overview.smsSentCount)}
          tone="violet"
        />
        <MetricCard
          detail="Confirmations manuelles seulement."
          label="Rendez-vous recuperes"
          value={String(overview.recoveredBookingsCount)}
          tone="green"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          detail="Offres avec reponse client en attente de decision manuelle."
          label="Reponses en attente"
          value={String(overview.pendingRepliesCount)}
          tone="amber"
        />
        <MetricCard
          detail="Somme des bookings confirmes ou completes."
          label="Revenus estimes recuperes"
          value={formatCurrency(overview.recoveredRevenueCents)}
          tone="green"
        />
      </div>

      <Panel
        description="Commencez par ajouter vos services et vos clients."
        title="Configuration initiale"
      >
        <div className="grid gap-3 md:grid-cols-2">
          {setupItems.map((item) => (
            <Link
              className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href={item.href}
              key={item.href}
            >
              <p className="font-black text-[var(--foreground)]">{item.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Reponses recentes">
          <EmptyState
            description="Les reponses SMS reelles apparaitront ici apres une simulation ou une integration SMS."
            title="Aucune reponse pour le moment."
          />
        </Panel>
        <Panel title="Annulations recentes">
          <EmptyState
            description="Creez une premiere annulation pour suivre les clients contactes, les reponses recues et la decision finale."
            title="Aucune annulation pour le moment."
          />
        </Panel>
      </div>

      <Panel title="Apercu commercial separe">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Les donnees fictives restent disponibles dans une route separee et
          clairement etiquetee.
        </p>
        <Link
          className="mt-4 inline-flex rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black text-[var(--foreground)]"
          href="/dashboard-preview"
        >
          Ouvrir le dashboard demo
        </Link>
      </Panel>
    </div>
  );
}
