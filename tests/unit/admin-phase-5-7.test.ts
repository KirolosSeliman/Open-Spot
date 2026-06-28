import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canPerformPlatformAdminAction } from "@/lib/admin/action-permissions";
import { calculateFailureRate, isHighFailureRate } from "@/lib/admin/compliance";
import { maskPhoneNumber } from "@/lib/admin/metrics";
import { adminSearchMatches } from "@/lib/admin/search";
import {
  getInboundReplyClassificationLabel,
  hasMissingStatusCallback,
  isDeliveredSmsStatus,
  isFailedSmsStatus,
  isTerminalSmsStatus
} from "@/lib/sms/status-helpers";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260613220000_admin_diagnostics_compliance_controls.sql"
);

describe("admin phase 5 to 7 helpers", () => {
  it("masks phone numbers without exposing full values", () => {
    expect(maskPhoneNumber("+14387958290")).toBe("+1••••••8290");
    expect(maskPhoneNumber("")).toBe("—");
    expect(maskPhoneNumber("123")).toBe("••••");
  });

  it("matches admin search robustly", () => {
    expect(adminSearchMatches(["test1"], "test")).toBe(true);
    expect(adminSearchMatches(["test 1"], "test1")).toBe(true);
    expect(adminSearchMatches(["tést"], "test")).toBe(true);
    expect(adminSearchMatches(["Kirolos Seliman"], "kiro")).toBe(true);
    expect(adminSearchMatches(["+15142494425"], "514")).toBe(true);
    expect(adminSearchMatches(["10% off"], "10 off")).toBe(true);
  });

  it("classifies SMS statuses for diagnostics", () => {
    expect(isFailedSmsStatus("failed")).toBe(true);
    expect(isFailedSmsStatus("undelivered")).toBe(true);
    expect(isDeliveredSmsStatus("delivered")).toBe(true);
    expect(isTerminalSmsStatus("received")).toBe(true);
    expect(
      hasMissingStatusCallback({
        provider: "twilio",
        direction: "outbound",
        status: "sent",
        statusCallbackReceivedAt: null,
        createdAt: "2026-06-13T11:00:00.000Z",
        now: new Date("2026-06-13T11:11:00.000Z")
      })
    ).toBe(true);
  });

  it("labels inbound reply classifications", () => {
    expect(getInboundReplyClassificationLabel("opt_out")).toBe("Opt-out");
    expect(getInboundReplyClassificationLabel("appointment_confirm")).toBe(
      "Appointment confirmed"
    );
    expect(getInboundReplyClassificationLabel("appointment_cancel")).toBe(
      "Appointment cancelled"
    );
    expect(getInboundReplyClassificationLabel("waitlist_positive")).toBe(
      "Waitlist positive"
    );
    expect(getInboundReplyClassificationLabel("unknown")).toBe("Unknown");
  });

  it("keeps compliance metric helpers safe", () => {
    expect(calculateFailureRate({ failed: 0, outbound: 0 })).toBe(0);
    expect(calculateFailureRate({ failed: 2, outbound: 10 })).toBe(0.2);
    expect(isHighFailureRate({ failed: 1, outbound: 4 })).toBe(false);
    expect(isHighFailureRate({ failed: 2, outbound: 10 })).toBe(true);
  });

  it("keeps admin action permissions strict", () => {
    expect(
      canPerformPlatformAdminAction({
        adminRole: "super_admin",
        accessLevel: "super_admin",
        action: "organization.disable"
      })
    ).toBe(true);
    expect(
      canPerformPlatformAdminAction({
        adminRole: "analyst",
        accessLevel: "manager_mode",
        action: "organization.update_admin_note"
      })
    ).toBe(false);
    expect(
      canPerformPlatformAdminAction({
        adminRole: "support_admin",
        accessLevel: "support",
        action: "compliance.mark_reviewed"
      })
    ).toBe(true);
    expect(
      canPerformPlatformAdminAction({
        adminRole: "support_admin",
        accessLevel: "support",
        action: "organization.pause_sms"
      })
    ).toBe(false);
    expect(
      canPerformPlatformAdminAction({
        adminRole: "account_admin",
        accessLevel: "support",
        action: "organization.run_health_check"
      })
    ).toBe(true);
  });

  it("surfaces failed scheduled reminders in the admin overview", () => {
    const adminPage = readFileSync(
      join(process.cwd(), "src", "app", "admin", "page.tsx"),
      "utf8"
    );
    const overviewData = readFileSync(
      join(process.cwd(), "src", "lib", "admin", "overview-data.ts"),
      "utf8"
    );

    expect(overviewData).toContain('.from("scheduled_messages")');
    expect(overviewData).toContain('.eq("status", "failed")');
    expect(overviewData).toContain("failedRemindersCurrent");
    expect(overviewData).toContain("Rappels échoués");
    expect(adminPage).toContain("loadAdminOverviewData");
  });

  it("adds diagnostics, compliance, and controls tables safely", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists public.platform_sms_webhook_events");
    expect(sql).toContain("create table if not exists public.platform_compliance_reviews");
    expect(sql).toContain(
      "create table if not exists public.platform_organization_admin_controls"
    );
    expect(sql).toContain(
      "alter table public.platform_sms_webhook_events enable row level security"
    );
    expect(sql).toContain(
      "alter table public.platform_compliance_reviews enable row level security"
    );
    expect(sql).toContain(
      "alter table public.platform_organization_admin_controls enable row level security"
    );
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b/i);
  });
});
