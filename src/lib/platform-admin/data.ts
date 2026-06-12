import "server-only";

import { notFound } from "next/navigation";

import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import {
  daysBetween,
  filterPlatformBusinesses,
  getBusinessHealth,
  normalizePlatformBusinessFilters,
  type PlatformBusinessActivity,
  type PlatformBusinessHealth
} from "@/lib/platform-admin/helpers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

type OrganizationRow = Pick<
  Database["public"]["Tables"]["organizations"]["Row"],
  | "id"
  | "name"
  | "slug"
  | "email"
  | "phone"
  | "timezone"
  | "default_language"
  | "created_at"
  | "updated_at"
>;
type MemberRow = Pick<
  Database["public"]["Tables"]["organization_members"]["Row"],
  "organization_id" | "user_id" | "role" | "status" | "created_at"
>;
type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "auth_user_id" | "full_name" | "email" | "created_at"
>;
type BillingRow = Pick<
  Database["public"]["Tables"]["organization_billing_settings"]["Row"],
  | "organization_id"
  | "billing_status"
  | "subscription_status"
  | "base_plan_amount_cents"
  | "base_plan_currency"
  | "default_commission_percent"
  | "commission_cap_cents"
>;
type CustomerRow = Pick<
  Database["public"]["Tables"]["customers"]["Row"],
  "id" | "organization_id" | "created_at"
>;
type ConsentRow = Pick<
  Database["public"]["Tables"]["sms_consents"]["Row"],
  "organization_id" | "status" | "created_at"
>;
type SmsRow = Pick<
  Database["public"]["Tables"]["sms_messages"]["Row"],
  | "id"
  | "organization_id"
  | "direction"
  | "status"
  | "error_code"
  | "error_message"
  | "status_callback_received_at"
  | "delivered_at"
  | "failed_at"
  | "body"
  | "from_number"
  | "to_number"
  | "created_at"
>;
type OpeningRow = Pick<
  Database["public"]["Tables"]["openings"]["Row"],
  "id" | "organization_id" | "title" | "status" | "created_at" | "updated_at"
>;
type OpeningOfferRow = Pick<
  Database["public"]["Tables"]["opening_offers"]["Row"],
  "id" | "organization_id" | "status" | "response_text" | "created_at" | "updated_at"
>;
type BookingRow = Pick<
  Database["public"]["Tables"]["booking_requests"]["Row"],
  | "id"
  | "organization_id"
  | "status"
  | "recovered_value_cents"
  | "platform_commission_cents"
  | "created_at"
>;
type CommissionRow = Pick<
  Database["public"]["Tables"]["commission_records"]["Row"],
  "organization_id" | "recovered_value_cents" | "commission_amount_cents" | "created_at"
>;
type ServiceRow = Pick<
  Database["public"]["Tables"]["services"]["Row"],
  "organization_id" | "active" | "created_at"
>;
type AppointmentRow = Pick<
  Database["public"]["Tables"]["appointments"]["Row"],
  "organization_id" | "status" | "created_at"
>;
type WaitlistRow = Pick<
  Database["public"]["Tables"]["waitlist_entries"]["Row"],
  "organization_id" | "status" | "created_at"
>;
type AuditRow = Pick<
  Database["public"]["Tables"]["audit_logs"]["Row"],
  "id" | "organization_id" | "action" | "entity_type" | "entity_id" | "created_at"
>;

type RawPlatformData = {
  organizations: OrganizationRow[];
  members: MemberRow[];
  profiles: ProfileRow[];
  billing: BillingRow[];
  customers: CustomerRow[];
  consents: ConsentRow[];
  smsMessages: SmsRow[];
  openings: OpeningRow[];
  openingOffers: OpeningOfferRow[];
  bookings: BookingRow[];
  commissions: CommissionRow[];
  services: ServiceRow[];
  appointments: AppointmentRow[];
  waitlistEntries: WaitlistRow[];
  auditLogs: AuditRow[];
};

