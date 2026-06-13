import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseAdminDateRange } from "@/lib/admin/date-range";
import {
  calculateCostPerFilledSpotCents,
  maskPhoneNumber
} from "@/lib/admin/metrics";
import {
  canOpenPlatformAdminManagerMode,
  isPlatformAdminManagerSessionActive
} from "@/lib/admin/manager-mode";

const managerModeMigrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260613210000_platform_admin_manager_mode.sql"
);

describe("admin phase 3 and 4 helpers", () => {
  const now = new Date("2026-06-13T12:00:00.000Z");

  it("parses supported admin date ranges and defaults safely", () => {
    expect(parseAdminDateRange({}, now).rangeKey).toBe("30d");
    expect(parseAdminDateRange({ range: "7d" }, now).rangeKey).toBe("7d");
    expect(parseAdminDateRange({ range: "90d" }, now).rangeKey).toBe("90d");

    const custom = parseAdminDateRange(
      { range: "custom", from: "2026-06-01", to: "2026-06-10" },
      now
    );
    expect(custom.rangeKey).toBe("custom");
    expect(custom.fromIso).toBe("2026-06-01T00:00:00.000Z");
    expect(custom.toIso).toBe("2026-06-10T23:59:59.999Z");

    expect(
      parseAdminDateRange(
        { range: "custom", from: "2026-06-10", to: "2026-06-01" },
        now
      ).rangeKey
    ).toBe("30d");
    expect(
      parseAdminDateRange(
        { range: "custom", from: "2025-01-01", to: "2026-06-10" },
        now
      ).rangeKey
    ).toBe("30d");
    expect(parseAdminDateRange({ range: "bad" }, now).rangeKey).toBe("30d");
  });

  it("calculates safe operational metrics", () => {
    expect(
      calculateCostPerFilledSpotCents({
        estimatedSmsCostCents: 25,
        filledSpots: 0
      })
    ).toBeNull();
    expect(
      calculateCostPerFilledSpotCents({
        estimatedSmsCostCents: 25,
        filledSpots: 2
      })
    ).toBe(12.5);
    expect(maskPhoneNumber("+15142494425")).toBe("+1••••••4425");
    expect(maskPhoneNumber(null)).toBe("Unknown");
  });

  it("keeps manager mode access restricted and expiring", () => {
    expect(
      canOpenPlatformAdminManagerMode({
        adminRole: "super_admin",
        accessLevel: null
      })
    ).toBe(true);
    expect(
      canOpenPlatformAdminManagerMode({
        adminRole: "support_admin",
        accessLevel: "manager_mode"
      })
    ).toBe(true);
    expect(
      canOpenPlatformAdminManagerMode({
        adminRole: "support_admin",
        accessLevel: "support"
      })
    ).toBe(false);
    expect(
      canOpenPlatformAdminManagerMode({
        adminRole: "analyst",
        accessLevel: "manager_mode",
        revokedAt: "2026-06-01T00:00:00.000Z"
      })
    ).toBe(false);
    expect(
      canOpenPlatformAdminManagerMode({
        adminRole: "super_admin",
        adminStatus: "suspended"
      })
    ).toBe(false);

    expect(
      isPlatformAdminManagerSessionActive({
        status: "active",
        endedAt: null,
        expiresAt: "2026-06-13T13:00:00.000Z",
        now
      })
    ).toBe(true);
    expect(
      isPlatformAdminManagerSessionActive({
        status: "active",
        endedAt: null,
        expiresAt: "2026-06-13T11:00:00.000Z",
        now
      })
    ).toBe(false);
  });

  it("adds manager sessions without permanent organization membership", () => {
    expect(existsSync(managerModeMigrationPath)).toBe(true);

    const sql = readFileSync(managerModeMigrationPath, "utf8");

    expect(sql).toContain("create table if not exists public.platform_admin_sessions");
    expect(sql).toContain(
      "alter table public.platform_admin_sessions enable row level security"
    );
    expect(sql).toContain(
      "private.can_access_organization_via_platform_admin_manager_mode"
    );
    expect(sql).toContain("s.acting_role = 'manager'");
    expect(sql).not.toMatch(/insert\s+into\s+public\.organization_members/i);
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b/i);
  });
});
