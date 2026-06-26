import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  classifyInboundSmsBody,
  type InboundSmsClassification
} from "@/lib/sms/inbound";
import {
  checkSmsDeliveryPersistenceReadiness,
  isSmsPersistenceSchemaError
} from "@/lib/sms/persistence-readiness";
import {
  getWaitlistSmsEligibility,
  type WaitlistSmsEligibility
} from "@/lib/waitlist/eligibility";
import type { Database } from "@/types/database";

export type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
export type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
export type ConsentRow = Database["public"]["Tables"]["sms_consents"]["Row"];
export type WaitlistEntryRow =
  Database["public"]["Tables"]["waitlist_entries"]["Row"];
export type WaitlistEntryServiceRow =
  Database["public"]["Tables"]["waitlist_entry_services"]["Row"];
export type OpeningRow = Database["public"]["Tables"]["openings"]["Row"];
export type OpeningOfferRow =
  Database["public"]["Tables"]["opening_offers"]["Row"];
export type OpeningValueSource = "booking_request" | "opening" | "service" | "unknown";
export type OpeningView = OpeningRow & {
  displayValueCents: number | null;
  displayValueSource: OpeningValueSource;
  recoveredValueCents: number | null;
  serviceNormalPriceCents: number | null;
};
export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
export type OrganizationSettingsRow =
  Database["public"]["Tables"]["organization_settings"]["Row"];

export type OpeningDetailOffer = OpeningOfferRow & {
  customerName: string;
  customerPhone: string;
  customerLanguage: CustomerRow["preferred_language"];
  lastOutboundMessageBody: string | null;
  lastOutboundMessageStatus: string | null;
  lastOutboundErrorCode: string | null;
  lastOutboundErrorMessage: string | null;
  lastOutboundStatusCallbackReceivedAt: string | null;
  lastOutboundDeliveredAt: string | null;
  lastOutboundFailedAt: string | null;
  lastOutboundProvider: string | null;
  lastOutboundProviderMessageId: string | null;
  lastOutboundSentAt: string | null;
  lastOutboundFromNumber: string | null;
  lastOutboundToNumber: string | null;
};

export type OpeningDetailData = {
  opening: OpeningRow | null;
  service: Pick<ServiceRow, "id" | "name" | "normal_price_cents"> | null;
  offers: OpeningDetailOffer[];
  deliveryHistoryWarning: string | null;
};

export type ResponseQueueItem = OpeningOfferRow & {
  customerName: string;
  customerPhone: string;
  openingTitle: string;
  openingStartTime: string;
  serviceName: string | null;
  lastInboundBody: string | null;
  lastInboundStatus: string | null;
  lastInboundReceivedAt: string | null;
  replyClassification: string;
};

export type AppointmentResponseCalendarItem = {
  id: string;
  appointmentId: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  serviceName: string | null;
  appointmentStartsAt: string | null;
  appointmentEndsAt: string | null;
  appointmentStatus: string | null;
  confirmationStatus: string | null;
  timezone: string | null;
  inboundBody: string;
  inboundReceivedAt: string;
  classification: InboundSmsClassification;
};

export type AppointmentResponseDayGroup = {
  dateKey: string;
  dateLabel: string;
  items: AppointmentResponseCalendarItem[];
};

export type OpeningResponseCustomer = {
  offerId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  offerStatus: string;
  responseRank: number | null;
  responseText: string | null;
  respondedAt: string | null;
  lastInboundBody: string | null;
  lastInboundReceivedAt: string | null;
  replyClassification: InboundSmsClassification | "none";
};

export type OpeningResponseGroup = {
  openingId: string;
  openingTitle: string;
  serviceId: string | null;
  serviceName: string | null;
  startTime: string | null;
  endTime: string | null;
  offerLabel: string | null;
  openingStatus: string;
  sentCount: number;
  responseCount: number;
  positiveCount: number;
  noReplyCount: number;
  customers: OpeningResponseCustomer[];
};

export type OpeningResponsesRange =
  | "this_week"
  | "two_weeks"
  | "one_month"
  | "three_months"
  | "all";

export type OpeningResponsesFilters = {
  range: OpeningResponsesRange;
  serviceId: string | "all" | "none";
  q: string;
};

export type CustomerWithConsent = CustomerRow & {
  consentStatus: ConsentRow["status"] | "missing";
  latestConsentRequestStatus?: string | null;
};

export type CustomerEditData = CustomerRow & {
  consentStatus: ConsentRow["status"] | "missing";
  serviceId: string | null;
};

export type AppointmentView = AppointmentRow & {
  customerName: string;
  customerPhone: string;
  serviceName: string | null;
};

export type WaitlistEntryView = WaitlistEntryRow & {
  customerName: string;
  customerPhone: string;
  customerLanguage: CustomerRow["preferred_language"];
  customerSource: string;
  consentStatus: CustomerWithConsent["consentStatus"];
  serviceName: string | null;
  serviceInterestIds: string[];
  serviceInterestNames: string[];
  smsEligibility: WaitlistSmsEligibility;
};

