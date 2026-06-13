import type {
  AuthorizedPlatformAdmin,
  PlatformAdminAccessLevel,
  PlatformAdminRole
} from "@/lib/auth/platform-admin";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import type { AdminDateRange } from "@/lib/admin/date-range";
import {
  buildDailyBuckets,
  calculateCostPerFilledSpotCents,
  dateKey,
  maskPhoneNumber
} from "@/lib/admin/metrics";
import { canOpenPlatformAdminManagerMode } from "@/lib/admin/manager-mode";
import {
  aggregateSmsCost,
  estimateSmsCostCents
} from "@/lib/admin/sms-cost";
import {
  aggregateFilledSpotFees,
  defaultBillingTerms,
  formatBillingTermsSummary,
  type BillingTerms,
  type FilledSpotForBilling
} from "@/lib/admin/billing-terms";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

export type AdminTimeRange = "7" | "30" | "90";

type OrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "id" | "name" | "slug" | "email" | "created_at" | "updated_at"
>;
type MemberRow = Pick<
  Database["public"]["Tables"]["organization_members"]["Row"],
  "organization_id" | "user_id" | "role" | "status" | "created_at"
>;
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "auth_user_id" | "email" | "full_name"
>;
type CustomerRow = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  "id" | "organization_id" | "full_name" | "phone_e164" | "created_at"
>;
type ConsentRow = Pick<
  Database["public"]["Tables"]["sms_consents"]["Row"],
  "organization_id" | "status" | "created_at"
>;
type OpeningRow = Pick<
  Database["public"]["Tables"]["openings"]["Row"],
  | "id"
  | "organization_id"
  | "service_id"
  | "title"
  | "start_time"
  | "status"
  | "created_at"
  | "updated_at"
>;
type OpeningOfferRow = Pick<
  Database["public"]["Tables"]["opening_offers"]["Row"],
  | "id"
  | "organization_id"
  | "opening_id"
  | "customer_id"
  | "status"
  | "responded_at"
  | "response_rank"
  | "created_at"
  | "updated_at"
>;
type SmsMessageRow = Pick<
  Database["public"]["Tables"]["sms_messages"]["Row"],
  | "id"
  | "organization_id"
  | "opening_id"
  | "appointment_id"
  | "direction"
  | "provider"
  | "provider_message_id"
  | "to_number"
  | "status"
  | "error_code"
  | "error_message"
  | "created_at"
>;
type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "organization_id" | "created_at" | "updated_at"
>;
type AccessRow = Pick<
  Database["public"]["Tables"]["platform_admin_organization_access"]["Row"],
  "organization_id" | "access_level" | "revoked_at"
>;
type AdminControlsRow = Pick<
  Database["public"]["Tables"]["platform_organization_admin_controls"]["Row"],
  "organization_id" | "archived_at" | "archived_reason"
>;
type BillingTermsRow = Pick<
  Database["public"]["Tables"]["platform_organization_billing_terms"]["Row"],
  | "organization_id"
  | "currency"
  | "monthly_subscription_cents"
  | "filled_spot_fee_mode"
  | "filled_spot_fixed_fee_cents"
  | "filled_spot_percentage_bps"
>;

export type AdminOrganizationAccessRow = {
  organizationId: string;
  accessLevel: PlatformAdminAccessLevel;
  revokedAt: string | null;
};

export type AdminOrganizationSummary = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  archivedAt: string | null;
  archivedReason: string | null;
  createdAt: string;
  ownerEmail: string | null;
  ownerName: string | null;
  accessLevel: PlatformAdminAccessLevel | "super_admin";
  customersCount: number;
  optedInCustomersCount: number;
  openingsCount: number;
  filledSpotsCount: number;
  outboundSmsCount: number;
  inboundSmsCount: number;
  failedSmsCount: number;
  estimatedSmsCostCents: number;
  billingTermsSummary: string;
  monthlySubscriptionCents: number;
  filledSpotFeesCents: number;
  estimatedContributionCents: number;
  lastActivityAt: string | null;
};

export type AdminOrganizationsResult = {
  organizations: AdminOrganizationSummary[];
  totalCount: number;
  filteredCount: number;
  activeCount: number;
  archivedCount: number;
  tab: "active" | "archived";
  timeRange: AdminTimeRange;
  query: string;
};

export type AdminOverview = {
  admin: AuthorizedPlatformAdmin;
  visibleCompaniesCount: number;
  outboundSmsCount: number;
  estimatedSmsCostCents: number;
  filledSpotsCount: number;
};

