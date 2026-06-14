import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getScheduledMessageSkipReason,
  isAuthorizedCronRequest
} from "@/lib/sms/scheduled-messages";

describe("scheduled message processing safety", () => {
  it("requires a configured cron secret for cron requests", () => {
    expect(isAuthorizedCronRequest(null, undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer test", undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer wrong", "secret")).toBe(false);
    expect(isAuthorizedCronRequest("Bearer secret", "secret")).toBe(true);
  });

  it("skips messages without current opted-in consent", () => {
    expect(
      getScheduledMessageSkipReason({
        phoneE164: "+15142494425",
        consentStatus: "needs_consent",
        appointmentStatus: "scheduled"
      })
    ).toBe("Customer is not currently opted in.");
  });

  it("skips scheduled SMS for deleted customers", () => {
    expect(
      getScheduledMessageSkipReason({
        phoneE164: "+15142494425",
        consentStatus: "opted_in",
        deletedAt: "2026-06-13T10:00:00.000Z",
        appointmentStatus: "scheduled"
      })
    ).toBe("Customer is deleted and cannot receive scheduled SMS.");
  });

  it("skips invalid phones and cancelled appointments", () => {
    expect(
      getScheduledMessageSkipReason({
        phoneE164: "5142494425",
        consentStatus: "opted_in",
        appointmentStatus: "scheduled"
      })
    ).toBe("Customer phone is not valid E.164.");
    expect(
      getScheduledMessageSkipReason({
        phoneE164: "+15142494425",
        consentStatus: "opted_in",
        appointmentStatus: "cancelled"
      })
    ).toBe("Appointment is not eligible for reminder delivery.");
  });

  it("allows opted-in scheduled and confirmed appointments", () => {
    expect(
      getScheduledMessageSkipReason({
        phoneE164: "+15142494425",
        consentStatus: "opted_in",
        appointmentStatus: "scheduled"
      })
    ).toBeNull();
    expect(
      getScheduledMessageSkipReason({
        phoneE164: "+15142494425",
        consentStatus: "opted_in",
        appointmentStatus: "confirmed"
      })
    ).toBeNull();
  });

  it("keeps the cron route server-only and protected", () => {
    const routeSource = readFileSync(
      join(
        process.cwd(),
        "src",
        "app",
        "api",
        "cron",
        "send-scheduled-messages",
        "route.ts"
      ),
      "utf8"
    );

    expect(routeSource).toContain("createSupabaseServiceClient");
    expect(routeSource).toContain("processDueScheduledMessages");
    expect(routeSource).toContain("isAuthorizedCronRequest");
    expect(routeSource).toContain("CRON_SECRET");
    expect(routeSource).not.toContain("NEXT_PUBLIC_CRON_SECRET");
  });

  it("routes appointment reminder queue writes through guarded RPCs", () => {
    const actionsSource = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "actions.ts"),
      "utf8"
    );
    const migrationSource = readFileSync(
      join(
        process.cwd(),
        "supabase",
        "migrations",
        "20260614000500_harden_appointment_status_and_scheduled_messages.sql"
      ),
      "utf8"
    );

    expect(actionsSource).toContain(".rpc(\"schedule_appointment_reminder\"");
    expect(actionsSource).toContain(
      ".rpc(\"cancel_pending_appointment_reminders\""
    );
    expect(actionsSource).not.toMatch(
      /\.from\("scheduled_messages"\)\s*[\r\n.]+insert/
    );
    expect(migrationSource).toContain(
      "revoke insert, update on public.scheduled_messages from authenticated"
    );
    expect(migrationSource).toContain(
      "drop policy if exists \"staff can create scheduled messages\""
    );
    expect(migrationSource).toContain(
      "drop policy if exists \"staff can update scheduled messages\""
    );
    expect(migrationSource).toContain(
      "create or replace function private.schedule_appointment_reminder"
    );
    expect(migrationSource).toContain(
      "create or replace function private.cancel_pending_appointment_reminders"
    );
    expect(migrationSource).toContain("security definer");
    expect(migrationSource).toContain("set search_path = ''");
    expect(migrationSource).toContain("private.has_org_role");
    expect(migrationSource).toContain("c.deleted_at is null");
    expect(migrationSource).toContain(
      "grant execute on function public.schedule_appointment_reminder"
    );
    expect(migrationSource).toContain(
      "grant execute on function public.cancel_pending_appointment_reminders"
    );
  });
});
