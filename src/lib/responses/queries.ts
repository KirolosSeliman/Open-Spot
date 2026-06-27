import "server-only";

import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  classifyInboundSmsBody,
  type InboundSmsClassification
} from "@/lib/sms/inbound";

import {
  getCalendarRange,
  normalizeCalendarInterval,
  parseCalendarAnchor
} from "./calendar-utils";
import type { AppointmentCalendarItem, CalendarInterval } from "./types";

const sentSmsStatuses = new Set([
  "accepted",
  "queued",
  "sending",
  "sent",
  "delivered",
  "submitted_to_provider",
  "simulated"
]);

export async function loadAppointmentCalendarItems({
  calDate,
  calInterval
}: {
  calDate?: string;
  calInterval?: string;
}): Promise<{
  items: AppointmentCalendarItem[];
  anchor: Date;
  interval: CalendarInterval;
  rangeStart: Date;
  rangeEnd: Date;
}> {
  const workspace = await getActiveOrganizationWorkspace();
  const anchor = parseCalendarAnchor(calDate);
  const interval = normalizeCalendarInterval(calInterval);
  const { start, end } = getCalendarRange(anchor, interval);

  if (workspace.status !== "ready") {
    return { items: [], anchor, interval, rangeStart: start, rangeEnd: end };
  }

  const organizationId = workspace.organization.id;
  const supabase = await createSupabaseServerClient();

  const { data: appointments, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("organization_id", organizationId)
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = appointments ?? [];

  if (rows.length === 0) {
    return { items: [], anchor, interval, rangeStart: start, rangeEnd: end };
  }

  const appointmentIds = rows.map((appointment) => appointment.id);
  const customerIds = [...new Set(rows.map((appointment) => appointment.customer_id))];
  const serviceIds = [
    ...new Set(
      rows
        .map((appointment) => appointment.service_id)
        .filter((serviceId): serviceId is string => Boolean(serviceId))
    )
  ];

  const [customersResult, servicesResult, outboundResult, inboundResult, bookingsResult] =
    await Promise.all([
      supabase
        .from("customers")
        .select("id, full_name, phone_e164, email, preferred_language")
        .eq("organization_id", organizationId)
        .in("id", customerIds),
      serviceIds.length > 0
        ? supabase
            .from("services")
            .select("id, name")
            .eq("organization_id", organizationId)
            .in("id", serviceIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("sms_messages")
        .select("appointment_id, body, status, created_at")
        .eq("organization_id", organizationId)
        .eq("direction", "outbound")
        .in("appointment_id", appointmentIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("sms_messages")
        .select("appointment_id, body, created_at")
        .eq("organization_id", organizationId)
        .eq("direction", "inbound")
        .in("appointment_id", appointmentIds)
        .order("created_at", { ascending: false }),
      supabase
        .from("booking_requests")
        .select("opening_id, customer_id")
        .eq("organization_id", organizationId)
        .in("customer_id", customerIds)
    ]);

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (servicesResult.error) {
    throw new Error(servicesResult.error.message);
  }

  if (outboundResult.error) {
    throw new Error(outboundResult.error.message);
  }

  if (inboundResult.error) {
    throw new Error(inboundResult.error.message);
  }

  if (bookingsResult.error) {
    throw new Error(bookingsResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const serviceById = new Map(
    (servicesResult.data ?? []).map((service) => [service.id, service.name])
  );
  const outboundByAppointment = new Map<
    string,
    { body: string; status: string; created_at: string }
  >();
  const inboundByAppointment = new Map<
    string,
    { body: string; created_at: string; classification: InboundSmsClassification }
  >();
  const openingByCustomer = new Map<string, string>();

  for (const message of outboundResult.data ?? []) {
    if (message.appointment_id && !outboundByAppointment.has(message.appointment_id)) {
      outboundByAppointment.set(message.appointment_id, message);
    }
  }

  for (const message of inboundResult.data ?? []) {
    if (message.appointment_id && !inboundByAppointment.has(message.appointment_id)) {
      inboundByAppointment.set(message.appointment_id, {
        body: message.body,
        created_at: message.created_at,
        classification: classifyInboundSmsBody(message.body, "appointment")
      });
    }
  }

  for (const booking of bookingsResult.data ?? []) {
    if (!openingByCustomer.has(booking.customer_id)) {
      openingByCustomer.set(booking.customer_id, booking.opening_id);
    }
  }

  const items: AppointmentCalendarItem[] = rows.map((appointment) => {
    const customer = customerById.get(appointment.customer_id);
    const outbound = outboundByAppointment.get(appointment.id);
    const inbound = inboundByAppointment.get(appointment.id);
    const smsSent =
      appointment.reminder_status === "sent" ||
      Boolean(
        outbound &&
          (sentSmsStatuses.has(outbound.status) || outbound.status === "delivered")
      );

    return {
      id: appointment.id,
      customerId: appointment.customer_id,
      customerName: customer?.full_name ?? "Client inconnu",
      customerPhone: customer?.phone_e164 ?? "",
      customerEmail: customer?.email ?? null,
      customerLanguage: customer?.preferred_language ?? "fr",
      serviceId: appointment.service_id,
      serviceName: appointment.service_id
        ? serviceById.get(appointment.service_id) ?? null
        : null,
      startsAt: appointment.starts_at,
      endsAt: appointment.ends_at,
      timezone: appointment.timezone,
      status: appointment.status,
      confirmationStatus: appointment.confirmation_status,
      notes: appointment.notes,
      reminderStatus: appointment.reminder_status,
      confirmationRequestEnabled: appointment.confirmation_request_enabled,
      smsSent,
      smsSentAt: outbound?.created_at ?? null,
      smsBody: outbound?.body ?? null,
      smsDeliveryStatus: outbound?.status ?? null,
      inboundBody: inbound?.body ?? null,
      inboundReceivedAt: inbound?.created_at ?? null,
      inboundClassification: inbound?.classification ?? null,
      relatedOpeningId: openingByCustomer.get(appointment.customer_id) ?? null
    };
  });

  return { items, anchor, interval, rangeStart: start, rangeEnd: end };
}

export {
  formatCalendarAnchorKey,
  formatCalendarRangeLabel,
  getCalendarRange,
  groupAppointmentsByDay,
  normalizeCalendarInterval,
  shiftCalendarAnchor
} from "./calendar-utils";