export type AdminOrganizationOverview = {
  organization: {
    id: string;
    name: string;
    slug: string | null;
    status: string | null;
    createdAt: string;
    timezone: string | null;
    defaultLanguage: string | null;
    ownerEmail: string | null;
    ownerName: string | null;
  };
  access: {
    adminRole: PlatformAdminRole;
    accessLevel: PlatformAdminAccessLevel | "super_admin";
    canOpenManagerMode: boolean;
  };
  range: {
    label: string;
    fromIso: string;
    toIso: string;
    rangeKey: string;
  };
  kpis: {
    customersTotal: number;
    customersCreatedInRange: number;
    optedInCustomers: number;
    optedOutCustomers: number;
    waitlistEntriesActive: number;
    openingsCreated: number;
    positiveReplies: number;
    pendingValidations: number;
    filledSpots: number;
    outboundSms: number;
    inboundSms: number;
    deliveredSms: number;
    failedSms: number;
    unknownOrUnlinkedReplies: number;
    estimatedSmsCostCents: number;
    estimatedCostPerFilledSpotCents: number | null;
    recoveredValueCents: number | null;
  };
  billing: {
    terms: BillingTerms;
    notes: string | null;
    filledSpotsInRange: number;
    filledSpotFeesInRangeCents: number;
    estimatedSmsCostInRangeCents: number;
    estimatedContributionInRangeCents: number;
    warnings: string[];
  };
  charts: {
    filledSpotsByDay: Array<{ date: string; count: number }>;
    smsCostByDay: Array<{
      date: string;
      estimatedCostCents: number;
      outboundSms: number;
    }>;
    customerGrowthByDay: Array<{
      date: string;
      customersTotal: number;
      optedInCustomers: number;
    }>;
    smsVolumeByDay: Array<{
      date: string;
      outbound: number;
      inbound: number;
      failed: number;
    }>;
  };
  recent: {
    openings: Array<{
      id: string;
      title: string;
      serviceName: string | null;
      startTime: string | null;
      status: string;
      positiveReplies: number;
      pendingValidations: number;
      filledSpots: number;
      createdAt: string;
    }>;
    failedSms: Array<{
      id: string;
      provider: string;
      providerMessageId: string | null;
      toNumberMasked: string;
      status: string;
      errorCode: string | null;
      errorMessage: string | null;
      createdAt: string;
    }>;
    pendingValidations: Array<{
      openingId: string;
      openingTitle: string;
      customerName: string;
      customerPhoneMasked: string;
      responseRank: number | null;
      respondedAt: string | null;
    }>;
  };
  warnings: string[];
};

type FilledSpotOpening = {
  id?: string;
  organizationId?: string;
  organization_id?: string;
  status: string;
};

type FilledSpotOffer = {
  openingId?: string | null;
  opening_id?: string | null;
  organizationId?: string;
  organization_id?: string;
  status: string;
};

function normalizeSearch(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function compactSearch(value: string | null | undefined) {
  return normalizeSearch(value).replace(/\s+/g, "");
}

function getOrganizationId(row: {
  organizationId?: string;
  organization_id?: string;
}) {
  return row.organizationId ?? row.organization_id ?? null;
}

function isInRange(value: string, rangeStart: Date) {
  return Date.parse(value) >= rangeStart.getTime();
}

function getRangeStart(range: AdminTimeRange, now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - Number(range));
  return start;
}

function rowsOrEmpty<T>(result: {
  data: T[] | null;
  error: { message: string } | null;
}) {
  if (result.error) {
    console.error("Admin organization query failed:", result.error.message);
    return [];
  }

  return result.data ?? [];
}

function countByOrg<T extends { organization_id: string }>(
  rows: T[],
  predicate: (row: T) => boolean = () => true
) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (predicate(row)) {
      counts.set(row.organization_id, (counts.get(row.organization_id) ?? 0) + 1);
    }
  }

  return counts;
}

function maxIso(values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter(Number.isFinite);

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function matchesOrganizationSearch(
  organization: AdminOrganizationSummary,
  query: string
) {
  const normalizedQuery = normalizeSearch(query);
  const compactQuery = compactSearch(query);

  if (!normalizedQuery && !compactQuery) {
    return true;
  }

  const haystackValues = [
    organization.name,
    organization.slug,
    organization.ownerEmail,
    organization.ownerName
  ];
  const haystack = normalizeSearch(haystackValues.join(" "));
  const compactHaystack = compactSearch(haystackValues.join(" "));

  if (normalizedQuery && haystack.includes(normalizedQuery)) {
    return true;
  }

  if (compactQuery && compactHaystack.includes(compactQuery)) {
    return true;
  }

  return normalizedQuery
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => haystack.includes(token) || compactHaystack.includes(token));
}

function toAdminAccessRows(rows: AccessRow[]): AdminOrganizationAccessRow[] {
  return rows.map((row) => ({
    organizationId: row.organization_id,
    accessLevel: row.access_level,
    revokedAt: row.revoked_at
  }));
}

function buildAccessByOrganization(
  adminRole: PlatformAdminRole,
  accessRows: AdminOrganizationAccessRow[]
) {
  const accessByOrganization = new Map<
    string,
    PlatformAdminAccessLevel | "super_admin"
  >();

  if (adminRole === "super_admin") {
    return accessByOrganization;
  }

  for (const row of accessRows) {
    if (!row.revokedAt) {
      accessByOrganization.set(row.organizationId, row.accessLevel);
    }
  }

  return accessByOrganization;
}

export function normalizeAdminTimeRange(value: string | null | undefined) {
  if (value === "7" || value === "30" || value === "90") {
    return value;
  }

  return "30";
}

