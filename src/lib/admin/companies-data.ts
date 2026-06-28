import "server-only";

import { loadBookCallRequests } from "@/lib/admin/call-requests";
import {
  getFilledSpotCountFromCurrentSchema
} from "@/lib/admin/organizations";
import { aggregateSmsCost } from "@/lib/admin/sms-cost";
import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

export type CompaniesDateRange = "7" | "30" | "90" | "all";
export type CompaniesStatusFilter =
  | "all"
  | "active"
  | "inactive"
  | "archived"
  | "disabled";
export type CompaniesPlanFilter = "all" | string;

export type AdminCompanyRow = {
  id: string;
  name: string;
  slug: string | null;
  ownerEmail: string | null;
  status: "active" | "inactive" | "archived" | "disabled";
  statusLabel: string;
  plan: string | null;
  customersCount: number;
  openingsCount: number;
  filledSpotsCount: number;
  smsSentCount: number;
  estimatedSmsCostCents: number;
  lastActivityAt: string | null;
};

export type AdminCompaniesPageData = {
  kpis: {
    totalCompanies: number;
    activeCompanies: number;
    activeCompaniesPercentage: number;
    smsSent30d: number;
    smsSentChangePct: number | null;
    filledSpots30d: number;
    filledSpotsChangePct: number | null;
    estimatedSmsCost30dCents: number;
    estimatedSmsCostChangePct: number | null;
  };
  companies: AdminCompanyRow[];
  totalCount: number;
  filteredCount: number;
  notificationCount: number;
  availablePlans: string[];
  filters: {
    query: string;
    status: CompaniesStatusFilter;
    plan: CompaniesPlanFilter;
    range: CompaniesDateRange;
  };
};

type OrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  "id" | "name" | "slug" | "email" | "created_at" | "updated_at"
>;
type AdminControlsRow = Pick<
  Database["public"]["Tables"]["platform_organization_admin_controls"]["Row"],
  | "organization_id"
  | "archived_at"
  | "disabled_at"
  | "sms_sending_paused"
  | "support_status"
>;
type BillingSettingsRow = Pick<
  Database["public"]["Tables"]["organization_billing_settings"]["Row"],
  "organization_id" | "plan_name"
>;
type SmsMessageRow = Pick<
  Database["public"]["Tables"]["sms_messages"]["Row"],
  "id" | "organization_id" | "direction" | "provider" | "status" | "created_at"
>;
type OpeningRow = Pick<
  Database["public"]["Tables"]["openings"]["Row"],
  "id" | "organization_id" | "status" | "created_at" | "updated_at"
>;
type OpeningOfferRow = Pick<
  Database["public"]["Tables"]["opening_offers"]["Row"],
  "id" | "organization_id" | "opening_id" | "status" | "created_at" | "updated_at"
>;
type CustomerRow = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  "organization_id" | "created_at"
>;
type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "organization_id" | "created_at" | "updated_at"
>;
type MemberRow = Pick<
  Database["public"]["Tables"]["organization_members"]["Row"],
  "organization_id" | "user_id" | "role" | "status"
>;
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "auth_user_id" | "email" | "full_name"
>;
type AccessRow = Pick<
  Database["public"]["Tables"]["platform_admin_organization_access"]["Row"],
  "organization_id" | "revoked_at"
>;

function rowsOrEmpty<T>(result: {
  data: T[] | null;
  error: { message: string } | null;
}) {
  if (result.error) {
    console.error("Admin companies query failed:", result.error.message);
    return [];
  }

  return result.data ?? [];
}

function getRangeStart(days: number | null, now = new Date()) {
  if (days === null) {
    return new Date(0);
  }

  const start = new Date(now);
  start.setDate(start.getDate() - days);
  return start;
}