async function requireOrganizationId() {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    return null;
  }

  return workspace.organization.id;
}

function getTimeValue(value: string | null | undefined) {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function getDateKey(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return date.toLocaleDateString("fr-CA");
}

function formatDateLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date du rendez-vous inconnue";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "full"
  }).format(date);
}

const openingResponsesRanges = new Set<OpeningResponsesRange>([
  "this_week",
  "two_weeks",
  "one_month",
  "three_months",
  "all"
]);

function getSingleSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function normalizeOpeningResponsesFilters(params: {
  range?: string | string[];
  serviceId?: string | string[];
  q?: string | string[];
}): OpeningResponsesFilters {
  const rawRange = getSingleSearchParam(params.range);
  const rawServiceId = getSingleSearchParam(params.serviceId).trim();
  const q = getSingleSearchParam(params.q).trim().slice(0, 80);

  return {
    range: openingResponsesRanges.has(rawRange as OpeningResponsesRange)
      ? (rawRange as OpeningResponsesRange)
      : "all",
    serviceId: rawServiceId || "all",
    q
  };
}

export function normalizeSearchText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/%/g, " off ")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();
}

export function compactSearchText(value: string | null | undefined): string {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

export function searchableTextMatches(
  haystackValues: Array<string | number | null | undefined>,
  rawQuery: string
): boolean {
  const query = normalizeSearchText(rawQuery);
  const compactQuery = compactSearchText(rawQuery);

  if (!query && !compactQuery) {
    return true;
  }

  const rawHaystack = haystackValues
    .filter((value): value is string | number => value !== null && value !== undefined)
    .join(" ");
  const haystack = normalizeSearchText(rawHaystack);
  const compactHaystack = compactSearchText(rawHaystack);

  if (query && haystack.includes(query)) {
    return true;
  }

  if (compactQuery && compactHaystack.includes(compactQuery)) {
    return true;
  }

  const tokens = query.split(/\s+/).filter(Boolean);

  return tokens.every(
    (token) => haystack.includes(token) || compactHaystack.includes(token)
  );
}

export function buildOpeningResponsesResetHref() {
  return "/dashboard/responses?tab=openings";
}

function getOpeningRangeEnd(range: OpeningResponsesRange, now: Date) {
  if (range === "all") {
    return null;
  }

  const end = new Date(now);
  const days =
    range === "this_week"
      ? 7
      : range === "two_weeks"
        ? 14
        : range === "one_month"
          ? 31
          : 92;

  end.setDate(end.getDate() + days);
  return end;
}

function matchesOpeningRange(
  group: OpeningResponseGroup,
  range: OpeningResponsesRange,
  now: Date
) {
  const rangeEnd = getOpeningRangeEnd(range, now);

  if (!rangeEnd) {
    return true;
  }

  if (!group.startTime) {
    return false;
  }

  const startTime = new Date(group.startTime).getTime();
  const rangeStartTime = new Date(now).setHours(0, 0, 0, 0);

  return (
    Number.isFinite(startTime) &&
    startTime >= rangeStartTime &&
    startTime <= rangeEnd.getTime()
  );
}

function matchesOpeningService(
  group: OpeningResponseGroup,
  serviceId: OpeningResponsesFilters["serviceId"]
) {
  if (serviceId === "all") {
    return true;
  }

  if (serviceId === "none") {
    return !group.serviceId;
  }

  return group.serviceId === serviceId;
}

function getOpeningSearchValues(group: OpeningResponseGroup) {
  return [
    group.openingId,
    group.openingTitle,
    group.serviceName,
    group.serviceName ? null : "Service non precise Service non précisé",
    group.offerLabel,
    group.openingStatus,
    "Aucune reponse Aucune réponse",
    "Reponse positive Réponse positive",
    "En attente de validation",
    "SMS envoye SMS envoyé",
    ...group.customers.flatMap((customer) => [
      customer.customerName,
      customer.customerPhone,
      customer.offerStatus,
      customer.responseText,
      customer.lastInboundBody,
      customer.replyClassification,
      customer.replyClassification === "waitlist_positive"
        ? "Reponse positive Réponse positive"
        : null,
      customer.replyClassification === "none" ? "Aucune reponse Aucune réponse" : null,
      customer.offerStatus === "sent" ? "SMS envoye SMS envoyé" : null,
      customer.responseRank ? `rang ${customer.responseRank}` : null,
      customer.responseRank ? `rank ${customer.responseRank}` : null,
      customer.responseRank ? `#${customer.responseRank}` : null
    ])
  ];
}

export function openingGroupMatchesQuery(
  group: OpeningResponseGroup,
  q: string
) {
  return searchableTextMatches(getOpeningSearchValues(group), q);
}

export function filterOpeningResponseGroups(
  groups: OpeningResponseGroup[],
  filters: OpeningResponsesFilters,
  now = new Date()
): OpeningResponseGroup[] {
  return groups.filter(
    (group) =>
      matchesOpeningRange(group, filters.range, now) &&
      matchesOpeningService(group, filters.serviceId) &&
      openingGroupMatchesQuery(group, filters.q)
  );
}

export function resolveOpeningDisplayValueCents({
  bookingRecoveredValueCents,
  openingNormalPriceCents,
  serviceNormalPriceCents
}: {
  bookingRecoveredValueCents: number | null | undefined;
  openingNormalPriceCents: number | null | undefined;
  serviceNormalPriceCents: number | null | undefined;
}): {
  valueCents: number | null;
  source: OpeningValueSource;
} {
  if (bookingRecoveredValueCents !== null && bookingRecoveredValueCents !== undefined) {
    return {
      valueCents: bookingRecoveredValueCents,
      source: "booking_request"
    };
  }

  if (openingNormalPriceCents !== null && openingNormalPriceCents !== undefined) {
    return {
      valueCents: openingNormalPriceCents,
      source: "opening"
    };
  }

  if (serviceNormalPriceCents !== null && serviceNormalPriceCents !== undefined) {
    return {
      valueCents: serviceNormalPriceCents,
      source: "service"
    };
  }

  return {
    valueCents: null,
    source: "unknown"
  };
}

export function groupAppointmentResponseItems(
  items: AppointmentResponseCalendarItem[]
): AppointmentResponseDayGroup[] {
  const groups = new Map<string, AppointmentResponseDayGroup>();

  for (const item of items) {
    const groupingDate = item.appointmentStartsAt ?? item.inboundReceivedAt;
    const dateKey = getDateKey(groupingDate);
    const dateLabel = item.appointmentStartsAt
      ? formatDateLabel(item.appointmentStartsAt)
      : "Date du rendez-vous inconnue";
    const existing = groups.get(dateKey) ?? {
      dateKey,
      dateLabel,
      items: []
    };

    existing.items.push(item);
    groups.set(dateKey, existing);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      items: [...group.items].sort(
        (a, b) =>
          getTimeValue(a.appointmentStartsAt ?? a.inboundReceivedAt) -
          getTimeValue(b.appointmentStartsAt ?? b.inboundReceivedAt)
      )
    }))
    .sort((a, b) => {
      const first = getTimeValue(a.items[0]?.appointmentStartsAt ?? a.items[0]?.inboundReceivedAt);
      const second = getTimeValue(b.items[0]?.appointmentStartsAt ?? b.items[0]?.inboundReceivedAt);

      return first - second;
    });
}

