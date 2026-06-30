import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const importActionsSource = readFileSync(
  join(process.cwd(), "src", "lib", "import", "actions.ts"),
  "utf8"
);
const importPageSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "import", "page.tsx"),
  "utf8"
);

describe("safe manual re-import", () => {
  it("matches customers by organization and phone before create/update", () => {
    expect(importActionsSource).toContain('.eq("organization_id", organizationId)');
    expect(importActionsSource).toContain('.eq("phone_e164", phoneE164)');
    expect(importActionsSource).toContain("createdCount");
    expect(importActionsSource).toContain("updatedCount");
  });

  it("preserves existing opted-out consent during re-import", () => {
    expect(importActionsSource).toContain("existingConsent?.status === \"opted_out\"");
    expect(importActionsSource).toContain("optedOutPreservedCount");
    expect(importActionsSource).toContain("finalConsentStatus");
  });

  it("shows an import result report after confirmation", () => {
    expect(importPageSource).toContain("Créés :");
    expect(importPageSource).toContain("Mis à jour :");
    expect(importPageSource).toContain("Désinscrits");
  });
});
