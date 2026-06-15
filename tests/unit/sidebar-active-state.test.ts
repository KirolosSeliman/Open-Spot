import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { dictionaries } from "@/lib/i18n/dictionaries";

const shellSource = readFileSync(
  join(process.cwd(), "src", "components", "dashboard", "dashboard-shell.tsx"),
  "utf8"
);

describe("dashboard sidebar active state", () => {
  it("derives active navigation from the current pathname", () => {
    expect(shellSource).toContain("usePathname");
    expect(shellSource).toContain("isActiveDashboardRoute(pathname, item.href)");
    expect(shellSource).toContain('aria-current=');
    expect(shellSource).not.toContain('item.core &&');
  });

  it("contains route entries for all merchant dashboard sections", () => {
    for (const href of [
      "/dashboard",
      "/dashboard/new-cancellation",
      "/dashboard/responses",
      "/dashboard/appointments",
      "/dashboard/cancellations",
      "/dashboard/clients",
      "/dashboard/waitlist",
      "/dashboard/qr-code",
      "/dashboard/messages",
      "/dashboard/services",
      "/dashboard/analytics",
      "/dashboard/team",
      "/dashboard/billing",
      "/dashboard/settings"
    ]) {
      expect(shellSource).toContain(`href: "${href}"`);
    }
  });

  it("does not render duplicate appointments entries in the desktop sidebar", () => {
    const desktopNavSource = shellSource.slice(
      shellSource.indexOf("function getDesktopNav"),
      shellSource.indexOf("function getMobileNav")
    );
    const mobileNavSource = shellSource.slice(
      shellSource.indexOf("function getMobileNav"),
      shellSource.indexOf("function isActiveDashboardRoute")
    );

    expect(
      desktopNavSource.match(/href: "\/dashboard\/appointments"/g) ?? []
    ).toHaveLength(1);
    expect(dictionaries.fr.dashboard.appointments).toBe("Rendez-vous");
    expect(dictionaries.fr.dashboard.appointmentsShort).toBe("RDV");
    expect(desktopNavSource).toContain("t.dashboard.appointments");
    expect(desktopNavSource).not.toContain("t.dashboard.appointmentsShort");
    expect(mobileNavSource).toContain("t.dashboard.appointmentsShort");
  });
});
