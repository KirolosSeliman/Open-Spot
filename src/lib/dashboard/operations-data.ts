import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { classifyInboundSmsBody } from "@/lib/sms/inbound";
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
export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
export type OrganizationSettingsRow =
  Database["public"]["Tables"]["organization_settings"]["Row"];

export type OpeningDetailOffer = OpeningOfferRow & {
  customerName: string;
  customerPhone: string;
  customerLanguage: CustomerRow["preferred_language"];
  lastOutboundMessageBody: string | null;
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

export type CustomerWithConsent = CustomerRow & {
  consentStatus: ConsentRow["status"] | "missing";
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

export async function loadCustomersWithConsent(): Promise<CustomerWithConsent[]> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const [customersResult, consentsResult] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("sms_consents")
      .select("*")
      .eq("organization_id", organizationId)
  ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (consentsResult.error) {
    throw new Error(consentsResult.error.message);
  }

  const consentByCustomer = new Map(
    (consentsResult.data ?? []).map((consent) => [consent.customer_id, consent])
  );

  return (customersResult.data ?? []).map((customer) => ({
    ...customer,
    consentStatus: consentByCustomer.get(customer.id)?.status ?? "missing"
  }));
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
    entries: (waitlistResult.data ?? []).map((entry) => {
      const customer = customerById.get(entry.customer_id);
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
        customerName: customer?.full_name ?? "Client inconnu",
        customerPhone: customer?.phone_e164 ?? "",
        customerLanguage: customer?.preferred_language ?? "fr",
        customerSource: customer?.source ?? "manual",
        consentStatus: customer?.consentStatus ?? "missing",
        serviceName: service?.name ?? null,
        serviceInterestIds,
        serviceInterestNames,
        smsEligibility: getWaitlistSmsEligibility({
          consentStatus: customer?.consentStatus ?? "missing",
          phone: customer?.phone_e164 ?? ""
        })
      };
    })
  };
}

export async function loadOpeningCreationData() {
  const [services, waitlist] = await Promise.all([
    loadServices(),
    loadWaitlistView()
  ]);

  return {
    services,
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

export async function loadOpenings() {
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

  return data ?? [];
}

export async function loadOpeningDetail(openingId: string): Promise<{
  opening: OpeningRow | null;
  service: Pick<ServiceRow, "id" | "name"> | null;
  offers: OpeningDetailOffer[];
}> {
  const organizationId = await requireOrganizationId();

  if (!organizationId) {
    return {
      opening: null,
      service: null,
      offers: []
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
      offers: []
    };
  }

  const customerIds = [...new Set(offers.map((offer) => offer.customer_id))];
  const [serviceResult, customersResult, messagesResult] = await Promise.all([
    opening.service_id
      ? supabase
          .from("services")
          .select("id, name")
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
      : Promise.resolve({ data: [], error: null }),
    customerIds.length > 0
      ? supabase
          .from("sms_messages")
          .select("customer_id, body, created_at")
          .eq("organization_id", organizationId)
          .eq("opening_id", openingId)
          .eq("direction", "outbound")
          .in("customer_id", customerIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null })
  ]);

  if (serviceResult.error) {
    throw new Error(serviceResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (messagesResult.error) {
    throw new Error(messagesResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const lastMessageByCustomer = new Map<string, string>();

  for (const message of messagesResult.data ?? []) {
    if (message.customer_id && !lastMessageByCustomer.has(message.customer_id)) {
      lastMessageByCustomer.set(message.customer_id, message.body);
    }
  }

  return {
    opening,
    service: serviceResult.data ?? null,
    offers: offers.map((offer) => {
      const customer = customerById.get(offer.customer_id);

      return {
        ...offer,
        customerName: customer?.full_name ?? "Client inconnu",
        customerPhone: customer?.phone_e164 ?? "",
        customerLanguage: customer?.preferred_language ?? "fr",
        lastOutboundMessageBody:
          lastMessageByCustomer.get(offer.customer_id) ?? null
      };
    })
  };
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
