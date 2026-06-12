import { describe, expect, it } from "vitest";

import {
  buildOpeningResponsesResetHref,
  compactSearchText,
  filterOpeningResponseGroups,
  groupAppointmentResponseItems,
  normalizeOpeningResponsesFilters,
  normalizeSearchText,
  searchableTextMatches,
  sortOpeningResponseCustomers,
  type AppointmentResponseCalendarItem,
  type OpeningResponseGroup,
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

  it("normalizes opening response URL filters to safe defaults", () => {
    expect(normalizeOpeningResponsesFilters({})).toEqual({
      range: "all",
      serviceId: "all",
      q: ""
    });
    expect(
      normalizeOpeningResponsesFilters({
        range: "two_weeks",
        serviceId: "none",
        q: "  Kirolos  "
      })
    ).toEqual({
      range: "two_weeks",
      serviceId: "none",
      q: "Kirolos"
    });
    expect(
      normalizeOpeningResponsesFilters({
        range: "forever",
        serviceId: "",
        q: "x".repeat(120)
      })
    ).toEqual({
      range: "all",
      serviceId: "all",
      q: "x".repeat(80)
    });
    expect(buildOpeningResponsesResetHref()).toBe(
      "/dashboard/responses?tab=openings"
    );
  });

  it("normalizes and matches forgiving professional search queries", () => {
    const match = searchableTextMatches;

    expect(normalizeSearchText(" TéST-1!! ")).toBe("test 1");
    expect(compactSearchText("+1 514-249-4425")).toBe("+15142494425");
    expect(match(["test1"], "test")).toBe(true);
    expect(match(["test 1"], "test1")).toBe(true);
    expect(match(["test-1"], "test1")).toBe(true);
    expect(match(["tést"], "test")).toBe(true);
    expect(match(["Kirolos Seliman"], "kiro")).toBe(true);
    expect(match(["+15142494425"], "514")).toBe(true);
    expect(match(["514 249 4425"], "514249")).toBe(true);
    expect(match(["10% off"], "10 off")).toBe(true);
    expect(match(["10% today only"], "10 off")).toBe(true);
    expect(match(["OUI dispo"], "oui")).toBe(true);
    expect(match(["Réponse positive"], "reponse positive")).toBe(true);
    expect(match(["Service non précisé"], "service non precise")).toBe(true);
    expect(match(["Barbe et coupe"], "coupe barbe")).toBe(true);
    expect(match(["Completement different"], "test")).toBe(false);
  });

  it("filters opening response groups by range, service, and searchable text", () => {
    const groups: OpeningResponseGroup[] = [
      {
        openingId: "opening-hair",
        openingTitle: "Annulation coupe",
        serviceId: "service-hair",
        serviceName: "Coupe",
        startTime: "2026-06-16T14:00:00.000Z",
        endTime: "2026-06-16T15:00:00.000Z",
        offerLabel: "Rabais midi",
        openingStatus: "awaiting_validation",
        sentCount: 1,
        responseCount: 1,
        positiveCount: 1,
        noReplyCount: 0,
        customers: [
          {
            offerId: "offer-1",
            customerId: "customer-1",
            customerName: "Kirolos Client",
            customerPhone: "+15145550001",
            offerStatus: "responded",
            responseRank: 1,
            responseText: "Oui disponible",
            respondedAt: "2026-06-12T10:00:00.000Z",
            lastInboundBody: "Oui disponible",
            lastInboundReceivedAt: "2026-06-12T10:00:00.000Z",
            replyClassification: "waitlist_positive"
          }
        ]
      },
      {
        openingId: "opening-none",
        openingTitle: "Annulation sans service",
        serviceId: null,
        serviceName: null,
        startTime: "2026-07-20T14:00:00.000Z",
        endTime: "2026-07-20T15:00:00.000Z",
        offerLabel: null,
        openingStatus: "broadcasting",
        sentCount: 1,
        responseCount: 0,
        positiveCount: 0,
        noReplyCount: 1,
        customers: [
          {
            offerId: "offer-2",
            customerId: "customer-2",
            customerName: "Autre Client",
            customerPhone: "+15145550002",
            offerStatus: "sent",
            responseRank: null,
            responseText: null,
            respondedAt: null,
            lastInboundBody: null,
            lastInboundReceivedAt: null,
            replyClassification: "none"
          }
        ]
      }
    ];

    expect(
      filterOpeningResponseGroups(groups, {
        range: "this_week",
        serviceId: "all",
        q: ""
      }, new Date("2026-06-12T12:00:00.000Z")).map((group) => group.openingId)
    ).toEqual(["opening-hair"]);
    expect(
      filterOpeningResponseGroups(groups, {
        range: "all",
        serviceId: "none",
        q: ""
      }).map((group) => group.openingId)
    ).toEqual(["opening-none"]);
    expect(
      filterOpeningResponseGroups(groups, {
        range: "all",
        serviceId: "all",
        q: "kirolos"
      }).map((group) => group.openingId)
    ).toEqual(["opening-hair"]);
  });
});
