import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const importPanelSource = readFileSync(
  join(process.cwd(), "src", "components", "import", "import-export-panel.tsx"),
  "utf8"
);
const importPageSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "import", "page.tsx"),
  "utf8"
);
const settingsPageSource = readFileSync(
  join(process.cwd(), "src", "app", "dashboard", "settings", "page.tsx"),
  "utf8"
);

describe("import/export dashboard UI", () => {
  it("uses a CSV file picker instead of a merchant-facing CSV textarea", () => {
    expect(importPanelSource).toContain('type="file"');
    expect(importPanelSource).toContain('accept=".csv,text/csv"');
    expect(importPanelSource).toContain("Fichier sélectionné");
    expect(importPanelSource).toContain("Type de fichier non pris en charge");
    expect(importPanelSource).toContain("Prévisualiser");
    expect(importPageSource).not.toContain("<textarea");
    expect(settingsPageSource).toContain("<ImportExportPanel");
    expect(settingsPageSource).not.toContain('fields: ["CSV import", "Client export", "Template export"]');
  });

  it("shows client and template export as clear actions", () => {
    expect(importPanelSource).toContain("Télécharger le CSV clients");
    expect(importPanelSource).toContain("Télécharger le modèle CSV");
    expect(importPanelSource).toContain("/dashboard/import/export/customers");
    expect(importPanelSource).toContain("/dashboard/import/export/template");
  });
});
