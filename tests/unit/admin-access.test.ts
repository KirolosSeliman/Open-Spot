import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  getConfiguredPlatformAdminEmails,
  getPostSignInRedirectPath,
  getSafeInternalRedirectPath,
  isPlatformAdminEmail
} from "@/lib/auth/platform-admin";

describe("platform admin email access", () => {
  it("parses PLATFORM_ADMIN_EMAILS conservatively", () => {
    expect(getConfiguredPlatformAdminEmails({})).toEqual([]);
    expect(getConfiguredPlatformAdminEmails({ PLATFORM_ADMIN_EMAILS: "" })).toEqual(
      []
    );
    expect(
      getConfiguredPlatformAdminEmails({
        PLATFORM_ADMIN_EMAILS: " Admin@Example.com "
      })
    ).toEqual(["admin@example.com"]);
    expect(
      getConfiguredPlatformAdminEmails({
        PLATFORM_ADMIN_EMAILS: "admin@example.com, owner@example.com,, SUPPORT@EXAMPLE.COM "
      })
    ).toEqual(["admin@example.com", "owner@example.com", "support@example.com"]);
  });

  it("matches admin emails case-insensitively", () => {
    const env = {
      PLATFORM_ADMIN_EMAILS: "admin@example.com,owner@example.com"
    };

    expect(isPlatformAdminEmail("admin@example.com", env)).toBe(true);
    expect(isPlatformAdminEmail(" Admin@Example.com ", env)).toBe(true);
    expect(isPlatformAdminEmail("merchant@example.com", env)).toBe(false);
    expect(isPlatformAdminEmail(null, env)).toBe(false);
    expect(isPlatformAdminEmail("admin@example.com", {})).toBe(false);
  });

  it("allows only safe internal redirect paths", () => {
    expect(getSafeInternalRedirectPath("/dashboard")).toBe("/dashboard");
    expect(getSafeInternalRedirectPath("/admin")).toBe("/admin");
    expect(getSafeInternalRedirectPath("/dashboard/clients")).toBe(
      "/dashboard/clients"
    );
    expect(getSafeInternalRedirectPath("https://evil.com")).toBeNull();
    expect(getSafeInternalRedirectPath("http://evil.com")).toBeNull();
    expect(getSafeInternalRedirectPath("//evil.com")).toBeNull();
    expect(getSafeInternalRedirectPath("javascript:alert(1)")).toBeNull();
    expect(getSafeInternalRedirectPath("")).toBeNull();
  });

  it("chooses safe post sign-in redirects", () => {
    const env = {
      PLATFORM_ADMIN_EMAILS: "admin@example.com"
    };

    expect(
      getPostSignInRedirectPath({
        email: "admin@example.com",
        requestedRedirect: "/dashboard/clients",
        env
      })
    ).toBe("/admin");
    expect(getPostSignInRedirectPath({ email: "merchant@example.com", env })).toBe(
      "/dashboard"
    );
    expect(
      getPostSignInRedirectPath({
        email: "merchant@example.com",
        requestedRedirect: "/dashboard/clients",
        env
      })
    ).toBe("/dashboard/clients");
    expect(
      getPostSignInRedirectPath({
        email: "merchant@example.com",
        requestedRedirect: "/admin",
        env
      })
    ).toBe("/dashboard");
    expect(
      getPostSignInRedirectPath({
        email: "merchant@example.com",
        requestedRedirect: "/admin?from=login",
        env
      })
    ).toBe("/dashboard");
    expect(
      getPostSignInRedirectPath({
        email: "merchant@example.com",
        requestedRedirect: "/admin/sms",
        env
      })
    ).toBe("/dashboard");
    expect(
      getPostSignInRedirectPath({
        email: "merchant@example.com",
        requestedRedirect: "https://evil.com",
        env
      })
    ).toBe("/dashboard");
  });

  it("keeps admin email configuration server-side", () => {
    const dashboardShell = readFileSync(
      join(process.cwd(), "src", "components", "dashboard", "dashboard-shell.tsx"),
      "utf8"
    );
    const signInPage = readFileSync(
      join(process.cwd(), "src", "app", "sign-in", "page.tsx"),
      "utf8"
    );

    expect(dashboardShell).not.toContain("PLATFORM_ADMIN_EMAILS");
    expect(signInPage).not.toContain("PLATFORM_ADMIN_EMAILS");
  });
});