export function filterAccessibleOrganizationIds({
  adminRole,
  allOrganizationIds,
  accessRows
}: {
  adminRole: PlatformAdminRole;
  allOrganizationIds: string[];
  accessRows: AdminOrganizationAccessRow[];
}) {
  if (adminRole === "super_admin") {
    return allOrganizationIds;
  }

  const assignedIds = new Set(
    accessRows
      .filter((row) => !row.revokedAt)
      .map((row) => row.organizationId)
  );

  return allOrganizationIds.filter((organizationId) =>
    assignedIds.has(organizationId)
  );
}

export function canPlatformAdminAccessOrganization({
  adminRole,
  organizationId,
  accessRows
}: {
  adminRole: PlatformAdminRole;
  organizationId: string;
  accessRows: AdminOrganizationAccessRow[];
}) {
  if (adminRole === "super_admin") {
    return true;
  }

  return accessRows.some(
    (row) => row.organizationId === organizationId && !row.revokedAt
  );
}

export function getFilledSpotCountFromCurrentSchema({
  openings,
  openingOffers
}: {
  openings: FilledSpotOpening[];
  openingOffers: FilledSpotOffer[];
}) {
  const filledOpeningKeys = new Map<string, Set<string>>();
  const selectedOfferKeys = new Map<string, Set<string>>();
  const filledOpeningFallbackCounts = new Map<string, number>();
  const selectedOfferFallbackCounts = new Map<string, number>();

  for (const opening of openings) {
    const organizationId = getOrganizationId(opening);

    if (!organizationId || opening.status !== "filled") {
      continue;
    }

    if (opening.id) {
      const keys = filledOpeningKeys.get(organizationId) ?? new Set<string>();
      keys.add(opening.id);
      filledOpeningKeys.set(organizationId, keys);
    } else {
      filledOpeningFallbackCounts.set(
        organizationId,
        (filledOpeningFallbackCounts.get(organizationId) ?? 0) + 1
      );
    }
  }

  for (const offer of openingOffers) {
    const organizationId = getOrganizationId(offer);

    if (!organizationId || offer.status !== "selected") {
      continue;
    }

    const openingId = offer.openingId ?? offer.opening_id ?? null;

    if (openingId) {
      const keys = selectedOfferKeys.get(organizationId) ?? new Set<string>();
      keys.add(openingId);
      selectedOfferKeys.set(organizationId, keys);
    } else {
      selectedOfferFallbackCounts.set(
        organizationId,
        (selectedOfferFallbackCounts.get(organizationId) ?? 0) + 1
      );
    }
  }

  const organizationIds = new Set([
    ...filledOpeningKeys.keys(),
    ...selectedOfferKeys.keys(),
    ...filledOpeningFallbackCounts.keys(),
    ...selectedOfferFallbackCounts.keys()
  ]);
  const counts = new Map<string, number>();

  for (const organizationId of organizationIds) {
    const openingKeys = filledOpeningKeys.get(organizationId) ?? new Set<string>();
    const offerKeys = selectedOfferKeys.get(organizationId) ?? new Set<string>();
    const union = new Set([...openingKeys, ...offerKeys]);
    const keyedCount = union.size;
    const fallbackCount = Math.max(
      filledOpeningFallbackCounts.get(organizationId) ?? 0,
      selectedOfferFallbackCounts.get(organizationId) ?? 0
    );

    counts.set(organizationId, Math.max(keyedCount, fallbackCount));
  }

  return counts;
}