function getOpeningResponseSortBucket(customer: OpeningResponseCustomer) {
  if (
    customer.replyClassification === "waitlist_positive" ||
    customer.responseRank !== null
  ) {
    return 0;
  }

  if (customer.lastInboundReceivedAt || customer.respondedAt) {
    return 1;
  }

  return 2;
}

export function sortOpeningResponseCustomers(
  customers: OpeningResponseCustomer[]
): OpeningResponseCustomer[] {
  return [...customers].sort((a, b) => {
    const bucketDelta =
      getOpeningResponseSortBucket(a) - getOpeningResponseSortBucket(b);

    if (bucketDelta !== 0) {
      return bucketDelta;
    }

    if (getOpeningResponseSortBucket(a) === 0) {
      return (a.responseRank ?? Number.POSITIVE_INFINITY) -
        (b.responseRank ?? Number.POSITIVE_INFINITY);
    }

    return getTimeValue(a.respondedAt ?? a.lastInboundReceivedAt) -
      getTimeValue(b.respondedAt ?? b.lastInboundReceivedAt);
  });
}

export async function loadServices() {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function loadCustomersWithConsent({
  includeDeleted = false,
  onlyDeleted = false
}: {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
} = {}): Promise<CustomerWithConsent[]> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  let customersQuery = supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId);

  if (onlyDeleted) {
    customersQuery = customersQuery.not("deleted_at", "is", null);
  } else if (!includeDeleted) {
    customersQuery = customersQuery.is("deleted_at", null);
  }

  const [customersResult, consentsResult, consentRequestsResult] = await Promise.all([
    customersQuery.order("created_at", { ascending: false }),
    supabase
      .from("sms_consents")
      .select("*")
      .eq("organization_id", organizationId),
    supabase
      .from("sms_consent_requests")
      .select("customer_id, status, created_at")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
  ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (consentsResult.error) {
    throw new Error(consentsResult.error.message);
  }

  if (consentRequestsResult.error) {
    throw new Error(consentRequestsResult.error.message);
  }

  const consentByCustomer = new Map(
    (consentsResult.data ?? []).map((consent) => [consent.customer_id, consent])
  );
  const latestConsentRequestByCustomer = new Map<string, string>();

  for (const request of consentRequestsResult.data ?? []) {
    if (!latestConsentRequestByCustomer.has(request.customer_id)) {
      latestConsentRequestByCustomer.set(request.customer_id, request.status);
    }
  }

  return (customersResult.data ?? []).map((customer) => ({
    ...customer,
    consentStatus: consentByCustomer.get(customer.id)?.status ?? "missing",
    latestConsentRequestStatus:
      latestConsentRequestByCustomer.get(customer.id) ?? null
  }));
}

export async function loadCustomerEditData(
  customerId: string
): Promise<CustomerEditData | null> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const [customerResult, consentResult, waitlistResult] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("sms_consents")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .maybeSingle(),
    supabase
      .from("waitlist_entries")
      .select("service_id")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
  ]);

  if (customerResult.error) {
    throw new Error(customerResult.error.message);
  }

  if (consentResult.error) {
    throw new Error(consentResult.error.message);
  }

  if (waitlistResult.error) {
    throw new Error(waitlistResult.error.message);
  }

  if (!customerResult.data) {
    return null;
  }

  return {
    ...customerResult.data,
    consentStatus: consentResult.data?.status ?? "missing",
    serviceId: waitlistResult.data?.service_id ?? null
  };
}

