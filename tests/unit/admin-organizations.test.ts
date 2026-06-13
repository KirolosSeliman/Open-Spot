import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  canPlatformAdminAccessOrganization,
  filterAccessibleOrganizationIds,
  getFilledSpotCountFromCurrentSchema,
  normalizeAdminTimeRange
} from "@/lib/admin/organizations";
import { estimateSmsCostCents } from "@/lib/admin/sms-cost";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260613200000_create_platform_admin_foundation.sql"
);

describe("admin organization foundation", () => {
  it("adds additive admin foundation tables with RLS", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("public.platform_admins");
    expect(sql).toContain("public.platform_admin_organization_access");
    expect(sql).toContain("public.platform_admin_audit_logs");
    expect(sql).toContain("alter table public.platform_admins enable row level security");
    expect(sql).toContain(
      "alter table public.platform_admin_organization_access enable row level security"
    );
    expect(sql).toContain(
      "alter table public.platform_admin_audit_logs enable row level security"
    );
    expect(sql).toContain("platform_admins_email_lower_unique");
    expect(sql).toContain("platform_admin_org_access_active_unique");
    expect(sql).not.toMatch(/\btruncate\b|\bdrop\s+table\b/i);
  });

  it("estimates SMS cost from outbound count or explicit segments", () => {
    expect(estimateSmsCostCents({ outboundSmsCount: 0 })).toBe(0);
    expect(estimateSmsCostCents({ outboundSmsCount: 10 })).toBe(8.3);
    expect(
      estimateSmsCostCents({ outboundSmsCount: 10, segmentsCount: 25 })
    ).toBe(20.75);
  });

  it("filters organization visibility by admin role and active assignments", () => {
    const accessRows = [
      {
        organizationId: "org-a",
        accessLevel: "read_only" as const,
        revokedAt: null
      },
      {
        organizationId: "org-b",
        accessLevel: "support" as const,
        revokedAt: "2026-06-01T00:00:00.000Z"
      }
    ];

    expect(
      filterAccessibleOrganizationIds({
        adminRole: "super_admin",
        allOrganizationIds: ["org-a", "org-b", "org-c"],
        accessRows
      })
    ).toEqual(["org-a", "org-b", "org-c"]);

    expect(
      filterAccessibleOrganizationIds({
        adminRole: "support_admin",
        allOrganizationIds: ["org-a", "org-b", "org-c"],
        accessRows
      })
    ).toEqual(["org-a"]);

    expect(
      canPlatformAdminAccessOrganization({
        adminRole: "analyst",
        organizationId: "org-b",
        accessRows
      })
    ).toBe(false);
  });

  it("counts filled spots only from validated schema states", () => {
    expect(
      getFilledSpotCountFromCurrentSchema({
        openings: [
          { organizationId: "org-a", status: "filled" },
          { organizationId: "org-a", status: "awaiting_validation" }
        ],
        openingOffers: [
          { organizationId: "org-a", status: "selected" },
          { organizationId: "org-a", status: "responded" }
        ]
      }).get("org-a")
    ).toBe(1);
  });

  it("normalizes supported admin reporting ranges", () => {
    expect(normalizeAdminTimeRange("7")).toBe("7");
    expect(normalizeAdminTimeRange("90")).toBe("90");
    expect(normalizeAdminTimeRange("bad")).toBe("30");
  });
});
