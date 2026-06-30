import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { dashboardCopy } from "@/lib/i18n/dashboard-copy";

function getFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);

    if (entry.isDirectory()) {
      return getFiles(path);
    }

    return [path];
  });
}

describe("real dashboard and demo dashboard separation", () => {
  const appDashboardRoot = join(process.cwd(), "src", "app", "dashboard");
  const previewPagePath = join(
    process.cwd(),
    "src",
    "app",
    "dashboard-preview",
    "page.tsx"
  );

  it("keeps mock dashboard data out of authenticated dashboard routes", () => {
    for (const filePath of getFiles(appDashboardRoot)) {
      if (!/\.(ts|tsx)$/.test(filePath)) {
        continue;
      }

      const source = readFileSync(filePath, "utf8");

      expect(source, filePath).not.toContain("@/lib/dashboard/mock-data");
    }
  });

  it("redirects the old dashboard preview route to the real dashboard", () => {
    const previewPage = readFileSync(previewPagePath, "utf8");

    expect(previewPage).toContain('redirect("/dashboard")');
    expect(previewPage).not.toContain("@/lib/dashboard/mock-data");
    expect(previewPage).not.toContain("Demo data");
    expect(previewPage).not.toContain("Preview only");
  });

  it("shows zero-data setup copy on the real dashboard", () => {
    const dashboardPage = readFileSync(
      join(appDashboardRoot, "page.tsx"),
      "utf8"
    );

    expect(dashboardPage).toContain("getRequestLocale");
    expect(dashboardPage).toContain("getDashboardCopy");
    expect(dashboardPage).toContain("loadDashboardHomeData");
    expect(dashboardCopy.fr.dashboard.description("Open Spot")).toContain(
      "Votre espace est prêt."
    );
    expect(dashboardCopy.fr.dashboard.setup.description).toBe(
      "Commencez par ajouter vos services et vos clients."
    );
    expect(dashboardCopy.fr.dashboard.setup.title).toBe("Configuration initiale");
  });

  it("loads separated response dashboards from organization-scoped data", () => {
    const responsesPage = readFileSync(
      join(appDashboardRoot, "responses", "page.tsx"),
      "utf8"
    );
    const operationsData = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "operations-data.ts"),
      "utf8"
    );
    const responseQueries = readFileSync(
      join(process.cwd(), "src", "lib", "responses", "queries.ts"),
      "utf8"
    );
    const responsesFilters = readFileSync(
      join(process.cwd(), "src", "components", "responses", "ResponsesFilters.tsx"),
      "utf8"
    );
    const slotAlertCard = readFileSync(
      join(process.cwd(), "src", "components", "responses", "SlotAlertCard.tsx"),
      "utf8"
    );

    expect(responsesPage).toContain("loadAppointmentCalendarItems");
    expect(responsesPage).toContain("loadOpeningResponseGroups");
    expect(responsesPage).toContain("normalizeExtendedOpeningFilters");
    expect(responsesPage).toContain("filterOpeningGroupsExtended");
    expect(responsesFilters).toContain('name="range"');
    expect(responsesFilters).toContain('name="serviceId"');
    expect(responsesFilters).toContain('name="q"');
    expect(responsesPage).toContain("appointments");
    expect(responsesPage).toContain("openings");
    expect(slotAlertCard).toContain("copy.responses.openingsPanel.view");
    expect(dashboardCopy.fr.responses.openingsPanel.view).toBe(
      "Voir / valider cette annulation"
    );
    expect(responseQueries).toContain(
      "export async function loadAppointmentCalendarItems"
    );
    expect(operationsData).toContain(
      "export async function loadOpeningResponseGroups"
    );
    expect(operationsData).toContain(".from(\"opening_offers\")");
    expect(operationsData).toContain(".from(\"sms_messages\")");
    expect(operationsData).toContain(".eq(\"organization_id\", organizationId)");
    expect(operationsData).toContain(".in(\"status\", [\"sent\", \"responded\", \"selected\", \"rejected\"])");
  });
});
