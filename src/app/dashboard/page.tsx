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
import { getDashboardCopy, intlLocale } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import {
  getBillingStatusLabel,
  canBillingStatusSendSms,
  getOrganizationSmsStatusLabel,
  type ManualBillingStatus
} from "@/lib/billing/manual-billing";
import { loadManualBillingForOrganization } from "@/lib/billing/manual-billing-data";
import { calculateAutomationOutcomeMetrics } from "@/lib/reports/metrics";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

function formatCurrency(cents: number, locale: string) {
  return new Intl.NumberFormat(locale, {
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

function getBillingBannerCopy({
  billingStatus,
  smsStatus,
  locale
}: {
  billingStatus: string | null | undefined;
  smsStatus: string | null | undefined;
  locale: "en" | "fr";
}) {
  const status = billingStatus as ManualBillingStatus | null | undefined;
  const billingAllowed = canBillingStatusSendSms(status);
  const smsActive = smsStatus === "active";

  if (billingAllowed && smsActive) {
    return null;
  }

  const copy = {
    fr: {
      title: "Activation SMS en attente",
      unpaid:
        "Votre compte n’est pas encore activé. Le paiement doit être confirmé avant l’envoi de SMS.",
      payment_link_sent:
        "Votre paiement est en attente. L’envoi SMS sera activé après confirmation.",
      past_due:
        "Votre compte est en retard de paiement. L’envoi de nouveaux SMS est temporairement suspendu.",
      cancelled:
        "Votre compte est annulé. Contactez l’équipe Open Spot pour le réactiver.",
      incomplete:
        "Configuration SMS incomplète. Vérifiez que le paiement est autorisé et que le statut SMS du commerce est actif.",
      fallback:
        "L’envoi SMS sera disponible lorsque la facturation sera autorisée et le statut SMS actif."
    },
    en: {
      title: "SMS activation pending",
      unpaid:
        "Your account is not active yet. Payment must be confirmed before SMS sending is enabled.",
      payment_link_sent:
        "Your payment is pending. SMS sending will be enabled after confirmation.",
      past_due:
        "Your account is past due. New SMS sending is temporarily paused.",
      cancelled:
        "Your account is cancelled. Contact the Open Spot team to reactivate it.",
      incomplete:
        "SMS setup is incomplete. Make sure billing is allowed and SMS status is active for this company.",
      fallback:
        "SMS sending will be available once billing is authorized and SMS status is active."
    }
  }[locale];

  if (
    status === "unpaid" ||
    status === "payment_link_sent" ||
    status === "past_due" ||
    status === "cancelled"
  ) {
    return {
      title: copy.title,
      body: copy[status]
    };
  }

  if (!billingAllowed || !smsActive) {
    return {
      title: copy.title,
      body: copy.incomplete
    };
  }

  return {
    title: copy.title,
    body: copy.fallback
  };
}

export default async function DashboardPage() {
  const [workspace, locale] = await Promise.all([
    getActiveOrganizationWorkspace(),
    getRequestLocale()
  ]);
  const copy = getDashboardCopy(locale);
  const numberFormatter = new Intl.NumberFormat(intlLocale(locale));
  const organizationName =
    workspace.status === "ready" ? workspace.organization.name : "Open Spot";
  const billing =
    workspace.status === "ready"
      ? await loadManualBillingForOrganization(workspace.organization.id).catch(
          () => null
        )
      : null;
  const billingBanner = getBillingBannerCopy({
    billingStatus: billing?.billingStatus ?? null,
    smsStatus: billing?.smsStatus ?? null,
    locale
  });
  const overview =
    workspace.status === "ready"
      ? await loadDashboardOverview({
          organizationId: workspace.organization.id,
          organizationName: workspace.organization.name
        })
      : getFallbackOverview(organizationName);
  const actionItems = [
    {
      href: "/dashboard/responses",
      label: copy.dashboard.actions.appointmentsNeedingFollowUp[0],
      value: overview.actionItems.appointmentsNeedingFollowUp,
      description: copy.dashboard.actions.appointmentsNeedingFollowUp[1]
    },
    {
      href: "/dashboard/appointments",
      label: copy.dashboard.actions.failedReminderSends[0],
      value: overview.actionItems.failedReminderSends,
      description: copy.dashboard.actions.failedReminderSends[1]
    },
    {
      href: "/dashboard/cancellations",
      label: copy.dashboard.actions.cancellationsAwaitingAction[0],
      value: overview.actionItems.cancellationsAwaitingAction,
      description: copy.dashboard.actions.cancellationsAwaitingAction[1]
    },
    {
      href: "/dashboard/responses",
      label: copy.dashboard.actions.waitlistRespondentsAwaitingValidation[0],
      value: overview.actionItems.waitlistRespondentsAwaitingValidation,
      description: copy.dashboard.actions.waitlistRespondentsAwaitingValidation[1]
    }
  ];

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <Link
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_16px_32px_rgba(79,125,243,0.22)] transition hover:bg-[var(--primary-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
            href="/dashboard/new-cancellation"
          >
            {copy.dashboard.newCancellation}
          </Link>
        }
        description={copy.dashboard.description(organizationName)}
        title={copy.dashboard.title(overview.organizationName)}
      />

      {workspace.status === "ready" && billingBanner ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-black">{billingBanner.title}</p>
              <p className="mt-1 leading-6">{billingBanner.body}</p>
            </div>
            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black">
              {billing
                ? getBillingStatusLabel(billing.billingStatus, locale)
                : locale === "fr"
                  ? "Facturation à configurer"
                  : "Billing not configured"}
              {" · "}
              {billing
                ? getOrganizationSmsStatusLabel(billing.smsStatus, locale)
                : locale === "fr"
                  ? "SMS à activer"
                  : "SMS not active"}
            </span>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          detail={copy.dashboard.metrics.customers[1]}
          label={copy.dashboard.metrics.customers[0]}
          value={String(overview.customersCount)}
        />
        <MetricCard
          detail={copy.dashboard.metrics.services[1]}
          label={copy.dashboard.metrics.services[0]}
          value={String(overview.servicesCount)}
        />
        <MetricCard
          detail={copy.dashboard.metrics.waitlist[1]}
          label={copy.dashboard.metrics.waitlist[0]}
          value={String(overview.waitlistEntriesCount)}
        />
        <MetricCard
          detail={copy.dashboard.metrics.openCancellations[1]}
          label={copy.dashboard.metrics.openCancellations[0]}
          value={String(overview.openingsCount)}
          tone="amber"
        />
        <MetricCard
          detail={copy.dashboard.metrics.smsSent[1]}
          label={copy.dashboard.metrics.smsSent[0]}
          value={String(overview.smsSentCount)}
          tone="violet"
        />
        <MetricCard
          detail={copy.dashboard.metrics.recoveredAppointments[1]}
          label={copy.dashboard.metrics.recoveredAppointments[0]}
          value={String(overview.recoveredBookingsCount)}
          tone="green"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          detail={copy.dashboard.metrics.pendingResponses[1]}
          label={copy.dashboard.metrics.pendingResponses[0]}
          value={String(overview.pendingRepliesCount)}
          tone="amber"
        />
        <MetricCard
          detail={copy.dashboard.metrics.recoveredRevenue[1]}
          label={copy.dashboard.metrics.recoveredRevenue[0]}
          value={formatCurrency(overview.recoveredRevenueCents, intlLocale(locale))}
          tone="green"
        />
      </div>

      <Panel
        description={copy.dashboard.remindersPanel.description}
        title={copy.dashboard.remindersPanel.title}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={copy.dashboard.remindersPanel.next7Days[1]}
            label={copy.dashboard.remindersPanel.next7Days[0]}
            value={String(overview.automation.appointmentsNext7Days)}
          />
          <MetricCard
            detail={copy.dashboard.remindersPanel.confirmed[1]}
            label={copy.dashboard.remindersPanel.confirmed[0]}
            value={String(overview.automation.appointmentsConfirmed)}
            tone="green"
          />
          <MetricCard
            detail={copy.dashboard.remindersPanel.awaiting[1]}
            label={copy.dashboard.remindersPanel.awaiting[0]}
            value={String(overview.automation.appointmentsAwaitingConfirmation)}
            tone="amber"
          />
          <MetricCard
            detail={copy.dashboard.remindersPanel.failed[1]}
            label={copy.dashboard.remindersPanel.failed[0]}
            value={String(overview.automation.remindersFailed)}
            tone="amber"
          />
        </div>
      </Panel>

      <Panel
        description={copy.dashboard.recoveryPanel.description}
        title={copy.dashboard.recoveryPanel.title}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            detail={copy.dashboard.recoveryPanel.smsCancellations[1]}
            label={copy.dashboard.recoveryPanel.smsCancellations[0]}
            value={String(overview.automation.appointmentsCancelledBySms)}
          />
          <MetricCard
            detail={copy.dashboard.recoveryPanel.openingsCreated[1]}
            label={copy.dashboard.recoveryPanel.openingsCreated[0]}
            value={String(overview.automation.recoveryOpeningsCreated)}
          />
          <MetricCard
            detail={copy.dashboard.recoveryPanel.recoveryReplies[1]}
            label={copy.dashboard.recoveryPanel.recoveryReplies[0]}
            value={String(overview.automation.recoveryRepliesReceived)}
            tone="amber"
          />
          <MetricCard
            detail={copy.dashboard.recoveryPanel.recoveredAfterSms[1]}
            label={copy.dashboard.recoveryPanel.recoveredAfterSms[0]}
            value={formatCurrency(
              overview.automation.recoveredAfterCancellationRevenueCents,
              intlLocale(locale)
            )}
            tone="green"
          />
        </div>
      </Panel>

      <Panel
        description={copy.dashboard.actions.description}
        title={copy.dashboard.actions.title}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {actionItems.map((item) => (
            <Link
              className="flex min-h-24 items-start justify-between gap-4 rounded-2xl border border-[var(--line)] bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href={item.href}
              key={item.label}
            >
              <span>
                <span className="block font-black text-[var(--foreground)]">
                  {item.label}
                </span>
                <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                  {item.description}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-[var(--line)] bg-white px-3 py-1 text-sm font-black text-[var(--foreground)]">
                {numberFormatter.format(item.value)}
              </span>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel
        description={copy.dashboard.setup.description}
        title={copy.dashboard.setup.title}
      >
        <div className="grid gap-3 md:grid-cols-2">
          {copy.dashboard.setup.items.map(([href, label, description]) => (
            <Link
              className="rounded-2xl border border-[var(--line)] bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              href={href}
              key={href}
            >
              <p className="font-black text-[var(--foreground)]">{label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                {description}
              </p>
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={copy.dashboard.recentResponses[0]}>
          <EmptyState
            description={copy.dashboard.recentResponses[2]}
            title={copy.dashboard.recentResponses[1]}
          />
        </Panel>
        <Panel title={copy.dashboard.recentCancellations[0]}>
          <EmptyState
            description={copy.dashboard.recentCancellations[2]}
            title={copy.dashboard.recentCancellations[1]}
          />
        </Panel>
      </div>

    </div>
  );
}
