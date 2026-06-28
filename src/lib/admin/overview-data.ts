import "server-only";

import { loadBookCallRequests } from "@/lib/admin/call-requests";
import {
  getFilledSpotCountFromCurrentSchema,
  loadAdminOrganizations,
  type AdminOrganizationSummary,
  type AdminTimeRange
} from "@/lib/admin/organizations";
import { buildDailyBuckets, dateKey } from "@/lib/admin/metrics";
import { aggregateSmsCost, formatEstimatedSmsCost } from "@/lib/admin/sms-cost";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  isDeliveredSmsStatus,
  isTerminalSmsStatus
} from "@/lib/sms/status-helpers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

export type SmsChartRange = AdminTimeRange;

export type AdminKpiMetric = {
  id: string;
  label: string;
  formattedValue: string;
  changeLabel: string;
  changeIsPositive: boolean;
  invertTrendColor?: boolean;
};

export type SmsDailyPoint = {
  date: string;
  label: string;
  count: number;
};

export type OperationalSummaryItem = {
  id: string;
  label: string;
  sublabel: string;
  formattedValue: string;
  href?: string;
  trendPositive?: boolean;
};

export type TopCompanyRow = {
  rank: number;
  id: string;
  name: string;
  location: string | null;
  filledSpots: number;
  responseRate: number;
  recoveredRevenueCents: number;
};

export type RecentCallRequestRow = {
  id: string;
  name: string;
  phone: string;
  businessName: string;
  status: Database["public"]["Tables"]["book_call_requests"]["Row"]["status"];
  createdAt: string;
};

export type AuditLogRow = {
  id: string;
  title: string;
  subtitle: string;
  createdAt: string;
};

export type AdminProfileInfo = {
  displayName: string;
  email: string;
  role: string;
  roleLabel: string;
  accessLabel: string;
  lastSeenAt: string | null;
  initials: string;
};

export type AdminOverviewData = {
  kpis: AdminKpiMetric[];
  smsActivity: {
    range: SmsChartRange;
    points: SmsDailyPoint[];
    maxCount: number;
  };
  operationalSummary: OperationalSummaryItem[];
  adminProfile: AdminProfileInfo;
  topCompanies: {
    rows: TopCompanyRow[];
    totalCount: number;
  };
  recentCallRequests: RecentCallRequestRow[];
  auditLogs: AuditLogRow[];
  exportPayload: {
    exportedAt: string;
    activeCompanies: number;
    outboundSms30d: number;
    estimatedSmsCost30d: string;
    filledSpots30d: number;
    failedReminders30d: number;
    topCompanies: TopCompanyRow[];
  };
};

const SMS_HISTORY_DAYS = 90;

const roleLabels: Record<string, string> = {
  super_admin: "Super administrateur",
  account_admin: "Administrateur de compte",
  support_admin: "Administrateur support",
  analyst: "Analyste"
};

const auditActionLabels: Record<string, string> = {
  "admin.audit.viewed": "Consultation du journal d'audit",
  "admin.compliance.viewed": "Consultation de la conformité",
  "admin.organization.viewed": "Consultation d'une compagnie",
  "admin.organization.sms_paused": "SMS mis en pause",
  "admin.organization.sms_resumed": "SMS repris",
  "platform_admin.bootstrap_created": "Création du compte administrateur",
  "admin.billing.payment_marked_received": "Paiement marqué reçu",
  "admin.billing.payment_reminder_sent": "Rappel de paiement envoyé"
};

function parseSmsRange(value: string | undefined): SmsChartRange {
  if (value === "7d" || value === "7") {
    return "7";
  }

  if (value === "90d" || value === "90") {
    return "90";
  }

  return "30";
}

function getRangeBounds(days: number, now = new Date()) {
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to, fromIso: from.toISOString(), toIso: to.toISOString() };
}

function getPreviousRangeBounds(days: number, now = new Date()) {
  const current = getRangeBounds(days, now);
  const to = new Date(current.from);
  to.setMilliseconds(-1);
  const from = new Date(to);
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  return { from, to, fromIso: from.toISOString(), toIso: to.toISOString() };
}

function formatPercentChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) {
      return { changeLabel: "0 %", changeIsPositive: true };
    }

    return { changeLabel: "+100 %", changeIsPositive: true };
  }

  const pct = ((current - previous) / previous) * 100;

  return {
    changeLabel: `${pct >= 0 ? "+" : ""}${pct.toLocaleString("fr-CA", {
      maximumFractionDigits: 1
    })} %`,
    changeIsPositive: pct >= 0
  };
}