async function loadVisibleOrganizationData({
  admin,
  timeRange
}: {
  admin: AuthorizedPlatformAdmin;
  timeRange: AdminTimeRange;
}) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const accessResult =
    admin.role === "super_admin"
      ? { data: [] as AccessRow[], error: null }
      : await supabase
          .from("platform_admin_organization_access")
          .select("organization_id, access_level, revoked_at")
          .eq("platform_admin_id", admin.id)
          .is("revoked_at", null);

  const accessRows = toAdminAccessRows(rowsOrEmpty(accessResult));

  let organizationsQuery = supabase
    .from("organizations")
    .select("id, name, slug, email, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (admin.role !== "super_admin") {
    const organizationIds = accessRows.map((row) => row.organizationId);

    if (organizationIds.length === 0) {
      return {
        organizations: [] as OrganizationRow[],
        accessRows,
        members: [] as MemberRow[],
        profiles: [] as ProfileRow[],
        customers: [] as CustomerRow[],
        consents: [] as ConsentRow[],
        openings: [] as OpeningRow[],
        openingOffers: [] as OpeningOfferRow[],
        smsMessages: [] as SmsMessageRow[],
        appointments: [] as AppointmentRow[],
        controls: [] as AdminControlsRow[],
        billingTerms: [] as BillingTermsRow[],
        rangeStart: getRangeStart(timeRange)
      };
    }

    organizationsQuery = organizationsQuery.in("id", organizationIds);
  }

  const organizations = rowsOrEmpty(await organizationsQuery);
  const organizationIds = organizations.map((organization) => organization.id);
  const rangeStart = getRangeStart(timeRange);

  if (organizationIds.length === 0) {
    return {
      organizations,
      accessRows,
      members: [] as MemberRow[],
      profiles: [] as ProfileRow[],
      customers: [] as CustomerRow[],
      consents: [] as ConsentRow[],
      openings: [] as OpeningRow[],
      openingOffers: [] as OpeningOfferRow[],
      smsMessages: [] as SmsMessageRow[],
      appointments: [] as AppointmentRow[],
      controls: [] as AdminControlsRow[],
      billingTerms: [] as BillingTermsRow[],
      rangeStart
    };
  }

  const [
    membersResult,
    customersResult,
    consentsResult,
    openingsResult,
    offersResult,
    smsResult,
    appointmentsResult,
    controlsResult,
    billingTermsResult
  ] =
    await Promise.all([
      supabase
        .from("organization_members")
        .select("organization_id, user_id, role, status, created_at")
        .in("organization_id", organizationIds),
      supabase
        .from("customers")
        .select("id, organization_id, full_name, phone_e164, created_at")
        .in("organization_id", organizationIds),
      supabase
        .from("sms_consents")
        .select("organization_id, status, created_at")
        .in("organization_id", organizationIds),
      supabase
        .from("openings")
        .select("id, organization_id, service_id, title, start_time, status, created_at, updated_at")
        .in("organization_id", organizationIds),
      supabase
        .from("opening_offers")
        .select(
          "id, organization_id, opening_id, customer_id, status, responded_at, response_rank, created_at, updated_at"
        )
        .in("organization_id", organizationIds),
      supabase
        .from("sms_messages")
        .select(
          "id, organization_id, opening_id, appointment_id, direction, provider, provider_message_id, to_number, status, error_code, error_message, created_at"
        )
        .in("organization_id", organizationIds),
      supabase
        .from("appointments")
        .select("organization_id, created_at, updated_at")
        .in("organization_id", organizationIds),
      supabase
        .from("platform_organization_admin_controls")
        .select("organization_id, archived_at, archived_reason")
        .in("organization_id", organizationIds),
      supabase
        .from("platform_organization_billing_terms")
        .select(
          "organization_id, currency, monthly_subscription_cents, filled_spot_fee_mode, filled_spot_fixed_fee_cents, filled_spot_percentage_bps"
        )
        .in("organization_id", organizationIds)
    ]);

  const members = rowsOrEmpty(membersResult);
  const ownerUserIds = [
    ...new Set(
      members
        .filter((member) => member.role === "owner" && member.status === "active")
        .map((member) => member.user_id)
    )
  ];
  const profiles =
    ownerUserIds.length > 0
      ? rowsOrEmpty(
          await supabase
            .from("profiles")
            .select("auth_user_id, email, full_name")
            .in("auth_user_id", ownerUserIds)
        )
      : [];

  return {
    organizations,
    accessRows,
    members,
    profiles,
    customers: rowsOrEmpty(customersResult),
    consents: rowsOrEmpty(consentsResult),
    openings: rowsOrEmpty(openingsResult),
    openingOffers: rowsOrEmpty(offersResult),
    smsMessages: rowsOrEmpty(smsResult),
    appointments: rowsOrEmpty(appointmentsResult),
    controls: rowsOrEmpty(controlsResult),
    billingTerms: rowsOrEmpty(billingTermsResult),
    rangeStart
  };
}

function mapBillingTerms(row: BillingTermsRow | undefined): BillingTerms {
  if (!row) {
    return defaultBillingTerms;
  }

  return {
    currency: row.currency,
    monthlySubscriptionCents: row.monthly_subscription_cents,
    filledSpotFeeMode: row.filled_spot_fee_mode,
    filledSpotFixedFeeCents: row.filled_spot_fixed_fee_cents,
    filledSpotPercentageBps: row.filled_spot_percentage_bps
  };
}

