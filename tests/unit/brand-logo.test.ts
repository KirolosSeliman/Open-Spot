import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Open Spot official brand mark", () => {
  it("uses one extracted official mark asset through a central logo component", () => {
    expect(
      existsSync(join(process.cwd(), "public", "brand", "open-spot-logo-mark.png"))
    ).toBe(true);

    const logoComponent = source("src/components/brand/open-spot-logo.tsx");

    expect(logoComponent).toContain("/brand/open-spot-logo-mark.png");
    expect(logoComponent).toContain('variant?: "mark" | "lockup"');
    expect(logoComponent).toContain('alt={variant === "mark" ? "Open Spot" : ""}');
    expect(logoComponent).toContain('aria-hidden={variant === "lockup" ? true : undefined}');

    expect(source("public/brand/open-spot-icon.svg")).toContain(
      "/brand/open-spot-logo-mark.png"
    );
    expect(source("public/brand/open-spot-logo-horizontal.svg")).toContain(
      "/brand/open-spot-logo-mark.png"
    );
  });

  it("replaces legacy generated logos in public and dashboard brand surfaces", () => {
    const publicLanding = source("src/components/marketing/lunera-open-spot-template.tsx");
    const publicHeader = source("src/components/layout/site-header.tsx");
    const dashboardShell = source("src/components/dashboard/dashboard-shell.tsx");
    const combinedBrandSurfaces = [publicLanding, publicHeader, dashboardShell].join("\n");

    expect(combinedBrandSurfaces).toContain("OpenSpotLogo");
    expect(publicLanding).not.toContain("function OpenSpotMark");
    expect(publicLanding).not.toContain("lunera-brand-mark");
    expect(combinedBrandSurfaces).not.toContain("/brand/open-spot-icon.svg");
    expect(combinedBrandSurfaces).not.toContain("/brand/open-spot-logo-horizontal.svg");
  });
});
