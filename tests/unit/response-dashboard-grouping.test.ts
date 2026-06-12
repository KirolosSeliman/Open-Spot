import { describe, expect, it } from "vitest";

import {
  groupAppointmentResponseItems,
  sortOpeningResponseCustomers,
  type AppointmentResponseCalendarItem,
  type OpeningResponseCustomer
} from "@/lib/dashboard/operations-data";

describe("response dashboard grouping", () => {
  it("groups appointment replies by appointment date and sorts by appointment time", () => {
    const items: AppointmentResponseCalendarItem[] = [
      {
        id: "late",
        appointmentId: "appointment-2",
        customerId: "customer-2",
        customerName: "Late Client",
        customerPhone: "+15145550002",
        serviceName: "Coupe",
        appointmentStartsAt: "2026-06-15T18:00:00.000Z",
        appointmentEndsAt: null,
        appointmentStatus: "scheduled",
        confirmationStatus: "not_requested",
        timezone: "America/Toronto",
        inboundBody: "YES",
        inboundReceivedAt: "2026-06-14T10:00:00.000Z",
        classification: "appointment_confirm"
      },
      {
        id: "fallback",
        appointmentId: "appointment-3",
        customerId: "customer-3",
        customerName: "Missing Date",
        customerPhone: "+15145550003",
        serviceName: null,
        appointmentStartsAt: null,
        appointmentEndsAt: null,
        appointmentStatus: null,
        confirmationStatus: null,
        timezone: null,
        inboundBody: "hello",
        inboundReceivedAt: "2026-06-14T12:00:00.000Z",
        classification: "unknown"
      },
      {
        id: "early",
        appointmentId: "appointment-1",
        customerId: "customer-1",
        customerName: "Early Client",
        customerPhone: "+15145550001",
        serviceName: "Couleur",
        appointmentStartsAt: "2026-06-15T14:00:00.000Z",
        appointmentEndsAt: null,
        appointmentStatus: "scheduled",
        confirmationStatus: "pending",
        timezone: "America/Toronto",
        inboundBody: "NON",
        inboundReceivedAt: "2026-06-14T09:00:00.000Z",
        classification: "appointment_cancel"
      }
    ];

    const groups = groupAppointmentResponseItems(items);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({
      dateKey: "2026-06-14",
      dateLabel: "Date du rendez-vous inconnue"
    });
    expect(groups[1].items.map((item) => item.id)).toEqual(["early", "late"]);
  });

  it("sorts opening replies by positive rank, other reply time, then no-reply clients", () => {
    const customers: OpeningResponseCustomer[] = [
      {
        offerId: "sent",
        customerId: "customer-4",
        customerName: "No Reply",
        customerPhone: "+15145550004",
        offerStatus: "sent",
        responseRank: null,
        responseText: null,
        respondedAt: null,
        lastInboundBody: null,
        lastInboundReceivedAt: null,
        replyClassification: "none"
      },
      {
        offerId: "unknown",
        customerId: "customer-3",
        customerName: "Question",
        customerPhone: "+15145550003",
        offerStatus: "sent",
        responseRank: null,
        responseText: null,
        respondedAt: null,
        lastInboundBody: "Combien?",
        lastInboundReceivedAt: "2026-06-14T10:00:00.000Z",
        replyClassification: "unknown"
      },
      {
        offerId: "rank-2",
        customerId: "customer-2",
        customerName: "Second",
        customerPhone: "+15145550002",
        offerStatus: "responded",
        responseRank: 2,
        responseText: "YES",
        respondedAt: "2026-06-14T09:00:00.000Z",
        lastInboundBody: "YES",
        lastInboundReceivedAt: "2026-06-14T09:00:00.000Z",
        replyClassification: "waitlist_positive"
      },
      {
        offerId: "rank-1",
        customerId: "customer-1",
        customerName: "First",
        customerPhone: "+15145550001",
        offerStatus: "responded",
        responseRank: 1,
        responseText: "OUI",
        respondedAt: "2026-06-14T08:00:00.000Z",
        lastInboundBody: "OUI",
        lastInboundReceivedAt: "2026-06-14T08:00:00.000Z",
        replyClassification: "waitlist_positive"
      }
    ];

    expect(sortOpeningResponseCustomers(customers).map((item) => item.offerId))
      .toEqual(["rank-1", "rank-2", "unknown", "sent"]);
  });
});