function formatAbsoluteChange(current: number, previous: number) {
  const diff = current - previous;

  return {
    changeLabel: `${diff >= 0 ? "+" : ""}${diff.toLocaleString("fr-CA")}`,
    changeIsPositive: diff >= 0
  };
}

function formatShortDate(value: string, locale = "fr-CA") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();

  if (!source) {
    return "AD";
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function mapAuditTitle(action: string) {
  if (auditActionLabels[action]) {
    return auditActionLabels[action];
  }

  return action
    .replace(/^admin\./, "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildTopCompanyRows(organizations: AdminOrganizationSummary[]) {
  return [...organizations]
    .sort((left, right) => {
      if (right.filledSpotFeesCents !== left.filledSpotFeesCents) {
        return right.filledSpotFeesCents - left.filledSpotFeesCents;
      }

      return right.filledSpotsCount - left.filledSpotsCount;
    })
    .map((organization, index) => ({
      rank: index + 1,
      id: organization.id,
      name: organization.name,
      location: organization.slug,
      filledSpots: organization.filledSpotsCount,
      responseRate:
        organization.outboundSmsCount <= 0
          ? 0
          : Number(
              (
                (organization.inboundSmsCount / organization.outboundSmsCount) *
                100
              ).toFixed(1)
            ),
      recoveredRevenueCents: organization.filledSpotFeesCents
    }));
}

function buildSmsDailyPoints({
  messages,
  rangeDays,
  now = new Date()
}: {
  messages: Array<{ created_at: string }>;
  rangeDays: number;
  now?: Date;
}) {
  const { from, to } = getRangeBounds(rangeDays, now);
  const buckets = buildDailyBuckets({ from, to });
  const counts = new Map(buckets.map((date) => [date, 0]));

  for (const message of messages) {
    const key = dateKey(message.created_at);

    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const points = buckets.map((date) => ({
    date,
    label: formatShortDate(`${date}T12:00:00.000Z`),
    count: counts.get(date) ?? 0
  }));

  return {
    points,
    maxCount: Math.max(...points.map((point) => point.count), 1)
  };
}

function countSmsInRange(
  messages: Array<{ created_at: string; direction: string; status: string | null }>,
  fromIso: string,
  toIso: string,
  predicate: (row: { direction: string; status: string | null }) => boolean = () => true
) {
  const fromTime = Date.parse(fromIso);
  const toTime = Date.parse(toIso);

  return messages.filter((row) => {
    const createdAt = Date.parse(row.created_at);

    return (
      createdAt >= fromTime &&
      createdAt <= toTime &&
      predicate(row)
    );
  }).length;
}

function estimateCostForMessages(
  messages: Array<{
    id: string;
    provider: string | null;
    direction: "inbound" | "outbound";
    status: string | null;
  }>
) {
  return aggregateSmsCost(
    messages.map((row) => ({
      id: row.id,
      provider: row.provider,
      direction: row.direction,
      status: row.status,
      segments: null
    }))
  ).estimatedSmsCostCents;
}

export async function loadAdminOverviewData({
  admin,
  searchParams = {}
}: {
  admin: AuthorizedPlatformAdmin;
  searchParams?: Record<string, string | string[] | undefined>;
}): Promise<AdminOverviewData> {
  const smsRange = parseSmsRange(
    Array.isArray(searchParams.smsRange)
      ? searchParams.smsRange[0]
      : searchParams.smsRange
  );

  const [currentOrganizations, callRequestsResult] = await Promise.all([
    loadAdminOrganizations({ admin, timeRange: "30", tab: "active" }),
    loadBookCallRequests()
  ]);

  const activeOrganizations = currentOrganizations.organizations.filter(
    (organization) => !organization.archivedAt
  );
  const organizationIds = activeOrganizations.map((organization) => organization.id);
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const current30 = getRangeBounds(30);
  const previous30 = getPreviousRangeBounds(30);
  const chartRange = getRangeBounds(Number(smsRange));
  const smsLoadRange = getRangeBounds(SMS_HISTORY_DAYS);
  const next7DaysEnd = new Date();
  next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);

  const [
    smsMessagesResult,
    scheduledFailedCurrentResult,
    scheduledFailedPreviousResult,
    scheduledUpcomingResult,
    complianceReviewsResult,
    controlsResult,
    auditLogsResult,
    adminRecordResult,
    profileResult,
    openingsResult,
    offersResult
  ] = await Promise.all([
    organizationIds.length > 0
      ? supabase
          .from("sms_messages")
          .select("id, organization_id, direction, provider, status, created_at")
          .in("organization_id", organizationIds)
          .eq("direction", "outbound")
          .gte("created_at", smsLoadRange.fromIso)
          .lte("created_at", smsLoadRange.toIso)
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length > 0
      ? supabase
          .from("scheduled_messages")
          .select("id", { count: "exact", head: true })
          .in("organization_id", organizationIds)
          .eq("status", "failed")
          .gte("failed_at", current30.fromIso)
          .lte("failed_at", current30.toIso)
      : Promise.resolve({ count: 0, error: null }),
    organizationIds.length > 0
      ? supabase
          .from("scheduled_messages")
          .select("id", { count: "exact", head: true })
          .in("organization_id", organizationIds)
          .eq("status", "failed")
          .gte("failed_at", previous30.fromIso)
          .lte("failed_at", previous30.toIso)
      : Promise.resolve({ count: 0, error: null }),
    organizationIds.length > 0
      ? supabase
          .from("scheduled_messages")
          .select("id", { count: "exact", head: true })
          .in("organization_id", organizationIds)
          .eq("status", "pending")
          .gte("scheduled_for", new Date().toISOString())
          .lte("scheduled_for", next7DaysEnd.toISOString())
      : Promise.resolve({ count: 0, error: null }),
    organizationIds.length > 0
      ? supabase
          .from("platform_compliance_reviews")
          .select("organization_id, status, severity")
          .in("organization_id", organizationIds)
          .eq("status", "open")
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length > 0
      ? supabase
          .from("platform_organization_admin_controls")
          .select("organization_id, archived_at, sms_sending_paused")
          .in("organization_id", organizationIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("platform_admin_audit_logs")
      .select("id, action, admin_email, organization_id, created_at")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("platform_admins")
      .select("last_seen_at")
      .eq("id", admin.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name")
      .eq("auth_user_id", admin.userId)
      .maybeSingle(),
    organizationIds.length > 0
      ? supabase
          .from("openings")
          .select("id, organization_id, status, created_at, updated_at")
          .in("organization_id", organizationIds)
      : Promise.resolve({ data: [], error: null }),
    organizationIds.length > 0
      ? supabase
          .from("opening_offers")
          .select("id, organization_id, opening_id, status, created_at, updated_at")
          .in("organization_id", organizationIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (smsMessagesResult.error) {
    throw new Error(smsMessagesResult.error.message);
  }

  if (scheduledFailedCurrentResult.error) {
    throw new Error(scheduledFailedCurrentResult.error.message);
  }

  if (scheduledFailedPreviousResult.error) {
    throw new Error(scheduledFailedPreviousResult.error.message);
  }

  if (scheduledUpcomingResult.error) {
    throw new Error(scheduledUpcomingResult.error.message);
  }

  if (complianceReviewsResult.error) {
    throw new Error(complianceReviewsResult.error.message);
  }

  if (controlsResult.error) {
    throw new Error(controlsResult.error.message);
  }

  if (auditLogsResult.error) {
    throw new Error(auditLogsResult.error.message);
  }

  if (adminRecordResult.error) {
    throw new Error(adminRecordResult.error.message);
  }

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (openingsResult.error) {
    throw new Error(openingsResult.error.message);
  }

  if (offersResult.error) {
    throw new Error(offersResult.error.message);
  }

  const smsMessages = smsMessagesResult.data ?? [];
  const outboundCurrent30 = countSmsInRange(
    smsMessages,
    current30.fromIso,
    current30.toIso,
    (row) => row.direction === "outbound"
  );
  const outboundPrevious30 = countSmsInRange(
    smsMessages,
    previous30.fromIso,
    previous30.toIso,
    (row) => row.direction === "outbound"
  );
  const currentCostCents = estimateCostForMessages(
    smsMessages.filter(
      (row) =>
        Date.parse(row.created_at) >= Date.parse(current30.fromIso) &&
        Date.parse(row.created_at) <= Date.parse(current30.toIso)
    )
  );
  const previousCostCents = estimateCostForMessages(
    smsMessages.filter(
      (row) =>
        Date.parse(row.created_at) >= Date.parse(previous30.fromIso) &&
        Date.parse(row.created_at) <= Date.parse(previous30.toIso)
    )
  );
  const openings = openingsResult.data ?? [];
  const offers = offersResult.data ?? [];
  const currentRangeOpenings = openings.filter(
    (row) =>
      Date.parse(row.created_at) >= Date.parse(current30.fromIso) &&
      Date.parse(row.created_at) <= Date.parse(current30.toIso)
  );
  const currentRangeOffers = offers.filter(
    (row) =>
      Date.parse(row.created_at) >= Date.parse(current30.fromIso) &&
      Date.parse(row.created_at) <= Date.parse(current30.toIso)
  );
  const previousRangeOpenings = openings.filter(
    (row) =>
      Date.parse(row.created_at) >= Date.parse(previous30.fromIso) &&
      Date.parse(row.created_at) <= Date.parse(previous30.toIso)
  );
  const previousRangeOffers = offers.filter(
    (row) =>
      Date.parse(row.created_at) >= Date.parse(previous30.fromIso) &&
      Date.parse(row.created_at) <= Date.parse(previous30.toIso)
  );
  const filledSpotsCurrent = [...getFilledSpotCountFromCurrentSchema({
    openings: currentRangeOpenings,
    openingOffers: currentRangeOffers
  }).values()].reduce((total, count) => total + count, 0);
  const filledSpotsPrevious = [...getFilledSpotCountFromCurrentSchema({
    openings: previousRangeOpenings,
    openingOffers: previousRangeOffers
  }).values()].reduce((total, count) => total + count, 0);

  const newlyActiveCurrent = activeOrganizations.filter(
    (organization) => Date.parse(organization.createdAt) >= Date.parse(current30.fromIso)
  ).length;
  const newlyActivePrevious = activeOrganizations.filter((organization) => {
    const createdAt = Date.parse(organization.createdAt);

    return (
      createdAt >= Date.parse(previous30.fromIso) &&
      createdAt <= Date.parse(previous30.toIso)
    );
  }).length;

  const failedRemindersCurrent = scheduledFailedCurrentResult.count ?? 0;
  const failedRemindersPrevious = scheduledFailedPreviousResult.count ?? 0;

  const terminalOutboundCurrent = smsMessages.filter(
    (row) =>
      Date.parse(row.created_at) >= Date.parse(current30.fromIso) &&
      Date.parse(row.created_at) <= Date.parse(current30.toIso) &&
      isTerminalSmsStatus(row.status)
  );
  const deliveredCurrent = terminalOutboundCurrent.filter((row) =>
    isDeliveredSmsStatus(row.status)
  ).length;
  const deliverabilityRate =
    terminalOutboundCurrent.length === 0
      ? 100
      : Number(((deliveredCurrent / terminalOutboundCurrent.length) * 100).toFixed(1));

  const inboundCurrent = await (async () => {
    if (organizationIds.length === 0) {
      return 0;
    }

    const { count, error } = await supabase
      .from("sms_messages")
      .select("id", { count: "exact", head: true })
      .in("organization_id", organizationIds)
      .eq("direction", "inbound")
      .gte("created_at", current30.fromIso)
      .lte("created_at", current30.toIso);

    if (error) {
      throw new Error(error.message);
    }

    return count ?? 0;
  })();

  const responseRate =
    outboundCurrent30 <= 0
      ? 0
      : Number(((inboundCurrent / outboundCurrent30) * 100).toFixed(1));

  const controlsByOrg = new Map(
    (controlsResult.data ?? []).map((row) => [row.organization_id, row])
  );
  const openReviewOrgIds = new Set(
    (complianceReviewsResult.data ?? [])
      .filter((row) => row.severity === "high" || row.severity === "medium")
      .map((row) => row.organization_id)
  );

  const compliantOrganizations = activeOrganizations.filter((organization) => {
    const controls = controlsByOrg.get(organization.id);

    if (controls?.archived_at || controls?.sms_sending_paused) {
      return false;
    }

    return !openReviewOrgIds.has(organization.id);
  }).length;

  const chartMessages = smsMessages.filter(
    (row) =>
      Date.parse(row.created_at) >= Date.parse(chartRange.fromIso) &&
      Date.parse(row.created_at) <= Date.parse(chartRange.toIso)
  );
  const smsActivity = buildSmsDailyPoints({
    messages: chartMessages,
    rangeDays: Number(smsRange)
  });

  const topCompaniesAll = buildTopCompanyRows(activeOrganizations);

  const organizationNameById = new Map(
    activeOrganizations.map((organization) => [organization.id, organization.name])
  );

  const displayName = profileResult.data?.full_name?.trim() || admin.email;
  const adminProfile: AdminProfileInfo = {
    displayName,
    email: admin.email,
    role: admin.role,
    roleLabel: roleLabels[admin.role] ?? admin.role,
    accessLabel: admin.role === "super_admin" ? "Tous les comptes" : "Comptes assignés",
    lastSeenAt: adminRecordResult.data?.last_seen_at ?? null,
    initials: getInitials(displayName, admin.email)
  };

  const activeCompaniesChange = formatAbsoluteChange(
    newlyActiveCurrent,
    newlyActivePrevious
  );
  const filledSpotsChange = formatPercentChange(filledSpotsCurrent, filledSpotsPrevious);
  const smsSentChange = formatPercentChange(outboundCurrent30, outboundPrevious30);
  const smsCostChange = formatPercentChange(currentCostCents, previousCostCents);
  const failedReminderChange = formatAbsoluteChange(
    failedRemindersCurrent,
    failedRemindersPrevious
  );

  return {
    kpis: [
      {
        id: "active-companies",
        label: "Compagnies actives",
        formattedValue: activeOrganizations.length.toLocaleString("fr-CA"),
        changeLabel: activeCompaniesChange.changeLabel,
        changeIsPositive: activeCompaniesChange.changeIsPositive
      },
      {
        id: "sms-sent",
        label: "SMS envoyés (30 j)",
        formattedValue: outboundCurrent30.toLocaleString("fr-CA"),
        changeLabel: smsSentChange.changeLabel,
        changeIsPositive: smsSentChange.changeIsPositive
      },
      {
        id: "sms-cost",
        label: "Coût SMS estimé (30 j)",
        formattedValue: formatEstimatedSmsCost(currentCostCents),
        changeLabel: smsCostChange.changeLabel,
        changeIsPositive: currentCostCents <= previousCostCents,
        invertTrendColor: true
      },
      {
        id: "filled-spots",
        label: "Créneaux récupérés (30 j)",
        formattedValue: filledSpotsCurrent.toLocaleString("fr-CA"),
        changeLabel: filledSpotsChange.changeLabel,
        changeIsPositive: filledSpotsChange.changeIsPositive
      },
      {
        id: "failed-reminders",
        label: "Rappels échoués (30 j)",
        formattedValue: failedRemindersCurrent.toLocaleString("fr-CA"),
        changeLabel: failedReminderChange.changeLabel,
        changeIsPositive: failedRemindersCurrent <= failedRemindersPrevious,
        invertTrendColor: true
      }
    ],
    smsActivity: {
      range: smsRange,
      points: smsActivity.points,
      maxCount: smsActivity.maxCount
    },
    operationalSummary: [
      {
        id: "deliverability",
        label: "Taux de délivrabilité",
        sublabel: "30 derniers jours",
        formattedValue: `${deliverabilityRate.toLocaleString("fr-CA")} %`,
        trendPositive: deliverabilityRate >= 95
      },
      {
        id: "response-rate",
        label: "Taux de réponse",
        sublabel: "30 derniers jours",
        formattedValue: `${responseRate.toLocaleString("fr-CA")} %`,
        trendPositive: responseRate > 0
      },
      {
        id: "compliance",
        label: "Conformité active",
        sublabel: "Compagnies conformes",
        formattedValue: `${compliantOrganizations.toLocaleString("fr-CA")} / ${activeOrganizations.length.toLocaleString("fr-CA")}`,
        trendPositive: compliantOrganizations === activeOrganizations.length
      },
      {
        id: "scheduled-reminders",
        label: "Rappels planifiés",
        sublabel: "Prochains 7 jours",
        formattedValue: (scheduledUpcomingResult.count ?? 0).toLocaleString("fr-CA"),
        href: "/admin/sms"
      }
    ],
    adminProfile,
    topCompanies: {
      rows: topCompaniesAll,
      totalCount: topCompaniesAll.length
    },
    recentCallRequests: (callRequestsResult.requests ?? []).slice(0, 4).map((request) => ({
      id: request.id,
      name: request.full_name,
      phone: request.phone,
      businessName: request.business_name,
      status: request.status,
      createdAt: request.created_at
    })),
    auditLogs: (auditLogsResult.data ?? []).map((row) => ({
      id: row.id,
      title: mapAuditTitle(row.action),
      subtitle:
        (row.organization_id
          ? organizationNameById.get(row.organization_id)
          : null) ?? row.admin_email ?? "Plateforme",
      createdAt: row.created_at
    })),
    exportPayload: {
      exportedAt: new Date().toISOString(),
      activeCompanies: activeOrganizations.length,
      outboundSms30d: outboundCurrent30,
      estimatedSmsCost30d: formatEstimatedSmsCost(currentCostCents),
      filledSpots30d: filledSpotsCurrent,
      failedReminders30d: failedRemindersCurrent,
      topCompanies: topCompaniesAll.slice(0, 5)
    }
  };
}