function buildOrganizationSummaries({
  admin,
  organizations,
  accessRows,
  members,
  profiles,
  customers,
  consents,
  openings,
  openingOffers,
  smsMessages,
  appointments,
  controls,
  billingTerms,
  rangeStart
}: Awaited<ReturnType<typeof loadVisibleOrganizationData>> & {
  admin: AuthorizedPlatformAdmin;
}) {
  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.auth_user_id, profile])
  );
  const membersByOrgId = new Map<string, MemberRow[]>();
  const controlsByOrgId = new Map(
    controls.map((control) => [control.organization_id, control])
  );
  const billingTermsByOrgId = new Map(
    billingTerms.map((terms) => [terms.organization_id, terms])
  );

  for (const member of members) {
    const rows = membersByOrgId.get(member.organization_id) ?? [];
    rows.push(member);
    membersByOrgId.set(member.organization_id, rows);
  }

  const accessByOrgId = buildAccessByOrganization(admin.role, accessRows);
  const rangeOpenings = openings.filter((row) => isInRange(row.created_at, rangeStart));
  const rangeOffers = openingOffers.filter((row) =>
    isInRange(row.created_at, rangeStart)
  );
  const rangeSms = smsMessages.filter((row) => isInRange(row.created_at, rangeStart));
  const openingsCounts = countByOrg(rangeOpenings);
  const outboundSmsCounts = countByOrg(
    rangeSms,
    (row) => row.direction === "outbound"
  );
  const inboundSmsCounts = countByOrg(rangeSms, (row) => row.direction === "inbound");
  const failedSmsCounts = countByOrg(
    rangeSms,
    (row) =>
      row.direction === "outbound" &&
      ["failed", "undelivered", "error"].includes(row.status)
  );
  const customerCounts = countByOrg(customers);
  const optInCounts = countByOrg(consents, (row) => row.status === "opted_in");
  const filledSpotCounts = getFilledSpotCountFromCurrentSchema({
    openings: rangeOpenings,
    openingOffers: rangeOffers
  });

  return organizations.map((organization): AdminOrganizationSummary => {
    const owner = (membersByOrgId.get(organization.id) ?? []).find(
      (member) => member.role === "owner" && member.status === "active"
    );
    const ownerProfile = owner ? profilesByUserId.get(owner.user_id) : null;
    const organizationSms = smsMessages.filter(
      (row) => row.organization_id === organization.id
    );
    const organizationOpenings = openings.filter(
      (row) => row.organization_id === organization.id
    );
    const organizationCustomers = customers.filter(
      (row) => row.organization_id === organization.id
    );
    const organizationAppointments = appointments.filter(
      (row) => row.organization_id === organization.id
    );
    const organizationRangeSms = rangeSms.filter(
      (row) => row.organization_id === organization.id && row.direction === "outbound"
    );
    const smsCost = aggregateSmsCost(
      organizationRangeSms.map((row) => ({
        id: row.id,
        provider: row.provider,
        direction: row.direction,
        status: row.status,
        segments: null
      }))
    );
    const outboundSmsCount = outboundSmsCounts.get(organization.id) ?? 0;
    const control = controlsByOrgId.get(organization.id);
    const terms = mapBillingTerms(billingTermsByOrgId.get(organization.id));
    const filledSpots = Array.from(
      { length: filledSpotCounts.get(organization.id) ?? 0 },
      (_, index): FilledSpotForBilling => ({
        id: `${organization.id}-${index}`,
        recoveredValueCents: null
      })
    );
    const filledSpotFees = aggregateFilledSpotFees({ terms, filledSpots });

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: "active",
      archivedAt: control?.archived_at ?? null,
      archivedReason: control?.archived_reason ?? null,
      createdAt: organization.created_at,
      ownerEmail: ownerProfile?.email ?? organization.email ?? null,
      ownerName: ownerProfile?.full_name ?? null,
      accessLevel:
        admin.role === "super_admin"
          ? "super_admin"
          : accessByOrgId.get(organization.id) ?? "read_only",
      customersCount: customerCounts.get(organization.id) ?? 0,
      optedInCustomersCount: optInCounts.get(organization.id) ?? 0,
      openingsCount: openingsCounts.get(organization.id) ?? 0,
      filledSpotsCount: filledSpotCounts.get(organization.id) ?? 0,
      outboundSmsCount,
      inboundSmsCount: inboundSmsCounts.get(organization.id) ?? 0,
      failedSmsCount: failedSmsCounts.get(organization.id) ?? 0,
      estimatedSmsCostCents: smsCost.estimatedSmsCostCents,
      billingTermsSummary: formatBillingTermsSummary(terms),
      monthlySubscriptionCents: terms.monthlySubscriptionCents,
      filledSpotFeesCents: filledSpotFees.totalFeeCents,
      estimatedContributionCents:
        filledSpotFees.totalFeeCents - smsCost.estimatedSmsCostCents,
      lastActivityAt: maxIso([
        organization.updated_at,
        ...organizationSms.map((row) => row.created_at),
        ...organizationOpenings.map((row) => row.updated_at),
        ...organizationCustomers.map((row) => row.created_at),
        ...organizationAppointments.map((row) => row.updated_at ?? row.created_at)
      ])
    };
  });
}

export async function loadAdminOrganizations({
  admin,
  query,
  timeRange,
  tab = "active"
}: {
  admin: AuthorizedPlatformAdmin;
  query?: string | null;
  timeRange?: AdminTimeRange | string | null;
  tab?: "active" | "archived" | string | null;
}): Promise<AdminOrganizationsResult> {
  const normalizedRange = normalizeAdminTimeRange(timeRange);
  const normalizedQuery = String(query ?? "").trim().slice(0, 80);
  const normalizedTab = tab === "archived" ? "archived" : "active";
  const data = await loadVisibleOrganizationData({
    admin,
    timeRange: normalizedRange
  });
  const summaries = buildOrganizationSummaries({
    admin,
    ...data
  });
  const visibleByTab = summaries.filter((organization) =>
    normalizedTab === "archived"
      ? Boolean(organization.archivedAt)
      : !organization.archivedAt
  );
  const filteredOrganizations = visibleByTab.filter((organization) =>
    matchesOrganizationSearch(organization, normalizedQuery)
  );

  return {
    organizations: filteredOrganizations,
    totalCount: summaries.length,
    filteredCount: filteredOrganizations.length,
    activeCount: summaries.filter((organization) => !organization.archivedAt).length,
    archivedCount: summaries.filter((organization) => organization.archivedAt).length,
    tab: normalizedTab,
    timeRange: normalizedRange,
    query: normalizedQuery
  };
}

