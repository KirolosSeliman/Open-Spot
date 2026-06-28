import { DashboardHomeView } from "@/components/dashboard/home/dashboard-home-view";
import { calculateAutomationOutcomeMetrics } from "@/lib/reports/metrics";
import {
  buildDashboardOverview
} from "@/lib/dashboard/real-data";
import { loadDashboardHomeData } from "@/lib/dashboard/dashboard-home-data";
import { getDashboardCopy } from "@/lib/i18n/dashboard-copy";
import { getRequestLocale } from "@/lib/i18n/locale";
import {
  getBillingStatusLabel,
  type ManualBillingStatus
} from "@/lib/billing/manual-billing";
import { loadManualBillingForOrganization } from "@/lib/billing/manual-billing-data";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";

function getFallbackHomeData(organizationName: string): Awaited<
  ReturnType<typeof loadDashboardHomeData>
> {
  const automation = calculateAutomationOutcomeMetrics({
    now: new Date(),
    appointments: [],
    appointmentEvents: [],
    recoveryOpenings: [],
    recoveryAlerts: [],
    recoveryReplies: [],
    recoveredBookings: []
  });
  const emptyMetric = {
    value: 0,
    series: [],
    change: { percent: 0, direction: "neutral" as const, display: "0 %", isNew: false },
    comparisonLabel: ""
  };

  const overview = buildDashboardOverview({
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
    automation,
    actionItems: {
      appointmentsNeedingFollowUp: 0,
      failedReminderSends: 0,
      cancellationsAwaitingAction: 0,
      waitlistRespondentsAwaitingValidation: 0
    }
  });

  return {
    ...overview,
    range: "7d",
    rangeLabel: "",
    dateAxisLabels: [],
    metrics: {
      customers: emptyMetric,
      services: emptyMetric,
      waitlist: emptyMetric,
      openCancellations: emptyMetric,
      smsSent: emptyMetric,
      recoveredAppointments: emptyMetric,
      pendingResponses: emptyMetric,
      recoveredRevenue: emptyMetric
    },
    activityChart: {
      recoveredAppointments: [],
      openCancellations: []
    },
    keyPoints: {
      revenueText: "",
      smsText: "",
      responsesText: ""
    },
    recentResponses: [],
    recentCancellations: [],
    activityLog: [],
    setupSteps: [],
    setupCompletedCount: 0,
    remindersMetrics: {
      next7Days: emptyMetric,
      confirmed: emptyMetric,
      awaiting: emptyMetric,
      failed: emptyMetric
    },
    recoveryMetrics: {
      smsCancellations: emptyMetric,
      openingsCreated: emptyMetric,
      recoveryReplies: emptyMetric,
      recoveredAfterSms: emptyMetric
    }
  };
}

function getBillingBannerCopy({
  billingStatus,
  locale
}: {
  billingStatus: string | null | undefined;
  locale: "en" | "fr";
}) {
  const status = billingStatus as ManualBillingStatus | null | undefined;

  if (status === "paid") {
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
      fallback:
        "L’envoi SMS sera disponible lorsque la facturation et l’activation SMS seront complétées."
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
      fallback:
        "SMS sending will be available once billing and SMS activation are complete."
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

  return {
    title: copy.title,
    body: copy.fallback
  };
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const [workspace, locale] = await Promise.all([
    getActiveOrganizationWorkspace(),
    getRequestLocale()
  ]);
  const copy = getDashboardCopy(locale);
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
    locale
  });
  const data =
    workspace.status === "ready"
      ? await loadDashboardHomeData({
          organizationId: workspace.organization.id,
          organizationName: workspace.organization.name,
          rangeParam: params.range,
          locale
        })
      : getFallbackHomeData(organizationName);

  const actionItems = [
    {
      href: "/dashboard/responses",
      label: copy.dashboard.actions.appointmentsNeedingFollowUp[0],
      value: data.actionItems.appointmentsNeedingFollowUp,
      description: copy.dashboard.actions.appointmentsNeedingFollowUp[1],
      tone: "blue" as const
    },
    {
      href: "/dashboard/appointments",
      label: copy.dashboard.actions.failedReminderSends[0],
      value: data.actionItems.failedReminderSends,
      description: copy.dashboard.actions.failedReminderSends[1],
      tone: "orange" as const
    },
    {
      href: "/dashboard/cancellations",
      label: copy.dashboard.actions.cancellationsAwaitingAction[0],
      value: data.actionItems.cancellationsAwaitingAction,
      description: copy.dashboard.actions.cancellationsAwaitingAction[1],
      tone: "purple" as const
    },
    {
      href: "/dashboard/responses",
      label: copy.dashboard.actions.waitlistRespondentsAwaitingValidation[0],
      value: data.actionItems.waitlistRespondentsAwaitingValidation,
      description: copy.dashboard.actions.waitlistRespondentsAwaitingValidation[1],
      tone: "green" as const
    }
  ];

  return (
    <div className="grid gap-6">
      {workspace.status === "ready" && billingBanner ? (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-bold">{billingBanner.title}</p>
              <p className="mt-1 leading-6">{billingBanner.body}</p>
            </div>
            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-bold">
              {billing
                ? getBillingStatusLabel(billing.billingStatus, locale)
                : locale === "fr"
                  ? "Facturation à configurer"
                  : "Billing not configured"}
            </span>
          </div>
        </div>
      ) : null}

      <DashboardHomeView
        actionItems={actionItems}
        copy={copy}
        data={data}
        locale={locale}
      />
    </div>
  );
}
