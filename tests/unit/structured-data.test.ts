import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildGlobalStructuredData,
  buildOrganizationJsonLd,
  buildWebApplicationJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd
} from "@/lib/seo/structured-data";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("structured data", () => {
  const siteUrl = "https://open-spot.ca";

  it("builds Organization, WebSite, and WebApplication JSON-LD", () => {
    const graphs = buildGlobalStructuredData(siteUrl);

    expect(graphs).toHaveLength(3);
    expect(graphs.map((graph) => graph["@type"])).toEqual([
      "Organization",
      "WebSite",
      "WebApplication"
    ]);
  });

  it("uses the canonical production domain and brand names", () => {
    const organization = buildOrganizationJsonLd(siteUrl);
    const website = buildWebSiteJsonLd(siteUrl);
    const webApp = buildWebApplicationJsonLd(siteUrl);

    expect(organization.url).toBe("https://open-spot.ca");
    expect(organization.name).toBe("Open Spot");
    expect(organization.alternateName).toBe("2e Chance RDV");
    expect(website.url).toBe("https://open-spot.ca");
    expect(webApp.url).toBe("https://open-spot.ca");
    expect(webApp.applicationCategory).toBe("BusinessApplication");
  });

  it("points logo to a real public asset", () => {
    const organization = buildOrganizationJsonLd(siteUrl);

    expect(organization.logo).toBe(
      "https://open-spot.ca/brand/open-spot-logo-mark.png"
    );
  });

  it("does not include fake ratings, reviews, or automatic confirmation language", () => {
    const payload = JSON.stringify(buildGlobalStructuredData(siteUrl));

    expect(payload).not.toContain("aggregateRating");
    expect(payload).not.toContain("automatic confirmation");
    expect(payload).not.toContain("confirmed automatically");
    expect(payload).not.toContain("automatically confirmed");
  });

  it("serializes JSON-LD safely for script injection", () => {
    const serialized = serializeJsonLd({ safe: "<script>" });

    expect(serialized).toContain("\\u003c");
    expect(JSON.parse(serialized)).toEqual({ safe: "<script>" });
  });

  it("renders JSON-LD scripts from the structured data component", () => {
    const layout = source("src/app/layout.tsx");
    const structuredData = source("src/components/seo/structured-data.tsx");

    expect(layout).toContain("GlobalStructuredData");
    expect(structuredData).toContain('type="application/ld+json"');
  });
});
