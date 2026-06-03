import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

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

    expect(dashboardPage).toContain("Votre espace est pret.");
    expect(dashboardPage).toContain("Commencez par ajouter vos services et vos clients.");
    expect(dashboardPage).toContain("Ajouter vos services");
    expect(dashboardPage).toContain("Ajouter vos clients");
    expect(dashboardPage).toContain("Creer votre premiere annulation");
  });

  it("loads the real response queue from organization-scoped data", () => {
    const responsesPage = readFileSync(
      join(appDashboardRoot, "responses", "page.tsx"),
      "utf8"
    );
    const operationsData = readFileSync(
      join(process.cwd(), "src", "lib", "dashboard", "operations-data.ts"),
      "utf8"
    );

    expect(responsesPage).toContain("loadResponseQueue");
    expect(responsesPage).toContain("response.lastInboundBody");
    expect(responsesPage).toContain("response.replyClassification");
    expect(operationsData).toContain("export async function loadResponseQueue");
    expect(operationsData).toContain(".from(\"opening_offers\")");
    expect(operationsData).toContain(".from(\"sms_messages\")");
    expect(operationsData).toContain(".eq(\"organization_id\", organizationId)");
    expect(operationsData).toContain(".in(\"status\", [\"sent\", \"responded\", \"selected\", \"rejected\"])");
  });
});