export type PlatformBusinessSummary = {
  id: string;
  name: string;
  slug: string;
  ownerName: string | null;
  ownerEmail: string | null;
  billingStatus: string;
  subscriptionStatus: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string | null;
  activityStatus: PlatformBusinessActivity;
  health: PlatformBusinessHealth;
  customersTotal: number;
  customersOptIn: number;
  customersOptOut: number;
  smsSentThisMonth: number;
  smsDeliveredThisMonth: number;
  smsFailedThisMonth: number;
  smsUndeliveredThisMonth: number;
  smsInboundThisMonth: number;
  openingsCreated: number;
  openingsAwaitingValidation: number;
  openingsFilled: number;
  recoveredValueCents: number | null;
  estimatedAmountDueCents: number | null;
};

export type PlatformAdminOverview = {
  businessesTotal: number;
  businessesActive: number;
  businessesCreatedThisMonth: number;
  customersTotal: number;
  customersOptIn: number;
  customersOptOut: number;
  smsSentThisMonth: number;
  smsDeliveredThisMonth: number;
  smsFailedThisMonth: number;
  smsUndeliveredThisMonth: number;
  smsInboundThisMonth: number;
  openingsCreated: number;
  openingsAwaitingValidation: number;
  openingsFilled: number;
  recoveredValueCents: number | null;
  estimatedAmountDueCents: number | null;
  businessesWithSmsProblems: number;
  businessesInactive: number;
};

function rowsOrEmpty<T>(result: { data: T[] | null; error: { message: string } | null }) {
  if (result.error) {
    return [];
  }

  return result.data ?? [];
}