export async function loadAdminOverview({
  admin
}: {
  admin: AuthorizedPlatformAdmin;
}): Promise<AdminOverview> {
  const result = await loadAdminOrganizations({
    admin,
    timeRange: "30"
  });

  return {
    admin,
    visibleCompaniesCount: result.totalCount,
    outboundSmsCount: result.organizations.reduce(
      (total, organization) => total + organization.outboundSmsCount,
      0
    ),
    estimatedSmsCostCents: result.organizations.reduce(
      (total, organization) => total + organization.estimatedSmsCostCents,
      0
    ),
    filledSpotsCount: result.organizations.reduce(
      (total, organization) => total + organization.filledSpotsCount,
      0
    )
  };
}

export async function loadAdminOrganizationDetail({
  admin,
  organizationId,
  timeRange
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
  timeRange?: AdminTimeRange | string | null;
}) {
  const result = await loadAdminOrganizations({
    admin,
    timeRange
  });
  const organization = result.organizations.find((row) => row.id === organizationId);

  if (!organization) {
    return null;
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "admin.organization.viewed",
    entityType: "organizations",
    entityId: organizationId,
    metadata: {
      source: "admin_organization_detail"
    }
  });

  return {
    organization,
    timeRange: result.timeRange
  };
}

async function getAdminOrganizationAccessLevel({
  admin,
  organizationId
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
}) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  if (admin.role === "super_admin") {
    return {
      accessLevel: "super_admin" as const,
      revokedAt: null
    };
  }

  const { data, error } = await supabase
    .from("platform_admin_organization_access")
    .select("access_level, revoked_at")
    .eq("platform_admin_id", admin.id)
    .eq("organization_id", organizationId)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    accessLevel: data.access_level,
    revokedAt: data.revoked_at
  };
}

function inDateRange(value: string, range: AdminDateRange) {
  const timestamp = Date.parse(value);
  return timestamp >= range.from.getTime() && timestamp <= range.to.getTime();
}

function increment(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) ?? 0) + by);
}

function sumNullableValues(values: Array<number | null>) {
  const numbers = values.filter((value): value is number => value !== null);

  if (numbers.length === 0) {
    return null;
  }

  return numbers.reduce((total, value) => total + value, 0);
}

