import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseOrganizationBusinessInfoInput } from "@/lib/admin/organization-business-info";

const middlewareSource = readFileSync(join(process.cwd(), "middleware.ts"), "utf8");
const dashboardLayoutSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "layout.tsx"),
  "utf8"
);
const organizationSource = readFileSync(
  join(process.cwd(), "src", "lib", "organization", "current.ts"),
  "utf8"
);
const onboardingPageSource = readFileSync(
  join(process.cwd(), "src", "app", "onboarding", "page.tsx"),
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

  it("does not force authenticated dashboard users through onboarding", () => {
    expect(middlewareSource).not.toContain('redirectTo(request, "/onboarding")');
  });

  it("keeps a server-side dashboard layout guard as the second layer", () => {
    expect(dashboardLayoutSource).toContain("getActiveOrganizationWorkspace");
    expect(organizationSource).toContain('"/sign-in"');
    expect(organizationSource).toContain('in("status", workspaceMemberStatuses)');
  });

  it("redirects legacy onboarding URLs to the normal post-auth destination", () => {
    expect(onboardingPageSource).toContain("resolvePostAuthDestination");
    expect(onboardingPageSource).toContain("redirect(");
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

describe("admin organization business info validation", () => {
  it("returns French validation messages for required commerce fields", () => {
    expect(parseOrganizationBusinessInfoInput({ name: "", email: "bad" })).toEqual({
      ok: false,
      errors: expect.arrayContaining([
        "Veuillez entrer un nom de commerce.",
        "Veuillez entrer une adresse email valide."
      ])
    });
  });

  it("accepts a valid commerce profile payload", () => {
    expect(
      parseOrganizationBusinessInfoInput({
        name: "Salon Demo",
        slug: "salon-demo",
        email: "owner@example.com",
        phone: "514-555-0100",
        timezone: "America/Toronto",
        defaultLanguage: "fr",
        contactName: "Sophie Tremblay",
        businessType: "Salon",
        bookingSystem: "Fresha",
        cancellationVolume: "3 à 5 par semaine"
      })
    ).toMatchObject({
      ok: true,
      value: expect.objectContaining({
        name: "Salon Demo",
        slug: "salon-demo",
        contactName: "Sophie Tremblay",
        phone: "+15145550100"
      })
    });
  });
});