export async function loadWaitlistView(): Promise<{
  customers: CustomerWithConsent[];
  services: ServiceRow[];
  entries: WaitlistEntryView[];
}> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return {
      customers: [],
      services: [],
      entries: []
    };
  }

  const supabase = await createSupabaseServerClient();
  const [customers, services, waitlistResult, waitlistServicesResult] =
    await Promise.all([
    loadCustomersWithConsent(),
    loadServices(),
    supabase
      .from("waitlist_entries")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("waitlist_entry_services")
      .select("*")
      .eq("organization_id", organizationId)
  ]);

  if (waitlistResult.error) {
    throw new Error(waitlistResult.error.message);
  }

  if (waitlistServicesResult.error) {
    throw new Error(waitlistServicesResult.error.message);
  }

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const serviceById = new Map(services.map((service) => [service.id, service]));
  const serviceInterestsByEntry = new Map<string, WaitlistEntryServiceRow[]>();

  for (const serviceInterest of waitlistServicesResult.data ?? []) {
    const existing =
      serviceInterestsByEntry.get(serviceInterest.waitlist_entry_id) ?? [];
    existing.push(serviceInterest);
    serviceInterestsByEntry.set(serviceInterest.waitlist_entry_id, existing);
  }

  return {
    customers,
    services,
    entries: (waitlistResult.data ?? []).flatMap((entry) => {
      const customer = customerById.get(entry.customer_id);

      if (!customer) {
        return [];
      }

      const service = entry.service_id ? serviceById.get(entry.service_id) : null;
      const serviceInterestIds =
        serviceInterestsByEntry
          .get(entry.id)
          ?.map((serviceInterest) => serviceInterest.service_id) ??
        (entry.service_id ? [entry.service_id] : []);
      const serviceInterestNames = serviceInterestIds
        .map((serviceId) => serviceById.get(serviceId)?.name)
        .filter((name): name is string => Boolean(name));

      return {
        ...entry,
        customerName: customer.full_name,
        customerPhone: customer.phone_e164,
        customerLanguage: customer.preferred_language,
        customerSource: customer.source,
        consentStatus: customer.consentStatus,
        serviceName: service?.name ?? null,
        serviceInterestIds,
        serviceInterestNames,
        smsEligibility: getWaitlistSmsEligibility({
          consentStatus: customer.consentStatus,
          phone: customer.phone_e164,
          deletedAt: customer.deleted_at
        })
      };
    })
  };
}

export async function loadOpeningCreationData() {
  const [services, waitlist, smsPersistence] = await Promise.all([
    loadServices(),
    loadWaitlistView(),
    checkSmsDeliveryPersistenceReadiness()
  ]);

  return {
    services,
    smsPersistence,
    eligibleCustomers: waitlist.customers.filter(
      (customer) => customer.consentStatus === "opted_in"
    )
  };
}

