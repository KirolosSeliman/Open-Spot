import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const middlewareSource = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
const dashboardLayoutSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "layout.tsx"),
  "utf8"
);
const organizationSource = readFileSync(
  join(process.cwd(), "src", "lib", "organization", "current.ts"),
  "utf8"
);

describe("private route security", () => {
  it("protects private dashboard and merchant route prefixes in middleware", () => {
    for (const route of [
      "/dashboard/:path*",
      "/clients/:path*",
      "/waitlist/:path*",
      "/services/:path*",
      "/messages/:path*",
      "/settings/:path*",
      "/team/:path*",
      "/subscription/:path*",
      "/responses/:path*",
      "/cancellations/:path*",
      "/new-cancellation/:path*"
    ]) {
      expect(middlewareSource).toContain(route);
    }

    expect(middlewareSource).toContain('redirectTo(request, "/sign-in")');
  });

  it("redirects signed-in dashboard users without active organization to onboarding", () => {
    expect(middlewareSource).toContain('.from("organization_members")');
    expect(middlewareSource).toContain('.eq("status", "active")');
    expect(middlewareSource).toContain('redirectTo(request, "/onboarding")');
  });

  it("keeps a server-side dashboard layout guard as the second layer", () => {
    expect(dashboardLayoutSource).toContain("getActiveOrganizationWorkspace");
    expect(organizationSource).toContain('redirect("/sign-in")');
    expect(organizationSource).toContain('redirect(organizationRedirect)');
    expect(organizationSource).toContain('.eq("status", "active")');
  });

  it("does not expose service-role secrets in middleware or browser clients", () => {
    const browserClientSource = readFileSync(
      join(process.cwd(), "src", "lib", "supabase", "client.ts"),
      "utf8"
    );

    expect(middlewareSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(browserClientSource).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
