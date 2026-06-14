import Link from "next/link";

import {
  DashboardPageHeader,
  MetricCard,
  Panel
} from "@/components/dashboard/dashboard-ui";
import {
  getAnalyticsPeriodWindow,
  loadDashboardOverview,
  normalizeAnalyticsPeriod,
  type DashboardOverview
} from "@/lib/dashboard/real-data";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { calculateAutomationOutcomeMetrics } from "@/lib/reports/metrics";

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
    openingAlertsSentCount: 0,
    openingResponsesCount: 0,
    openingResponseRate: 0,
    automation: calculateAutomationOutcomeMetrics({
      now: new Date(),
      appointments: [],
      appointmentEvents: [],
      recoveryOpenings: [],
      recoveryAlerts: [],
      recoveryReplies: [],
      recoveredBookings: []
    }),
    actionItems: {
      appointmentsNeedingFollowUp: 0,
      failedReminderSends: 0,
      cancellationsAwaitingAction: 0,
      waitlistRespondentsAwaitingValidation: 0
    },
    setup: {
      hasServices: false,
      hasCustomers: false,
      hasWaitlistEntries: false,
      hasOpenings: false
    }
  };
}

const periodLabels = {
  current_month: "Mois courant",
  current_year: "Annee courante",
  last_30_days: "30 derniers jours"
};

export default async function AnalyticsPage({
  searchParams
}: {
  searchParams: Promise<{
    period?: string;
  }>;
}) {
  const { period: rawPeriod } = await searchParams;
  const period = normalizeAnalyticsPeriod(rawPeriod);
  const periodWindow = getAnalyticsPeriodWindow(period);
  const workspace = await getActiveOrganizationWorkspace();
  const organizationName =
    workspace.status === "ready" ? workspace.organization.name : "Open Spot";
  const overview =
    workspace.status === "ready"
      ? await loadDashboardOverview({
          organizationId: workspace.organization.id,
          organizationName: workspace.organization.name,
          periodWindow
        })
      : getFallbackOverview(organizationName);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description={`Indicateurs reels de l'organisation bases sur les donnees operationnelles. Periode: ${periodLabels[period]}.`}
        title="Statistiques"
      />
      <div className="flex flex-wrap gap-2">
        {Object.entries(periodLabels).map(([value, label]) => (
          <Link
            aria-current={period === value ? "page" : undefined}
            className={
              period === value
                ? "rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white"
                : "rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black text-[var(--ink)]"
            }
            href={`/dashboard/analytics?period=${value}`}
            key={value}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          detail="Somme des bookings confirmes ou completes."
          label="Revenus recuperes"
          value={formatCurrency(overview.recoveredRevenueCents)}
          tone="green"
        />
        <MetricCard
          detail="Confirmations faites manuellement."
          label="Annulations recuperees"
          value={String(overview.recoveredBookingsCount)}
          tone="green"
        />
        <MetricCard
          detail="Messages sortants enregistres."
          label="SMS envoyes"
          value={String(overview.smsSentCount)}
        />
        <MetricCard
          detail="Reponses recues sur les alertes d'ouverture envoyees."
          label="Taux de reponse"
          value={`${overview.openingResponseRate}%`}
          tone="violet"
        />
        <MetricCard
          detail="Rappels 24 h envoyes ou simules."
          label="Rappels envoyes"
          value={String(overview.automation.remindersSent)}
          tone="violet"
        />
        <MetricCard
          detail="Rappels marques skipped ou failed."
          label="Rappels a verifier"
          value={String(
            overview.automation.remindersSkipped +
              overview.automation.remindersFailed
          )}
          tone="amber"
        />
        <MetricCard
          detail="Rendez-vous annules par reponse SMS."
          label="Annulations SMS"
          value={String(overview.automation.appointmentsCancelledBySms)}
          tone="amber"
        />
      </div>
      <Panel title="Recuperation issue des annulations SMS">
        <p className="text-sm leading-6 text-[var(--muted)]">
          {overview.automation.recoveryOpeningsCreated} ouverture(s) creee(s),
          {" "}
          {overview.automation.recoveryAlertsSent} alerte(s) envoyee(s),{" "}
          {overview.automation.recoveryRepliesReceived} reponse(s) recue(s),{" "}
          {overview.automation.recoveredAfterCancellationCount} recuperation(s)
          validee(s) par le commercant.
        </p>
      </Panel>
    </div>
  );
}
