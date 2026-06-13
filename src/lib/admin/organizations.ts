import type {
  AuthorizedPlatformAdmin,
  PlatformAdminAccessLevel,
  PlatformAdminRole
} from "@/lib/auth/platform-admin";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { estimateSmsCostCents } from "@/lib/admin/sms-cost";
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
  "id" | "organization_id" | "created_at"
>;
type ConsentRow = Pick<
  Database["public"]["Tables"]["sms_consents"]["Row"],
  "organization_id" | "status" | "created_at"
>;
type OpeningRow = Pick<
  Database["public"]["Tables"]["openings"]["Row"],
  "id" | "organization_id" | "status" | "created_at" | "updated_at"
>;
type OpeningOfferRow = Pick<
  Database["public"]["Tables"]["opening_offers"]["Row"],
  "id" | "organization_id" | "opening_id" | "status" | "created_at" | "updated_at"
>;
type SmsMessageRow = Pick<
  Database["public"]["Tables"]["sms_messages"]["Row"],
  "id" | "organization_id" | "direction" | "status" | "created_at"
>;
type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "organization_id" | "created_at" | "updated_at"
>;
type AccessRow = Pick<
  Database["public"]["Tables"]["platform_admin_organization_access"]["Row"],
  "organization_id" | "access_level" | "revoked_at"
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
  lastActivityAt: string | null;
};

export type AdminOrganizationsResult = {
  organizations: AdminOrganizationSummary[];
  totalCount: number;
  filteredCount: number;
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
      rangeStart
    };
  }

  const [membersResult, customersResult, consentsResult, openingsResult, offersResult, smsResult, appointmentsResult] =
    await Promise.all([
      supabase
        .from("organization_members")
        .select("organization_id, user_id, role, status, created_at")
        .in("organization_id", organizationIds),
      supabase
        .from("customers")
        .select("id, organization_id, created_at")
        .in("organization_id", organizationIds),
      supabase
        .from("sms_consents")
        .select("organization_id, status, created_at")
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
        .select("id, organization_id, direction, status, created_at")
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
    accessRows,
    members,
    profiles,
    customers: rowsOrEmpty(customersResult),
    consents: rowsOrEmpty(consentsResult),
    openings: rowsOrEmpty(openingsResult),
    openingOffers: rowsOrEmpty(offersResult),
    smsMessages: rowsOrEmpty(smsResult),
    appointments: rowsOrEmpty(appointmentsResult),
    rangeStart
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
  rangeStart
}: Awaited<ReturnType<typeof loadVisibleOrganizationData>> & {
  admin: AuthorizedPlatformAdmin;
}) {
  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.auth_user_id, profile])
  );
  const membersByOrgId = new Map<string, MemberRow[]>();

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
    const outboundSmsCount = outboundSmsCounts.get(organization.id) ?? 0;

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: "active",
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
      estimatedSmsCostCents: estimateSmsCostCents({ outboundSmsCount }),
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
  timeRange
}: {
  admin: AuthorizedPlatformAdmin;
  query?: string | null;
  timeRange?: AdminTimeRange | string | null;
}): Promise<AdminOrganizationsResult> {
  const normalizedRange = normalizeAdminTimeRange(timeRange);
  const normalizedQuery = String(query ?? "").trim().slice(0, 80);
  const data = await loadVisibleOrganizationData({
    admin,
    timeRange: normalizedRange
  });
  const summaries = buildOrganizationSummaries({
    admin,
    ...data
  });
  const filteredOrganizations = summaries.filter((organization) =>
    matchesOrganizationSearch(organization, normalizedQuery)
  );

  return {
    organizations: filteredOrganizations,
    totalCount: summaries.length,
    filteredCount: filteredOrganizations.length,
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