function countByOrganization<T extends { organization_id: string }>(
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

function sumByOrganization<T extends { organization_id: string }>(
  rows: T[],
  getValue: (row: T) => number | null
) {
  const sums = new Map<string, number>();

  for (const row of rows) {
    const value = getValue(row);

    if (value !== null) {
      sums.set(row.organization_id, (sums.get(row.organization_id) ?? 0) + value);
    }
  }

  return sums;
}

function isThisMonth(value: string, monthStart: Date) {
  return Date.parse(value) >= monthStart.getTime();
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

async function getPlatformAdminDataClient() {
  await requirePlatformAdmin();

  const serviceSupabase = createSupabaseServiceClient();

  if (!serviceSupabase) {
    notFound();
  }

  return serviceSupabase;
}

async function loadRawPlatformData(): Promise<RawPlatformData> {
  const supabase = await getPlatformAdminDataClient();

  const [
    organizations,
    members,
    profiles,
    billing,
    customers,
    consents,
    smsMessages,
    openings,
    openingOffers,
    bookings,
    commissions,
    services,
    appointments,
    waitlistEntries,
    auditLogs
  ] = await Promise.all([
    supabase
      .from("organizations")
      .select("id, name, slug, email, phone, timezone, default_language, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("organization_members")
      .select("organization_id, user_id, role, status, created_at"),
    supabase.from("profiles").select("auth_user_id, full_name, email, created_at"),
    supabase
      .from("organization_billing_settings")
      .select(
        "organization_id, billing_status, subscription_status, base_plan_amount_cents, base_plan_currency, default_commission_percent, commission_cap_cents"
      ),
    supabase.from("customers").select("id, organization_id, created_at"),
    supabase.from("sms_consents").select("organization_id, status, created_at"),
    supabase
      .from("sms_messages")
      .select(
        "id, organization_id, direction, status, error_code, error_message, status_callback_received_at, delivered_at, failed_at, body, from_number, to_number, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("openings")
      .select("id, organization_id, title, status, created_at, updated_at"),
    supabase
      .from("opening_offers")
      .select("id, organization_id, status, response_text, created_at, updated_at"),
    supabase
      .from("booking_requests")
      .select(
        "id, organization_id, status, recovered_value_cents, platform_commission_cents, created_at"
      ),
    supabase
      .from("commission_records")
      .select("organization_id, recovered_value_cents, commission_amount_cents, created_at"),
    supabase.from("services").select("organization_id, active, created_at"),
    supabase.from("appointments").select("organization_id, status, created_at"),
    supabase.from("waitlist_entries").select("organization_id, status, created_at"),
    supabase
      .from("audit_logs")
      .select("id, organization_id, action, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(250)
  ]);

  return {
    organizations: rowsOrEmpty(organizations),
    members: rowsOrEmpty(members),
    profiles: rowsOrEmpty(profiles),
    billing: rowsOrEmpty(billing),
    customers: rowsOrEmpty(customers),
    consents: rowsOrEmpty(consents),
    smsMessages: rowsOrEmpty(smsMessages),
    openings: rowsOrEmpty(openings),
    openingOffers: rowsOrEmpty(openingOffers),
    bookings: rowsOrEmpty(bookings),
    commissions: rowsOrEmpty(commissions),
    services: rowsOrEmpty(services),
    appointments: rowsOrEmpty(appointments),
    waitlistEntries: rowsOrEmpty(waitlistEntries),
    auditLogs: rowsOrEmpty(auditLogs)
  };
}

function buildBusinessSummaries(
  data: RawPlatformData,
  now = new Date()
): PlatformBusinessSummary[] {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const profilesByUserId = new Map(
    data.profiles.map((profile) => [profile.auth_user_id, profile])
  );
  const billingByOrgId = new Map(
    data.billing.map((row) => [row.organization_id, row])
  );
  const membersByOrgId = new Map<string, MemberRow[]>();

  for (const member of data.members) {
    const existing = membersByOrgId.get(member.organization_id) ?? [];
    existing.push(member);
    membersByOrgId.set(member.organization_id, existing);
  }

  const customerCounts = countByOrganization(data.customers);
  const optInCounts = countByOrganization(
    data.consents,
    (row) => row.status === "opted_in"
  );
  const optOutCounts = countByOrganization(
    data.consents,
    (row) => row.status === "opted_out"
  );
  const smsSentThisMonth = countByOrganization(
    data.smsMessages,
    (row) => row.direction === "outbound" && isThisMonth(row.created_at, monthStart)
  );
  const smsDeliveredThisMonth = countByOrganization(
    data.smsMessages,
    (row) =>
      row.direction === "outbound" &&
      row.status === "delivered" &&
      isThisMonth(row.created_at, monthStart)
  );
  const smsFailedThisMonth = countByOrganization(
    data.smsMessages,
    (row) =>
      row.direction === "outbound" &&
      row.status === "failed" &&
      isThisMonth(row.created_at, monthStart)
  );
  const smsUndeliveredThisMonth = countByOrganization(
    data.smsMessages,
    (row) =>
      row.direction === "outbound" &&
      row.status === "undelivered" &&
      isThisMonth(row.created_at, monthStart)
  );
  const smsInboundThisMonth = countByOrganization(
    data.smsMessages,
    (row) => row.direction === "inbound" && isThisMonth(row.created_at, monthStart)
  );
  const openingsCreated = countByOrganization(data.openings);
  const openingsAwaitingValidation = countByOrganization(
    data.openings,
    (row) => row.status === "awaiting_validation"
  );
  const openingsFilled = countByOrganization(
    data.openings,
    (row) => row.status === "filled"
  );
  const recoveredFromCommissions = sumByOrganization(
    data.commissions,
    (row) => row.recovered_value_cents
  );
  const dueFromCommissions = sumByOrganization(
    data.commissions,
    (row) => row.commission_amount_cents
  );
  const recoveredFromBookings = sumByOrganization(
    data.bookings,
    (row) => row.recovered_value_cents
  );
  const dueFromBookings = sumByOrganization(
    data.bookings,
    (row) => row.platform_commission_cents
  );

  return data.organizations.map((organization) => {
    const owner = (membersByOrgId.get(organization.id) ?? []).find(
      (member) => member.role === "owner" && member.status === "active"
    );
    const ownerProfile = owner ? profilesByUserId.get(owner.user_id) : null;
    const billing = billingByOrgId.get(organization.id);
    const orgSms = data.smsMessages.filter(
      (row) => row.organization_id === organization.id
    );
    const orgOpenings = data.openings.filter(
      (row) => row.organization_id === organization.id
    );
    const orgCustomers = data.customers.filter(
      (row) => row.organization_id === organization.id
    );
    const lastActivityAt = maxIso([
      organization.updated_at,
      ...orgSms.map((row) => row.created_at),
      ...orgOpenings.map((row) => row.updated_at),
      ...orgCustomers.map((row) => row.created_at)
    ]);
    const inactiveDays = daysBetween(now, lastActivityAt);
    const activityStatus: PlatformBusinessActivity =
      inactiveDays === null || inactiveDays > 30 ? "inactive" : "active";
    const health = getBusinessHealth({
      failedSmsThisMonth: smsFailedThisMonth.get(organization.id) ?? 0,
      undeliveredSmsThisMonth: smsUndeliveredThisMonth.get(organization.id) ?? 0,
      outboundSmsThisMonth: smsSentThisMonth.get(organization.id) ?? 0,
      openingsAwaitingValidation:
        openingsAwaitingValidation.get(organization.id) ?? 0,
      daysSinceLastActivity: inactiveDays
    });
    const recoveredValueCents =
      recoveredFromCommissions.get(organization.id) ??
      recoveredFromBookings.get(organization.id) ??
      null;
    const estimatedAmountDueCents =
      dueFromCommissions.get(organization.id) ??
      dueFromBookings.get(organization.id) ??
      null;

    return {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      ownerName: ownerProfile?.full_name ?? null,
      ownerEmail: ownerProfile?.email ?? null,
      billingStatus: billing?.billing_status ?? "unknown",
      subscriptionStatus: billing?.subscription_status ?? "unknown",
      createdAt: organization.created_at,
      updatedAt: organization.updated_at,
      lastActivityAt,
      activityStatus,
      health,
      customersTotal: customerCounts.get(organization.id) ?? 0,
      customersOptIn: optInCounts.get(organization.id) ?? 0,
      customersOptOut: optOutCounts.get(organization.id) ?? 0,
      smsSentThisMonth: smsSentThisMonth.get(organization.id) ?? 0,
      smsDeliveredThisMonth: smsDeliveredThisMonth.get(organization.id) ?? 0,
      smsFailedThisMonth: smsFailedThisMonth.get(organization.id) ?? 0,
      smsUndeliveredThisMonth: smsUndeliveredThisMonth.get(organization.id) ?? 0,
      smsInboundThisMonth: smsInboundThisMonth.get(organization.id) ?? 0,
      openingsCreated: openingsCreated.get(organization.id) ?? 0,
      openingsAwaitingValidation:
        openingsAwaitingValidation.get(organization.id) ?? 0,
      openingsFilled: openingsFilled.get(organization.id) ?? 0,
      recoveredValueCents,
      estimatedAmountDueCents
    };
  });
}

function sumNullable(values: Array<number | null>) {
  const realValues = values.filter((value): value is number => value !== null);

  if (realValues.length === 0) {
    return null;
  }

  return realValues.reduce((total, value) => total + value, 0);
}

export async function loadPlatformAdminOverview(): Promise<PlatformAdminOverview> {
  const data = await loadRawPlatformData();
  const businesses = buildBusinessSummaries(data);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  return {
    businessesTotal: businesses.length,
    businessesActive: businesses.filter((business) => business.activityStatus === "active")
      .length,
    businessesCreatedThisMonth: businesses.filter((business) =>
      isThisMonth(business.createdAt, monthStart)
    ).length,
    customersTotal: businesses.reduce((total, row) => total + row.customersTotal, 0),
    customersOptIn: businesses.reduce((total, row) => total + row.customersOptIn, 0),
    customersOptOut: businesses.reduce((total, row) => total + row.customersOptOut, 0),
    smsSentThisMonth: businesses.reduce((total, row) => total + row.smsSentThisMonth, 0),
    smsDeliveredThisMonth: businesses.reduce(
      (total, row) => total + row.smsDeliveredThisMonth,
      0
    ),
    smsFailedThisMonth: businesses.reduce(
      (total, row) => total + row.smsFailedThisMonth,
      0
    ),
    smsUndeliveredThisMonth: businesses.reduce(
      (total, row) => total + row.smsUndeliveredThisMonth,
      0
    ),
    smsInboundThisMonth: businesses.reduce(
      (total, row) => total + row.smsInboundThisMonth,
      0
    ),
    openingsCreated: businesses.reduce((total, row) => total + row.openingsCreated, 0),
    openingsAwaitingValidation: businesses.reduce(
      (total, row) => total + row.openingsAwaitingValidation,
      0
    ),
    openingsFilled: businesses.reduce((total, row) => total + row.openingsFilled, 0),
    recoveredValueCents: sumNullable(
      businesses.map((business) => business.recoveredValueCents)
    ),
    estimatedAmountDueCents: sumNullable(
      businesses.map((business) => business.estimatedAmountDueCents)
    ),
    businessesWithSmsProblems: businesses.filter(
      (business) => business.health === "problem"
    ).length,
    businessesInactive: businesses.filter(
      (business) => business.activityStatus === "inactive"
    ).length
  };
}

export async function loadPlatformAdminBusinesses(filters?: {
  q?: string;
  health?: string;
  activity?: string;
  sort?: string;
}) {
  const normalizedFilters = normalizePlatformBusinessFilters(filters ?? {});
  const data = await loadRawPlatformData();
  const businesses = buildBusinessSummaries(data);
  const filteredBusinesses = filterPlatformBusinesses(
    businesses,
    normalizedFilters
  );

  return {
    filters: normalizedFilters,
    businesses: filteredBusinesses,
    totalCount: businesses.length,
    filteredCount: filteredBusinesses.length
  };
}

export async function loadPlatformAdminBusinessDetail(organizationId: string) {
  const data = await loadRawPlatformData();
  const business = buildBusinessSummaries(data).find(
    (row) => row.id === organizationId
  );
  const organization = data.organizations.find((row) => row.id === organizationId);

  if (!business || !organization) {
    return null;
  }

  const profilesByUserId = new Map(
    data.profiles.map((profile) => [profile.auth_user_id, profile])
  );
  const team = data.members
    .filter((member) => member.organization_id === organizationId)
    .map((member) => {
      const profile = profilesByUserId.get(member.user_id);

      return {
        userId: member.user_id,
        role: member.role,
        status: member.status,
        email: profile?.email ?? null,
        name: profile?.full_name ?? null,
        createdAt: member.created_at
      };
    });

  const orgSms = data.smsMessages.filter(
    (row) => row.organization_id === organizationId
  );
  const recentOutbound = orgSms
    .filter((row) => row.direction === "outbound")
    .slice(0, 8);
  const recentInbound = orgSms.filter((row) => row.direction === "inbound").slice(0, 8);
  const recentProblems = orgSms
    .filter((row) => row.status === "failed" || row.status === "undelivered")
    .slice(0, 8);
  const recentAuditLogs = data.auditLogs
    .filter((row) => row.organization_id === organizationId)
    .slice(0, 8);
  const outboundSmsCount = orgSms.filter((row) => row.direction === "outbound").length;
  const inboundSmsCount = orgSms.filter((row) => row.direction === "inbound").length;

  return {
    business,
    identity: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      email: organization.email,
      phone: organization.phone,
      timezone: organization.timezone,
      defaultLanguage: organization.default_language,
      createdAt: organization.created_at,
      updatedAt: organization.updated_at
    },
    team,
    usage: {
      customers: data.customers.filter((row) => row.organization_id === organizationId)
        .length,
      waitlistEntries: data.waitlistEntries.filter(
        (row) => row.organization_id === organizationId
      ).length,
      services: data.services.filter((row) => row.organization_id === organizationId)
        .length,
      appointments: data.appointments.filter(
        (row) => row.organization_id === organizationId
      ).length,
      openings: data.openings.filter((row) => row.organization_id === organizationId)
        .length,
      openingOffers: data.openingOffers.filter(
        (row) => row.organization_id === organizationId
      ).length,
      responses: data.openingOffers.filter(
        (row) => row.organization_id === organizationId && row.response_text
      ).length,
      smsOutbound: outboundSmsCount,
      smsInbound: inboundSmsCount
    },
    smsHealth: {
      recentOutbound,
      recentInbound,
      recentProblems,
      lastErrorCode: recentProblems[0]?.error_code ?? null,
      lastCallbackAt:
        orgSms.find((row) => row.status_callback_received_at)
          ?.status_callback_received_at ?? null
    },
    recovery: {
      openingsAwaitingValidation: business.openingsAwaitingValidation,
      openingsFilled: business.openingsFilled,
      recoveredValueCents: business.recoveredValueCents,
      estimatedAmountDueCents: business.estimatedAmountDueCents
    },
    recentAuditLogs
  };
}

export async function loadPlatformAdminBillingOverview() {
  const data = await loadRawPlatformData();
  const businesses = buildBusinessSummaries(data);

  return {
    businesses,
    totalEstimatedDueCents: sumNullable(
      businesses.map((business) => business.estimatedAmountDueCents)
    ),
    totalRecoveredValueCents: sumNullable(
      businesses.map((business) => business.recoveredValueCents)
    )
  };
}

export async function loadPlatformAdminSmsHealth() {
  const data = await loadRawPlatformData();
  const businesses = buildBusinessSummaries(data);
  const today = new Date().toISOString().slice(0, 10);
  const outboundToday = data.smsMessages.filter(
    (row) => row.direction === "outbound" && row.created_at.startsWith(today)
  );
  const messagesWithoutCallback = data.smsMessages.filter(
    (row) =>
      row.direction === "outbound" &&
      !row.status_callback_received_at &&
      row.status !== "delivered" &&
      row.status !== "failed" &&
      row.status !== "undelivered"
  );
  const optOuts = data.consents.filter((row) => row.status === "opted_out");

  return {
    outboundTodayCount: outboundToday.length,
    outboundThisMonthCount: businesses.reduce(
      (total, business) => total + business.smsSentThisMonth,
      0
    ),
    inboundThisMonthCount: businesses.reduce(
      (total, business) => total + business.smsInboundThisMonth,
      0
    ),
    deliveredThisMonthCount: businesses.reduce(
      (total, business) => total + business.smsDeliveredThisMonth,
      0
    ),
    failedThisMonthCount: businesses.reduce(
      (total, business) => total + business.smsFailedThisMonth,
      0
    ),
    undeliveredThisMonthCount: businesses.reduce(
      (total, business) => total + business.smsUndeliveredThisMonth,
      0
    ),
    messagesWithoutCallbackCount: messagesWithoutCallback.length,
    optOutCount: optOuts.length,
    recentErrors: data.smsMessages
      .filter((row) => row.error_code)
      .slice(0, 10)
      .map((row) => ({
        organizationId: row.organization_id,
        errorCode: row.error_code,
        errorMessage: row.error_message,
        createdAt: row.created_at
      })),
    businesses
  };
}