export async function loadAdminOrganizationOverview({
  admin,
  organizationId,
  range
}: {
  admin: AuthorizedPlatformAdmin;
  organizationId: string;
  range: AdminDateRange;
}): Promise<AdminOrganizationOverview | null> {
  const access = await getAdminOrganizationAccessLevel({
    admin,
    organizationId
  });

  if (!access) {
    return null;
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const organizationResult = await supabase
    .from("organizations")
    .select(
      "id, name, slug, email, timezone, default_language, created_at, updated_at"
    )
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationResult.error) {
    throw new Error(organizationResult.error.message);
  }

  if (!organizationResult.data) {
    return null;
  }

  const [
    membersResult,
    customersResult,
    consentsResult,
    waitlistResult,
    openingsResult,
    offersResult,
    bookingsResult,
    smsResult,
    servicesResult,
    billingTermsResult
  ] = await Promise.all([
    supabase
      .from("organization_members")
      .select("organization_id, user_id, role, status, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("customers")
      .select("id, organization_id, full_name, phone_e164, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("sms_consents")
      .select("organization_id, customer_id, status, created_at")
      .eq("organization_id", organizationId),
    supabase
      .from("waitlist_entries")
      .select("id, organization_id, customer_id, status, created_at, updated_at")
      .eq("organization_id", organizationId),
    supabase
      .from("openings")
      .select(
        "id, organization_id, service_id, title, start_time, status, created_at, updated_at"
      )
      .eq("organization_id", organizationId),
    supabase
      .from("opening_offers")
      .select(
        "id, organization_id, opening_id, customer_id, status, sent_at, responded_at, response_text, response_rank, created_at, updated_at"
      )
      .eq("organization_id", organizationId),
    supabase
      .from("booking_requests")
      .select(
        "id, organization_id, opening_id, selected_offer_id, customer_id, status, recovered_value_cents, created_at, updated_at"
      )
      .eq("organization_id", organizationId),
    supabase
      .from("sms_messages")
      .select(
        "id, organization_id, opening_id, appointment_id, direction, provider, provider_message_id, to_number, status, error_code, error_message, created_at"
      )
      .eq("organization_id", organizationId),
    supabase
      .from("services")
      .select("id, organization_id, name")
      .eq("organization_id", organizationId),
    supabase
      .from("platform_organization_billing_terms")
      .select("*")
      .eq("organization_id", organizationId)
  ]);

  const organization = organizationResult.data;
  const members = rowsOrEmpty(membersResult);
  const customers = rowsOrEmpty(customersResult);
  const consents = rowsOrEmpty(consentsResult);
  const waitlistEntries = rowsOrEmpty(waitlistResult);
  const openings = rowsOrEmpty(openingsResult);
  const openingOffers = rowsOrEmpty(offersResult);
  const bookingRequests = rowsOrEmpty(bookingsResult);
  const smsMessages = rowsOrEmpty(smsResult);
  const services = rowsOrEmpty(servicesResult);
  const billingTermsRows = rowsOrEmpty(billingTermsResult);
  const billingTerms = mapBillingTerms(billingTermsRows[0]);
  const owner = members.find(
    (member) => member.role === "owner" && member.status === "active"
  );
  const ownerProfile =
    owner &&
    rowsOrEmpty(
      await supabase
        .from("profiles")
        .select("auth_user_id, email, full_name")
        .eq("auth_user_id", owner.user_id)
    )[0];

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const openingById = new Map(openings.map((opening) => [opening.id, opening]));
  const rangeOpenings = openings.filter((opening) =>
    inDateRange(opening.created_at, range)
  );
  const rangeOffers = openingOffers.filter((offer) =>
    inDateRange(offer.responded_at ?? offer.updated_at, range)
  );
  const rangeBookings = bookingRequests.filter((booking) =>
    inDateRange(booking.updated_at, range)
  );
  const rangeSms = smsMessages.filter((message) =>
    inDateRange(message.created_at, range)
  );
  const activeWaitlistEntries = waitlistEntries.filter(
    (entry) => entry.status === "active"
  );
  const positiveReplies = rangeOffers.filter((offer) =>
    ["responded", "selected"].includes(offer.status)
  );
  const pendingValidationOffers = rangeOffers.filter(
    (offer) => offer.status === "responded"
  );
  const pendingValidationBookings = rangeBookings.filter(
    (booking) => booking.status === "pending_merchant_validation"
  );
  const filledSpotCounts = getFilledSpotCountFromCurrentSchema({
    openings: rangeOpenings,
    openingOffers: rangeOffers
  });
  const filledSpots = filledSpotCounts.get(organizationId) ?? 0;
  const outboundSms = rangeSms.filter((message) => message.direction === "outbound");
  const inboundSms = rangeSms.filter((message) => message.direction === "inbound");
  const failedSms = outboundSms.filter((message) =>
    ["failed", "undelivered", "error"].includes(message.status)
  );
  const smsCost = aggregateSmsCost(
    outboundSms.map((message) => ({
      id: message.id,
      provider: message.provider,
      direction: message.direction,
      status: message.status,
      segments: null
    }))
  );
  const estimatedSmsCostCents = smsCost.estimatedSmsCostCents;
  const dailyBuckets = buildDailyBuckets({
    from: range.from,
    to: range.to
  });
  const filledByDay = new Map<string, number>();
  const outboundByDay = new Map<string, number>();
  const inboundByDay = new Map<string, number>();
  const failedByDay = new Map<string, number>();
  const customersCreatedByDay = new Map<string, number>();
  const optedInByDay = new Map<string, number>();

  for (const opening of rangeOpenings) {
    if (opening.status === "filled") {
      increment(filledByDay, dateKey(opening.updated_at));
    }
  }

  for (const offer of rangeOffers) {
    if (offer.status === "selected") {
      increment(filledByDay, dateKey(offer.updated_at));
    }
  }

  for (const message of rangeSms) {
    const key = dateKey(message.created_at);

    if (message.direction === "outbound") {
      increment(outboundByDay, key);
    } else {
      increment(inboundByDay, key);
    }

    if (["failed", "undelivered", "error"].includes(message.status)) {
      increment(failedByDay, key);
    }
  }

  for (const customer of customers) {
    if (inDateRange(customer.created_at, range)) {
      increment(customersCreatedByDay, dateKey(customer.created_at));
    }
  }

  for (const consent of consents) {
    if (consent.status === "opted_in" && inDateRange(consent.created_at, range)) {
      increment(optedInByDay, dateKey(consent.created_at));
    }
  }

  const recentOpenings = [...rangeOpenings]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 8)
    .map((opening) => {
      const offersForOpening = rangeOffers.filter(
        (offer) => offer.opening_id === opening.id
      );
      const bookingsForOpening = rangeBookings.filter(
        (booking) => booking.opening_id === opening.id
      );

      return {
        id: opening.id,
        title: opening.title,
        serviceName: opening.service_id
          ? serviceById.get(opening.service_id)?.name ?? null
          : null,
        startTime: opening.start_time,
        status: opening.status,
        positiveReplies: offersForOpening.filter((offer) =>
          ["responded", "selected"].includes(offer.status)
        ).length,
        pendingValidations:
          offersForOpening.filter((offer) => offer.status === "responded").length +
          bookingsForOpening.filter(
            (booking) => booking.status === "pending_merchant_validation"
          ).length,
        filledSpots:
          opening.status === "filled" ||
          offersForOpening.some((offer) => offer.status === "selected")
            ? 1
            : 0,
        createdAt: opening.created_at
      };
    });
  const recentFailedSms = [...failedSms]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 8)
    .map((message) => ({
      id: message.id,
      provider: message.provider,
      providerMessageId: message.provider_message_id,
      toNumberMasked: maskPhoneNumber(message.to_number),
      status: message.status,
      errorCode: message.error_code,
      errorMessage: message.error_message,
      createdAt: message.created_at
    }));
  const pendingValidations = pendingValidationOffers.slice(0, 8).map((offer) => {
    const opening = openingById.get(offer.opening_id);
    const customer = customerById.get(offer.customer_id);

    return {
      openingId: offer.opening_id,
      openingTitle: opening?.title ?? "Opening",
      customerName: customer?.full_name ?? "Customer",
      customerPhoneMasked: maskPhoneNumber(customer?.phone_e164),
      responseRank: offer.response_rank,
      respondedAt: offer.responded_at
    };
  });
  const recoveredValueCents = sumNullableValues(
    rangeBookings
      .filter((booking) => ["confirmed", "completed"].includes(booking.status))
      .map((booking) => booking.recovered_value_cents)
  );
  const filledSpotBookings = rangeBookings.filter((booking) =>
    ["confirmed", "completed"].includes(booking.status)
  );
  const filledSpotBookingOfferIds = new Set(
    filledSpotBookings
      .map((booking) => booking.selected_offer_id)
      .filter((id): id is string => Boolean(id))
  );
  const billingFilledSpots: FilledSpotForBilling[] = [
    ...filledSpotBookings.map((booking) => ({
      id: booking.id,
      recoveredValueCents: booking.recovered_value_cents
    })),
    ...rangeOffers
      .filter(
        (offer) =>
          offer.status === "selected" && !filledSpotBookingOfferIds.has(offer.id)
      )
      .map((offer) => ({
        id: offer.id,
        recoveredValueCents: null
      }))
  ];
  const billingFees = aggregateFilledSpotFees({
    terms: billingTerms,
    filledSpots: billingFilledSpots
  });
  const warnings = [...smsCost.warnings];
  const unknownOrUnlinkedReplies = inboundSms.filter(
    (message) => !message.opening_id && !message.appointment_id
  ).length;

  if (unknownOrUnlinkedReplies > 0) {
    warnings.push("Some inbound SMS replies are not linked to an opening or appointment.");
  }

  await recordPlatformAdminAuditLog({
    admin,
    organizationId,
    action: "admin.organization.overview_viewed",
    entityType: "organizations",
    entityId: organizationId,
    metadata: {
      source: "admin_organization_overview",
      range: {
        rangeKey: range.rangeKey,
        fromIso: range.fromIso,
        toIso: range.toIso
      }
    }
  });

  return {
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: "active",
      createdAt: organization.created_at,
      timezone: organization.timezone,
      defaultLanguage: organization.default_language,
      ownerEmail: ownerProfile?.email ?? organization.email,
      ownerName: ownerProfile?.full_name ?? null
    },
    access: {
      adminRole: admin.role,
      accessLevel: access.accessLevel,
      canOpenManagerMode: canOpenPlatformAdminManagerMode({
        adminRole: admin.role,
        accessLevel: access.accessLevel,
        revokedAt: access.revokedAt,
        adminStatus: admin.status
      })
    },
    range: {
      label: range.label,
      fromIso: range.fromIso,
      toIso: range.toIso,
      rangeKey: range.rangeKey
    },
    kpis: {
      customersTotal: customers.length,
      customersCreatedInRange: customers.filter((customer) =>
        inDateRange(customer.created_at, range)
      ).length,
      optedInCustomers: consents.filter((consent) => consent.status === "opted_in")
        .length,
      optedOutCustomers: consents.filter((consent) => consent.status === "opted_out")
        .length,
      waitlistEntriesActive: activeWaitlistEntries.length,
      openingsCreated: rangeOpenings.length,
      positiveReplies: positiveReplies.length,
      pendingValidations:
        pendingValidationOffers.length + pendingValidationBookings.length,
      filledSpots,
      outboundSms: outboundSms.length,
      inboundSms: inboundSms.length,
      deliveredSms: outboundSms.filter((message) => message.status === "delivered")
        .length,
      failedSms: failedSms.length,
      unknownOrUnlinkedReplies,
      estimatedSmsCostCents,
      estimatedCostPerFilledSpotCents: calculateCostPerFilledSpotCents({
        estimatedSmsCostCents,
        filledSpots
      }),
      recoveredValueCents
    },
    billing: {
      terms: billingTerms,
      notes: billingTermsRows[0]?.notes ?? null,
      filledSpotsInRange: billingFilledSpots.length,
      filledSpotFeesInRangeCents: billingFees.totalFeeCents,
      estimatedSmsCostInRangeCents: estimatedSmsCostCents,
      estimatedContributionInRangeCents:
        billingFees.totalFeeCents - estimatedSmsCostCents,
      warnings: billingFees.warnings
    },
    charts: {
      filledSpotsByDay: dailyBuckets.map((date) => ({
        date,
        count: filledByDay.get(date) ?? 0
      })),
      smsCostByDay: dailyBuckets.map((date) => {
        const outboundCount = outboundByDay.get(date) ?? 0;

        return {
          date,
          outboundSms: outboundCount,
          estimatedCostCents: estimateSmsCostCents({
            outboundSmsCount: outboundCount
          })
        };
      }),
      customerGrowthByDay: dailyBuckets.map((date) => ({
        date,
        customersTotal: customersCreatedByDay.get(date) ?? 0,
        optedInCustomers: optedInByDay.get(date) ?? 0
      })),
      smsVolumeByDay: dailyBuckets.map((date) => ({
        date,
        outbound: outboundByDay.get(date) ?? 0,
        inbound: inboundByDay.get(date) ?? 0,
        failed: failedByDay.get(date) ?? 0
      }))
    },
    recent: {
      openings: recentOpenings,
      failedSms: recentFailedSms,
      pendingValidations
    },
    warnings
  };
}
