import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertDashboardOrganizationId,
  buildDashboardOverview,
  calculateRecoveredRevenueCents,
  calculateResponseRate,
  getAnalyticsPeriodWindow,
  normalizeAnalyticsPeriod
} from "@/lib/dashboard/real-data";
import { calculateAutomationOutcomeMetrics } from "@/lib/reports/metrics";

describe("real dashboard data", () => {
  it("requires an organization id before querying organization data", () => {
    expect(() => assertDashboardOrganizationId("")).toThrow(
      "Organization id is required for dashboard data."
    );
    expect(assertDashboardOrganizationId("org_123")).toBe("org_123");
  });

  it("builds zero-data dashboard state for a new organization", () => {
    expect(
      buildDashboardOverview({
        organizationName: "KiroClipz",
        customersCount: 0,
        waitlistEntriesCount: 0,
        servicesCount: 0,
        openingsCount: 0,
        pendingRepliesCount: 0,
        recoveredBookingsCount: 0,
        recoveredRevenueCents: 0,
        smsSentCount: 0,
        openingAlertsSentCount: 0,
        openingResponsesCount: 0,
        openingResponseRate: 0,
        automation: calculateAutomationOutcomeMetrics({
          now: new Date("2026-06-14T12:00:00.000Z"),
          appointments: [],
          appointmentEvents: [],
          recoveryOpenings: [],
          recoveryAlerts: [],
          recoveryReplies: [],
          recoveredBookings: []
        }),
        actionItems: {
          appointmentsNeedingFollowUp: 0,
          failedReminderSends: 0,
          cancellationsAwaitingAction: 0,
          waitlistRespondentsAwaitingValidation: 0
        }
      })
    ).toEqual({
      organizationName: "KiroClipz",
      customersCount: 0,
      waitlistEntriesCount: 0,
      servicesCount: 0,
      openingsCount: 0,
      pendingRepliesCount: 0,
      recoveredBookingsCount: 0,
      recoveredRevenueCents: 0,
      smsSentCount: 0,
      openingAlertsSentCount: 0,
      openingResponsesCount: 0,
      openingResponseRate: 0,
      automation: {
        appointmentsToday: 0,
        appointmentsTomorrow: 0,
        appointmentsNext7Days: 0,
        appointmentsConfirmed: 0,
        appointmentsPendingConfirmation: 0,
        appointmentsCancelledBySms: 0,
        appointmentsNoResponse: 0,
        appointmentsNoShow: 0,
        remindersScheduled: 0,
        remindersSent: 0,
        remindersFailed: 0,
        remindersSkipped: 0,
        recoveryOpeningsCreated: 0,
        recoveryAlertsSent: 0,
        recoveryRepliesReceived: 0,
        recoveredAfterCancellationCount: 0,
        recoveredAfterCancellationRevenueCents: 0
      },
      actionItems: {
        appointmentsNeedingFollowUp: 0,
        failedReminderSends: 0,
        cancellationsAwaitingAction: 0,
        waitlistRespondentsAwaitingValidation: 0
      },
      setup: {
        hasServices: false,
        hasCustomers: false,
        hasWaitlistEntries: false,
        hasOpenings: false
      }
    });
  });

  it("calculates recovered revenue from confirmed booking rows only", () => {
    expect(
      calculateRecoveredRevenueCents([
        { recovered_value_cents: 5500 },
        { recovered_value_cents: null },
        { recovered_value_cents: 12000 }
      ])
    ).toBe(17500);
  });

  it("normalizes analytics periods and calculates response rates safely", () => {
    expect(normalizeAnalyticsPeriod("current_year")).toBe("current_year");
    expect(normalizeAnalyticsPeriod("last_30_days")).toBe("last_30_days");
    expect(normalizeAnalyticsPeriod("unknown")).toBe("current_month");
    expect(
      getAnalyticsPeriodWindow(
        "current_month",
        new Date("2026-06-14T12:00:00.000Z")
      )
    ).toMatchObject({
      period: "current_month",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-06-14T12:00:00.000Z"
    });
    expect(calculateResponseRate({ responses: 3, sent: 12 })).toBe(25);
    expect(calculateResponseRate({ responses: 3, sent: 0 })).toBe(0);
  });

  it("keeps dashboard queries scoped to organization_id", () => {
    const source = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "real-data.ts"),
      "utf8"
    );

    expect(source).toContain(".eq(\"organization_id\", organizationId)");
    expect(source).toContain("select(\"id\", { count: \"exact\", head: true })");
    expect(source).toContain('.from("appointments")');
    expect(source).toContain('.from("appointment_events")');
    expect(source).toContain('.eq("source", "appointment_cancellation")');
    expect(source).toContain('message_type", "opening_alert"');
    expect(source).toContain('responded_at", periodWindow.start');
    expect(source).toContain("calculateResponseRate");
    expect(source).toContain("calculateAutomationOutcomeMetrics");
    expect(source).not.toContain("createSupabaseServiceClient");
  });
});