function isInRange(value: string, rangeStart: Date) {
  return Date.parse(value) >= rangeStart.getTime();
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

function computePercentChange(current: number, previous: number) {
  if (previous === 0) {
    if (current === 0) {
      return 0;
    }

    return 100;
  }

  return ((current - previous) / previous) * 100;
}

function resolveCompanyStatus(control: AdminControlsRow | undefined): {
  filterValue: Exclude<CompaniesStatusFilter, "all">;
  label: string;
} {
  if (control?.archived_at) {
    return { filterValue: "archived", label: "Archived" };
  }

  if (control?.disabled_at) {
    return { filterValue: "disabled", label: "Disabled" };
  }

  if (
    control?.sms_sending_paused ||
    control?.support_status === "disabled" ||
    control?.support_status === "blocked"
  ) {
    return { filterValue: "inactive", label: "Inactive" };
  }

  return { filterValue: "active", label: "Active" };
}

export function normalizeCompaniesDateRange(
  value: string | null | undefined
): CompaniesDateRange {
  if (value === "7" || value === "30" || value === "90" || value === "all") {
    return value;
  }

  return "30";
}

export function normalizeCompaniesStatusFilter(
  value: string | null | undefined
): CompaniesStatusFilter {
  if (
    value === "active" ||
    value === "inactive" ||
    value === "archived" ||
    value === "disabled"
  ) {
    return value;
  }

  return "all";
}

function rangeToDays(range: CompaniesDateRange): number | null {
  if (range === "all") {
    return null;
  }

  return Number(range);
}

async function loadVisibleCompaniesRaw(admin: AuthorizedPlatformAdmin) {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  const accessResult =
    admin.role === "super_admin"
      ? { data: [] as AccessRow[], error: null }
      : await supabase
          .from("platform_admin_organization_access")
          .select("organization_id, revoked_at")
          .eq("platform_admin_id", admin.id)
          .is("revoked_at", null);

  const accessRows = rowsOrEmpty(accessResult);
  const accessibleIds =
    admin.role === "super_admin"
      ? null
      : accessRows.map((row) => row.organization_id);

  if (accessibleIds && accessibleIds.length === 0) {
    return {
      organizations: [] as OrganizationRow[],
      controls: [] as AdminControlsRow[],
      billingSettings: [] as BillingSettingsRow[],
      members: [] as MemberRow[],
      profiles: [] as ProfileRow[],
      customers: [] as CustomerRow[],
      openings: [] as OpeningRow[],
      openingOffers: [] as OpeningOfferRow[],
      smsMessages: [] as SmsMessageRow[],
      appointments: [] as AppointmentRow[]
    };
  }

  let organizationsQuery = supabase
    .from("organizations")
    .select("id, name, slug, email, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (accessibleIds) {
    organizationsQuery = organizationsQuery.in("id", accessibleIds);
  }

  const organizations = rowsOrEmpty(await organizationsQuery);
  const organizationIds = organizations.map((organization) => organization.id);

  if (organizationIds.length === 0) {
    return {
      organizations: [] as OrganizationRow[],
      controls: [] as AdminControlsRow[],
      billingSettings: [] as BillingSettingsRow[],
      members: [] as MemberRow[],
      profiles: [] as ProfileRow[],
      customers: [] as CustomerRow[],
      openings: [] as OpeningRow[],
      openingOffers: [] as OpeningOfferRow[],
      smsMessages: [] as SmsMessageRow[],
      appointments: [] as AppointmentRow[]
    };
  }

  const [
    controlsResult,
    billingResult,
    membersResult,
    customersResult,
    openingsResult,
    offersResult,
    smsResult,
    appointmentsResult
  ] = await Promise.all([
    supabase
      .from("platform_organization_admin_controls")
      .select(
        "organization_id, archived_at, disabled_at, sms_sending_paused, support_status"
      )
      .in("organization_id", organizationIds),
    supabase
      .from("organization_billing_settings")
      .select("organization_id, plan_name")
      .in("organization_id", organizationIds),
    supabase
      .from("organization_members")
      .select("organization_id, user_id, role, status")
      .in("organization_id", organizationIds),
    supabase
      .from("customers")
      .select("organization_id, created_at")
      .in("organization_id", organizationIds),
    supabase
      .from("openings")
      .select("id, organization_id, status, created_at, updated_at")
      .in("organization_id", organizationIds),
    supabase
      .from("opening_offers")
      .select("id, organization_id, opening_id, status, created_at, updated_at")
      .in("organization_id", organizationIds),
    supabase
      .from("sms_messages")
      .select("id, organization_id, direction, provider, status, created_at")
      .in("organization_id", organizationIds),
    supabase
      .from("appointments")
      .select("organization_id, created_at, updated_at")
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
    controls: rowsOrEmpty(controlsResult),
    billingSettings: rowsOrEmpty(billingResult),
    members,
    profiles,
    customers: rowsOrEmpty(customersResult),
    openings: rowsOrEmpty(openingsResult),
    openingOffers: rowsOrEmpty(offersResult),
    smsMessages: rowsOrEmpty(smsResult),
    appointments: rowsOrEmpty(appointmentsResult)
  };
}

function buildCompanyRows({
  raw,
  tableRangeStart
}: {
  raw: Awaited<ReturnType<typeof loadVisibleCompaniesRaw>>;
  tableRangeStart: Date;
}): AdminCompanyRow[] {
  const controlsByOrg = new Map(
    raw.controls.map((control) => [control.organization_id, control])
  );
  const billingByOrg = new Map(
    raw.billingSettings.map((setting) => [setting.organization_id, setting])
  );
  const profilesByUserId = new Map(
    raw.profiles.map((profile) => [profile.auth_user_id, profile])
  );
  const membersByOrg = new Map<string, MemberRow[]>();

  for (const member of raw.members) {
    const rows = membersByOrg.get(member.organization_id) ?? [];
    rows.push(member);
    membersByOrg.set(member.organization_id, rows);
  }

  const customerCounts = countByOrg(raw.customers);
  const tableOpenings = raw.openings.filter((row) =>
    isInRange(row.created_at, tableRangeStart)
  );
  const tableOffers = raw.openingOffers.filter((row) =>
    isInRange(row.created_at, tableRangeStart)
  );
  const tableSms = raw.smsMessages.filter((row) =>
    isInRange(row.created_at, tableRangeStart)
  );
  const openingsCounts = countByOrg(tableOpenings);
  const tableFilledSpots = getFilledSpotCountFromCurrentSchema({
    openings: tableOpenings,
    openingOffers: tableOffers
  });
  const tableOutboundSms = countByOrg(
    tableSms,
    (row) => row.direction === "outbound"
  );

  return raw.organizations.map((organization) => {
    const control = controlsByOrg.get(organization.id);
    const status = resolveCompanyStatus(control);
    const owner = (membersByOrg.get(organization.id) ?? []).find(
      (member) => member.role === "owner" && member.status === "active"
    );
    const ownerProfile = owner ? profilesByUserId.get(owner.user_id) : null;
    const organizationSms = raw.smsMessages.filter(
      (row) => row.organization_id === organization.id
    );
    const organizationOpenings = raw.openings.filter(
      (row) => row.organization_id === organization.id
    );
    const organizationCustomers = raw.customers.filter(
      (row) => row.organization_id === organization.id
    );
    const organizationAppointments = raw.appointments.filter(
      (row) => row.organization_id === organization.id
    );
    const tableSmsForOrg = tableSms.filter(
      (row) => row.organization_id === organization.id && row.direction === "outbound"
    );
    const smsCost = aggregateSmsCost(
      tableSmsForOrg.map((row) => ({
        id: row.id,
        provider: row.provider,
        direction: row.direction,
        status: row.status,
        segments: null
      }))
    );

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      ownerEmail: ownerProfile?.email ?? organization.email ?? null,
      status: status.filterValue,
      statusLabel: status.label,
      plan: billingByOrg.get(organization.id)?.plan_name ?? null,
      customersCount: customerCounts.get(organization.id) ?? 0,
      openingsCount: openingsCounts.get(organization.id) ?? 0,
      filledSpotsCount: tableFilledSpots.get(organization.id) ?? 0,
      smsSentCount: tableOutboundSms.get(organization.id) ?? 0,
      estimatedSmsCostCents: smsCost.estimatedSmsCostCents,
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

function computeGlobalKpis({
  raw,
  kpiCurrentStart,
  kpiPreviousStart,
  kpiCurrentEnd
}: {
  raw: Awaited<ReturnType<typeof loadVisibleCompaniesRaw>>;
  kpiCurrentStart: Date;
  kpiPreviousStart: Date;
  kpiCurrentEnd: Date;
}) {
  const controlsByOrg = new Map(
    raw.controls.map((control) => [control.organization_id, control])
  );

  let activeCompanies = 0;

  for (const organization of raw.organizations) {
    const status = resolveCompanyStatus(controlsByOrg.get(organization.id));

    if (status.filterValue === "active") {
      activeCompanies += 1;
    }
  }

  const totalCompanies = raw.organizations.length;
  const activeCompaniesPercentage =
    totalCompanies === 0 ? 0 : (activeCompanies / totalCompanies) * 100;

  const inWindow = (value: string, from: Date, to: Date) => {
    const timestamp = Date.parse(value);
    return timestamp >= from.getTime() && timestamp <= to.getTime();
  };

  const currentSms = raw.smsMessages.filter(
    (row) =>
      row.direction === "outbound" &&
      inWindow(row.created_at, kpiCurrentStart, kpiCurrentEnd)
  );
  const previousSms = raw.smsMessages.filter(
    (row) =>
      row.direction === "outbound" &&
      inWindow(row.created_at, kpiPreviousStart, kpiCurrentStart)
  );

  const currentOpenings = raw.openings.filter((row) =>
    inWindow(row.created_at, kpiCurrentStart, kpiCurrentEnd)
  );
  const currentOffers = raw.openingOffers.filter((row) =>
    inWindow(row.created_at, kpiCurrentStart, kpiCurrentEnd)
  );
  const previousOpenings = raw.openings.filter((row) =>
    inWindow(row.created_at, kpiPreviousStart, kpiCurrentStart)
  );
  const previousOffers = raw.openingOffers.filter((row) =>
    inWindow(row.created_at, kpiPreviousStart, kpiCurrentStart)
  );

  const filledSpots30d = [...getFilledSpotCountFromCurrentSchema({
    openings: currentOpenings,
    openingOffers: currentOffers
  }).values()].reduce((total, count) => total + count, 0);
  const filledSpotsPrevious = [
    ...getFilledSpotCountFromCurrentSchema({
      openings: previousOpenings,
      openingOffers: previousOffers
    }).values()
  ].reduce((total, count) => total + count, 0);

  const smsSent30d = currentSms.length;
  const smsSentPrevious = previousSms.length;
  const estimatedSmsCost30dCents = aggregateSmsCost(
    currentSms.map((row) => ({
      id: row.id,
      provider: row.provider,
      direction: row.direction,
      status: row.status,
      segments: null
    }))
  ).estimatedSmsCostCents;
  const estimatedSmsCostPreviousCents = aggregateSmsCost(
    previousSms.map((row) => ({
      id: row.id,
      provider: row.provider,
      direction: row.direction,
      status: row.status,
      segments: null
    }))
  ).estimatedSmsCostCents;

  return {
    totalCompanies,
    activeCompanies,
    activeCompaniesPercentage,
    smsSent30d,
    smsSentChangePct: computePercentChange(smsSent30d, smsSentPrevious),
    filledSpots30d,
    filledSpotsChangePct: computePercentChange(filledSpots30d, filledSpotsPrevious),
    estimatedSmsCost30dCents,
    estimatedSmsCostChangePct: computePercentChange(
      estimatedSmsCost30dCents,
      estimatedSmsCostPreviousCents
    )
  };
}

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

function matchesSearch(row: AdminCompanyRow, query: string) {
  const normalizedQuery = normalizeSearch(query);
  const compactQuery = compactSearch(query);

  if (!normalizedQuery && !compactQuery) {
    return true;
  }

  const haystackValues = [row.name, row.slug, row.ownerEmail];
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

export async function loadAdminCompaniesPageData({
  admin,
  query,
  status,
  plan,
  range
}: {
  admin: AuthorizedPlatformAdmin;
  query?: string | null;
  status?: CompaniesStatusFilter | string | null;
  plan?: CompaniesPlanFilter | string | null;
  range?: CompaniesDateRange | string | null;
}): Promise<AdminCompaniesPageData> {
  const normalizedQuery = String(query ?? "").trim().slice(0, 80);
  const normalizedStatus = normalizeCompaniesStatusFilter(status);
  const normalizedRange = normalizeCompaniesDateRange(range);
  const normalizedPlan =
    plan && plan !== "all" ? String(plan).trim().slice(0, 120) : "all";

  const now = new Date();
  const kpiCurrentEnd = now;
  const kpiCurrentStart = getRangeStart(30, now);
  const kpiPreviousStart = getRangeStart(60, now);
  const tableRangeStart = getRangeStart(rangeToDays(normalizedRange), now);

  const raw = await loadVisibleCompaniesRaw(admin);
  const allCompanies = buildCompanyRows({
    raw,
    tableRangeStart
  });

  const availablePlans = [
    ...new Set(
      allCompanies
        .map((company) => company.plan?.trim())
        .filter((value): value is string => Boolean(value))
    )
  ].sort((left, right) => left.localeCompare(right));

  const filteredCompanies = allCompanies.filter((company) => {
    if (normalizedStatus !== "all" && company.status !== normalizedStatus) {
      return false;
    }

    if (normalizedPlan !== "all") {
      const companyPlan = company.plan?.trim() ?? "";

      if (companyPlan !== normalizedPlan) {
        return false;
      }
    }

    return matchesSearch(company, normalizedQuery);
  });

  const callRequests = await loadBookCallRequests();
  const notificationCount = callRequests.stats.new;

  return {
    kpis: computeGlobalKpis({
      raw,
      kpiCurrentStart,
      kpiPreviousStart,
      kpiCurrentEnd
    }),
    companies: filteredCompanies,
    totalCount: allCompanies.length,
    filteredCount: filteredCompanies.length,
    notificationCount,
    availablePlans,
    filters: {
      query: normalizedQuery,
      status: normalizedStatus,
      plan: normalizedPlan,
      range: normalizedRange
    }
  };
}
