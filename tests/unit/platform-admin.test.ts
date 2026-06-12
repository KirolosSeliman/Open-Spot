import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  filterPlatformBusinesses,
  formatAdminCurrency,
  getBusinessHealth,
  normalizePlatformBusinessFilters
} from "@/lib/platform-admin/helpers";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260612190000_platform_admins.sql"
);

describe("platform admin helpers and security", () => {
  it("normalizes business filters for shareable URLs", () => {
    expect(normalizePlatformBusinessFilters({})).toEqual({
      q: "",
      health: "all",
      activity: "all",
      sort: "created_desc"
    });

    expect(
      normalizePlatformBusinessFilters({
        q: "  Salon TEST  ",
        health: "problem",
        activity: "inactive",
        sort: "activity_desc"
      })
    ).toEqual({
      q: "Salon TEST",
      health: "problem",
      activity: "inactive",
      sort: "activity_desc"
    });
  });

  it("filters businesses by fuzzy text, health, activity, and sort", () => {
    const rows = [
      {
        id: "org-new",
        name: "Salon Test 1",
        slug: "salon-test",
        ownerEmail: "owner@example.com",
        createdAt: "2026-06-10T00:00:00.000Z",
        lastActivityAt: "2026-06-11T00:00:00.000Z",
        health: "ok" as const,
        activityStatus: "active" as const
      },
      {
        id: "org-old",
        name: "Clinique Exemple",
        slug: "clinique",
        ownerEmail: "kirolos@example.com",
        createdAt: "2026-05-01T00:00:00.000Z",
        lastActivityAt: null,
        health: "problem" as const,
        activityStatus: "inactive" as const
      }
    ];

    expect(
      filterPlatformBusinesses(rows, {
        q: "test1",
        health: "all",
        activity: "all",
        sort: "created_desc"
      }).map((row) => row.id)
    ).toEqual(["org-new"]);

    expect(
      filterPlatformBusinesses(rows, {
        q: "kiro",
        health: "problem",
        activity: "inactive",
        sort: "activity_desc"
      }).map((row) => row.id)
    ).toEqual(["org-old"]);
  });

  it("classifies health conservatively", () => {
    expect(
      getBusinessHealth({
        failedSmsThisMonth: 0,
        undeliveredSmsThisMonth: 0,
        outboundSmsThisMonth: 20,
        openingsAwaitingValidation: 1,
        daysSinceLastActivity: 2
      })
    ).toBe("ok");

    expect(
      getBusinessHealth({
        failedSmsThisMonth: 5,
        undeliveredSmsThisMonth: 1,
        outboundSmsThisMonth: 20,
        openingsAwaitingValidation: 0,
        daysSinceLastActivity: 45
      })
    ).toBe("problem");
  });

  it("formats estimated money without implying official invoices", () => {
    expect(formatAdminCurrency(12345)).toContain("123,45");
    expect(formatAdminCurrency(null)).toBe("Non disponible");
  });

  it("adds a secure platform_admins migration", () => {
    expect(existsSync(migrationPath)).toBe(true);

    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("create table if not exists public.platform_admins");
    expect(sql).toContain("role text not null check");
    expect(sql).toContain("alter table public.platform_admins enable row level security");
    expect(sql).toContain("auth.uid() = user_id");
    expect(sql).toContain("platform_admins_active_idx");
    expect(sql).toContain("YOUR_SUPABASE_AUTH_USER_ID");
    expect(sql).not.toMatch(/^\s*insert into public\.platform_admins\b/im);
    expect(sql).not.toMatch(/\bdelete\s+from\b|\btruncate\b|\bdrop\s+table\b/i);
  });

  it("keeps platform admin access server-only and guarded in the layout", () => {
    const authSource = readFileSync(
      join(process.cwd(), "src", "lib", "platform-admin", "auth.ts"),
      "utf8"
    );
    const dataSource = readFileSync(
      join(process.cwd(), "src", "lib", "platform-admin", "data.ts"),
      "utf8"
    );
    const layoutSource = readFileSync(
      join(process.cwd(), "src", "app", "platform-admin", "layout.tsx"),
      "utf8"
    );
    const dashboardShellSource = readFileSync(
      join(process.cwd(), "src", "components", "dashboard", "dashboard-shell.tsx"),
      "utf8"
    );

    expect(authSource).toContain('import "server-only"');
    expect(dataSource).toContain('import "server-only"');
    expect(authSource).toContain("createSupabaseServerClient");
    expect(authSource).toContain("createSupabaseServiceClient");
    expect(authSource).toContain('redirect("/sign-in")');
    expect(authSource).toContain("notFound()");
    expect(layoutSource).toContain("requirePlatformAdmin");
    expect(layoutSource).toContain("index: false");
    expect(layoutSource).toContain("follow: false");
    expect(dashboardShellSource).not.toContain("/platform-admin");
  });
});