export async function loadAppointmentWorkspace(filters?: {
  range?: string;
  status?: string;
}): Promise<{
  appointments: AppointmentView[];
  customers: CustomerWithConsent[];
  services: ServiceRow[];
  settings: Pick<
    OrganizationSettingsRow,
    | "appointment_reminders_enabled"
    | "default_reminder_delay_hours"
    | "appointment_confirmation_requests_enabled"
    | "client_sms_cancellation_enabled"
  > | null;
  timezone: string | null;
}> {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    return {
      appointments: [],
      customers: [],
      services: [],
      settings: null,
      timezone: null
    };
  }

  const organizationId = workspace.organization.id;
  const supabase = await createSupabaseServerClient();
  const [customers, services, settingsResult] = await Promise.all([
    loadCustomersWithConsent(),
    loadServices(),
    supabase
      .from("organization_settings")
      .select(
        "appointment_reminders_enabled, default_reminder_delay_hours, appointment_confirmation_requests_enabled, client_sms_cancellation_enabled"
      )
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  if (settingsResult.error) {
    throw new Error(settingsResult.error.message);
  }

  let appointmentsQuery = supabase
    .from("appointments")
    .select("*")
    .eq("organization_id", organizationId)
    .order("starts_at", { ascending: true });

  if (filters?.status && filters.status !== "all") {
    appointmentsQuery = appointmentsQuery.eq("status", filters.status);
  }

  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
  const startOfDayAfterTomorrow = new Date(startOfTomorrow);
  startOfDayAfterTomorrow.setDate(startOfDayAfterTomorrow.getDate() + 1);
  const sevenDaysFromToday = new Date(startOfToday);
  sevenDaysFromToday.setDate(sevenDaysFromToday.getDate() + 7);

  if (filters?.range === "today") {
    appointmentsQuery = appointmentsQuery
      .gte("starts_at", startOfToday.toISOString())
      .lt("starts_at", startOfTomorrow.toISOString());
  } else if (filters?.range === "tomorrow") {
    appointmentsQuery = appointmentsQuery
      .gte("starts_at", startOfTomorrow.toISOString())
      .lt("starts_at", startOfDayAfterTomorrow.toISOString());
  } else if (filters?.range === "next_7_days") {
    appointmentsQuery = appointmentsQuery
      .gte("starts_at", startOfToday.toISOString())
      .lt("starts_at", sevenDaysFromToday.toISOString());
  }

  const { data: appointments, error } = await appointmentsQuery;

  if (error) {
    throw new Error(error.message);
  }

  const customerById = new Map(customers.map((customer) => [customer.id, customer]));
  const serviceById = new Map(services.map((service) => [service.id, service]));

  return {
    appointments: (appointments ?? []).map((appointment) => {
      const customer = customerById.get(appointment.customer_id);
      const service = appointment.service_id
        ? serviceById.get(appointment.service_id)
        : null;

      return {
        ...appointment,
        customerName: customer?.full_name ?? "Client inconnu",
        customerPhone: customer?.phone_e164 ?? "",
        serviceName: service?.name ?? null
      };
    }),
    customers,
    services,
    settings: settingsResult.data ?? null,
    timezone: workspace.organization.timezone
  };
}

export async function loadOpenings(): Promise<OpeningView[]> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("openings")
    .select("*")
    .eq("organization_id", organizationId)
    .order("start_time", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const openings = data ?? [];

  if (openings.length === 0) {
    return [];
  }

  const openingIds = openings.map((opening) => opening.id);
  const serviceIds = [
    ...new Set(
      openings
        .map((opening) => opening.service_id)
        .filter((serviceId): serviceId is string => Boolean(serviceId))
    )
  ];
  const [bookingsResult, servicesResult] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("opening_id, recovered_value_cents, created_at")
      .eq("organization_id", organizationId)
      .in("opening_id", openingIds)
      .in("status", ["confirmed", "completed"])
      .order("created_at", { ascending: false }),
    serviceIds.length > 0
      ? supabase
          .from("services")
          .select("id, normal_price_cents")
          .eq("organization_id", organizationId)
          .in("id", serviceIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (bookingsResult.error) {
    throw new Error(bookingsResult.error.message);
  }

  if (servicesResult.error) {
    throw new Error(servicesResult.error.message);
  }

  const recoveredValueByOpening = new Map<string, number | null>();

  for (const booking of bookingsResult.data ?? []) {
    if (!recoveredValueByOpening.has(booking.opening_id)) {
      recoveredValueByOpening.set(
        booking.opening_id,
        booking.recovered_value_cents
      );
    }
  }

  const serviceValueById = new Map(
    (servicesResult.data ?? []).map((service) => [
      service.id,
      service.normal_price_cents
    ])
  );

  return openings.map((opening) => {
    const recoveredValueCents = recoveredValueByOpening.get(opening.id) ?? null;
    const serviceNormalPriceCents = opening.service_id
      ? serviceValueById.get(opening.service_id) ?? null
      : null;
    const displayValue = resolveOpeningDisplayValueCents({
      bookingRecoveredValueCents: recoveredValueCents,
      openingNormalPriceCents: opening.normal_price_cents,
      serviceNormalPriceCents
    });

    return {
      ...opening,
      displayValueCents: displayValue.valueCents,
      displayValueSource: displayValue.source,
      recoveredValueCents,
      serviceNormalPriceCents
    };
  });
}

export async function loadOpeningDetail(
  openingId: string
): Promise<OpeningDetailData> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return {
      opening: null,
      service: null,
      offers: [],
      deliveryHistoryWarning: null
    };
  }

  const supabase = await createSupabaseServerClient();
  const [openingResult, offersResult] = await Promise.all([
    supabase
      .from("openings")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", openingId)
      .maybeSingle(),
    supabase
      .from("opening_offers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("opening_id", openingId)
      .order("created_at", { ascending: true })
  ]);

  if (openingResult.error) {
    throw new Error(openingResult.error.message);
  }

  if (offersResult.error) {
    throw new Error(offersResult.error.message);
  }

  const opening = openingResult.data ?? null;
  const offers = offersResult.data ?? [];

  if (!opening) {
    return {
      opening: null,
      service: null,
      offers: [],
      deliveryHistoryWarning: null
    };
  }

  const customerIds = [...new Set(offers.map((offer) => offer.customer_id))];
  const [serviceResult, customersResult] = await Promise.all([
    opening.service_id
      ? supabase
          .from("services")
          .select("id, name, normal_price_cents")
          .eq("organization_id", organizationId)
          .eq("id", opening.service_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select("id, full_name, phone_e164, preferred_language")
          .eq("organization_id", organizationId)
          .in("id", customerIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (serviceResult.error) {
    throw new Error(serviceResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  const messagesResult =
    customerIds.length > 0
      ? await supabase
          .from("sms_messages")
          .select("customer_id, body, status, error_code, error_message, status_callback_received_at, delivered_at, failed_at, provider, provider_message_id, from_number, to_number, created_at")
          .eq("organization_id", organizationId)
          .eq("opening_id", openingId)
          .eq("direction", "outbound")
          .in("customer_id", customerIds)
          .order("created_at", { ascending: false })
      : { data: [], error: null };
  let deliveryHistoryWarning: string | null = null;

  if (messagesResult.error) {
    console.warn("Opening SMS delivery history query failed", {
      openingId,
      organizationId,
      schemaIssue: isSmsPersistenceSchemaError(messagesResult.error)
    });
    deliveryHistoryWarning =
      "SMS delivery history is temporarily unavailable. The opening and offers are still available.";
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const lastMessageByCustomer = new Map<
    string,
    {
      body: string;
      status: string;
      error_code: string | null;
      error_message: string | null;
      status_callback_received_at: string | null;
      delivered_at: string | null;
      failed_at: string | null;
      provider: string;
      provider_message_id: string | null;
      from_number: string;
      to_number: string;
      created_at: string;
    }
  >();

  for (const message of messagesResult.error ? [] : messagesResult.data ?? []) {
    if (message.customer_id && !lastMessageByCustomer.has(message.customer_id)) {
      lastMessageByCustomer.set(message.customer_id, message);
    }
  }

  return {
    opening,
    service: serviceResult.data ?? null,
    deliveryHistoryWarning,
    offers: offers.map((offer) => {
      const customer = customerById.get(offer.customer_id);
      const lastOutbound = lastMessageByCustomer.get(offer.customer_id);

      return {
        ...offer,
        customerName: customer?.full_name ?? "Client inconnu",
        customerPhone: customer?.phone_e164 ?? "",
        customerLanguage: customer?.preferred_language ?? "fr",
        lastOutboundMessageBody: lastOutbound?.body ?? null,
        lastOutboundMessageStatus: lastOutbound?.status ?? null,
        lastOutboundErrorCode: lastOutbound?.error_code ?? null,
        lastOutboundErrorMessage: lastOutbound?.error_message ?? null,
        lastOutboundStatusCallbackReceivedAt:
          lastOutbound?.status_callback_received_at ?? null,
        lastOutboundDeliveredAt: lastOutbound?.delivered_at ?? null,
        lastOutboundFailedAt: lastOutbound?.failed_at ?? null,
        lastOutboundProvider: lastOutbound?.provider ?? null,
        lastOutboundProviderMessageId:
          lastOutbound?.provider_message_id ?? null,
        lastOutboundSentAt: lastOutbound?.created_at ?? null,
        lastOutboundFromNumber: lastOutbound?.from_number ?? null,
        lastOutboundToNumber: lastOutbound?.to_number ?? null
      };
    })
  };
}

export async function loadAppointmentResponseCalendar(): Promise<
  AppointmentResponseDayGroup[]
> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: messages, error: messagesError } = await supabase
    .from("sms_messages")
    .select("id, customer_id, appointment_id, body, created_at")
    .eq("organization_id", organizationId)
    .eq("direction", "inbound")
    .not("appointment_id", "is", null)
    .order("created_at", { ascending: false });

  if (messagesError) {
    throw new Error(messagesError.message);
  }

  const inboundMessages = messages ?? [];

  if (inboundMessages.length === 0) {
    return [];
  }

  const appointmentIds = [
    ...new Set(
      inboundMessages
        .map((message) => message.appointment_id)
        .filter((appointmentId): appointmentId is string => Boolean(appointmentId))
    )
  ];
  const customerIds = [
    ...new Set(
      inboundMessages
        .map((message) => message.customer_id)
        .filter((customerId): customerId is string => Boolean(customerId))
    )
  ];

  const [appointmentsResult, customersResult] = await Promise.all([
    supabase
      .from("appointments")
      .select(
        "id, customer_id, service_id, starts_at, ends_at, status, confirmation_status, timezone"
      )
      .eq("organization_id", organizationId)
      .in("id", appointmentIds),
    customerIds.length > 0
      ? supabase
          .from("customers")
          .select("id, full_name, phone_e164")
          .eq("organization_id", organizationId)
          .in("id", customerIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (appointmentsResult.error) {
    throw new Error(appointmentsResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  const appointmentById = new Map(
    (appointmentsResult.data ?? []).map((appointment) => [
      appointment.id,
      appointment
    ])
  );
  const serviceIds = [
    ...new Set(
      (appointmentsResult.data ?? [])
        .map((appointment) => appointment.service_id)
        .filter((serviceId): serviceId is string => Boolean(serviceId))
    )
  ];
  const servicesResult =
    serviceIds.length > 0
      ? await supabase
          .from("services")
          .select("id, name")
          .eq("organization_id", organizationId)
          .in("id", serviceIds)
      : { data: [], error: null };

  if (servicesResult.error) {
    throw new Error(servicesResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const serviceById = new Map(
    (servicesResult.data ?? []).map((service) => [service.id, service.name])
  );
  const items = inboundMessages.flatMap((message) => {
    if (!message.appointment_id) {
      return [];
    }

    const appointment = appointmentById.get(message.appointment_id);
    const customerId = message.customer_id ?? appointment?.customer_id ?? null;
    const customer = customerId ? customerById.get(customerId) : null;

    return [{
      id: message.id,
      appointmentId: message.appointment_id,
      customerId,
      customerName: customer?.full_name ?? "Client inconnu",
      customerPhone: customer?.phone_e164 ?? "",
      serviceName: appointment?.service_id
        ? serviceById.get(appointment.service_id) ?? null
        : null,
      appointmentStartsAt: appointment?.starts_at ?? null,
      appointmentEndsAt: appointment?.ends_at ?? null,
      appointmentStatus: appointment?.status ?? null,
      confirmationStatus: appointment?.confirmation_status ?? null,
      timezone: appointment?.timezone ?? null,
      inboundBody: message.body,
      inboundReceivedAt: message.created_at,
      classification: classifyInboundSmsBody(message.body, "appointment")
    }];
  });

  return groupAppointmentResponseItems(items);
}

export async function loadOpeningResponseGroups(): Promise<
  OpeningResponseGroup[]
> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: offers, error: offersError } = await supabase
    .from("opening_offers")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["sent", "responded", "selected", "rejected"])
    .order("created_at", { ascending: true });

  if (offersError) {
    throw new Error(offersError.message);
  }

  if (!offers || offers.length === 0) {
    return [];
  }

  const customerIds = [...new Set(offers.map((offer) => offer.customer_id))];
  const openingIds = [...new Set(offers.map((offer) => offer.opening_id))];
  const [customersResult, openingsResult, messagesResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone_e164")
      .eq("organization_id", organizationId)
      .in("id", customerIds),
    supabase
      .from("openings")
      .select("id, title, start_time, end_time, offer_label, status, service_id")
      .eq("organization_id", organizationId)
      .in("id", openingIds),
    supabase
      .from("sms_messages")
      .select("customer_id, opening_id, body, created_at")
      .eq("organization_id", organizationId)
      .eq("direction", "inbound")
      .in("opening_id", openingIds)
      .order("created_at", { ascending: false })
  ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (openingsResult.error) {
    throw new Error(openingsResult.error.message);
  }

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  const serviceIds = [
    ...new Set(
      (openingsResult.data ?? [])
        .map((opening) => opening.service_id)
        .filter((serviceId): serviceId is string => Boolean(serviceId))
    )
  ];
  const servicesResult =
    serviceIds.length > 0
      ? await supabase
          .from("services")
          .select("id, name")
          .eq("organization_id", organizationId)
          .in("id", serviceIds)
      : { data: [], error: null };

  if (servicesResult.error) {
    throw new Error(servicesResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const openingById = new Map(
    (openingsResult.data ?? []).map((opening) => [opening.id, opening])
  );
  const serviceById = new Map(
    (servicesResult.data ?? []).map((service) => [service.id, service.name])
  );
  const lastInboundByContext = new Map<
    string,
    {
      body: string;
      created_at: string;
    }
  >();

  for (const message of messagesResult.data ?? []) {
    if (!message.opening_id || !message.customer_id) {
      continue;
    }

    const key = `${message.opening_id}:${message.customer_id}`;

    if (!lastInboundByContext.has(key)) {
      lastInboundByContext.set(key, {
        body: message.body,
        created_at: message.created_at
      });
    }
  }

  const offersByOpening = new Map<string, OpeningOfferRow[]>();

  for (const offer of offers) {
    offersByOpening.set(offer.opening_id, [
      ...(offersByOpening.get(offer.opening_id) ?? []),
      offer
    ]);
  }

  return [...offersByOpening.entries()]
    .map(([openingId, openingOffers]) => {
      const opening = openingById.get(openingId);
      const customers = openingOffers.map((offer) => {
        const customer = customerById.get(offer.customer_id);
        const inbound = lastInboundByContext.get(
          `${offer.opening_id}:${offer.customer_id}`
        );
        const replyClassification: OpeningResponseCustomer["replyClassification"] = inbound?.body
          ? classifyInboundSmsBody(inbound.body, "waitlist")
          : "none";

        return {
          offerId: offer.id,
          customerId: offer.customer_id,
          customerName: customer?.full_name ?? "Client inconnu",
          customerPhone: customer?.phone_e164 ?? "",
          offerStatus: offer.status,
          responseRank: offer.response_rank,
          responseText: offer.response_text,
          respondedAt: offer.responded_at,
          lastInboundBody: inbound?.body ?? null,
          lastInboundReceivedAt: inbound?.created_at ?? null,
          replyClassification
        };
      });
      const sortedCustomers = sortOpeningResponseCustomers(customers);
      const responseCount = sortedCustomers.filter(
        (customer) =>
          customer.lastInboundReceivedAt ||
          customer.respondedAt ||
          customer.responseText
      ).length;
      const positiveCount = sortedCustomers.filter(
        (customer) =>
          customer.replyClassification === "waitlist_positive" ||
          customer.responseRank !== null ||
          ["responded", "selected"].includes(customer.offerStatus)
      ).length;

      return {
        openingId,
        openingTitle: opening?.title ?? "Annulation inconnue",
        serviceId: opening?.service_id ?? null,
        serviceName: opening?.service_id
          ? serviceById.get(opening.service_id) ?? null
          : null,
        startTime: opening?.start_time ?? null,
        endTime: opening?.end_time ?? null,
        offerLabel: opening?.offer_label ?? null,
        openingStatus: opening?.status ?? "unknown",
        sentCount: openingOffers.length,
        responseCount,
        positiveCount,
        noReplyCount: Math.max(0, openingOffers.length - responseCount),
        customers: sortedCustomers
      };
    })
    .sort((a, b) => getTimeValue(b.startTime) - getTimeValue(a.startTime));
}

export async function loadResponseQueue(): Promise<ResponseQueueItem[]> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const { data: offers, error: offersError } = await supabase
    .from("opening_offers")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["sent", "responded", "selected", "rejected"])
    .order("responded_at", { ascending: true, nullsFirst: false });

  if (offersError) {
    throw new Error(offersError.message);
  }

  if (!offers || offers.length === 0) {
    return [];
  }

  const customerIds = [...new Set(offers.map((offer) => offer.customer_id))];
  const openingIds = [...new Set(offers.map((offer) => offer.opening_id))];
  const [customersResult, openingsResult, messagesResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone_e164")
      .eq("organization_id", organizationId)
      .in("id", customerIds),
    supabase
      .from("openings")
      .select("id, title, start_time, service_id")
      .eq("organization_id", organizationId)
      .in("id", openingIds),
    supabase
      .from("sms_messages")
      .select("customer_id, opening_id, body, status, created_at")
      .eq("organization_id", organizationId)
      .eq("direction", "inbound")
      .in("opening_id", openingIds)
      .order("created_at", { ascending: false })
  ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (openingsResult.error) {
    throw new Error(openingsResult.error.message);
  }

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const openingById = new Map(
    (openingsResult.data ?? []).map((opening) => [opening.id, opening])
  );
  const serviceIds = [
    ...new Set(
      (openingsResult.data ?? [])
        .map((opening) => opening.service_id)
        .filter((serviceId): serviceId is string => Boolean(serviceId))
    )
  ];
  const servicesResult =
    serviceIds.length > 0
      ? await supabase
          .from("services")
          .select("id, name")
          .eq("organization_id", organizationId)
          .in("id", serviceIds)
      : { data: [], error: null };

  if (servicesResult.error) {
    throw new Error(servicesResult.error.message);
  }

  const serviceById = new Map(
    (servicesResult.data ?? []).map((service) => [service.id, service.name])
  );
  const inboundByOfferContext = new Map<
    string,
    {
      body: string;
      status: string;
      created_at: string;
    }
  >();

  for (const message of messagesResult.data ?? []) {
    const key = `${message.opening_id}:${message.customer_id}`;

    if (!inboundByOfferContext.has(key)) {
      inboundByOfferContext.set(key, message);
    }
  }

  return offers.flatMap((offer) => {
    const customer = customerById.get(offer.customer_id);
    const opening = openingById.get(offer.opening_id);
    const inbound = inboundByOfferContext.get(
      `${offer.opening_id}:${offer.customer_id}`
    );

    if (offer.status === "sent" && !inbound) {
      return [];
    }

    return [{
      ...offer,
      customerName: customer?.full_name ?? "Client inconnu",
      customerPhone: customer?.phone_e164 ?? "",
      openingTitle: opening?.title ?? "Ouverture inconnue",
      openingStartTime: opening?.start_time ?? "",
      serviceName: opening?.service_id
        ? serviceById.get(opening.service_id) ?? null
        : null,
      lastInboundBody: inbound?.body ?? offer.response_text ?? null,
      lastInboundStatus: inbound?.status ?? null,
      lastInboundReceivedAt: inbound?.created_at ?? offer.responded_at ?? null,
      replyClassification:
        inbound?.body
          ? classifyInboundSmsBody(inbound.body, "waitlist")
          : offer.status === "responded"
            ? "waitlist_positive"
            : "none"
    }];
  });
}
