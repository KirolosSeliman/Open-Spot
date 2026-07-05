import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildGlobalStructuredData,
  buildOrganizationJsonLd,
  buildPageStructuredData,
  buildServiceJsonLd,
  buildWebApplicationJsonLd,
  buildWebSiteJsonLd,
  serializeJsonLd
} from "@/lib/seo/structured-data";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("structured data", () => {
  const siteUrl = "https://open-spot.ca";

  it("builds Organization, WebSite, WebApplication, and Service JSON-LD", () => {
    const graphs = buildGlobalStructuredData(siteUrl);

    expect(graphs).toHaveLength(4);
    expect(graphs.map((graph) => graph["@type"])).toEqual([
      "Organization",
      "WebSite",
      "WebApplication",
      "Service"
    ]);
  });

  it("uses stable entity IDs, the canonical production domain, and brand names", () => {
    const organization = buildOrganizationJsonLd(siteUrl);
    const website = buildWebSiteJsonLd(siteUrl);
    const webApp = buildWebApplicationJsonLd(siteUrl);
    const service = buildServiceJsonLd(siteUrl);

    expect(organization["@id"]).toBe("https://open-spot.ca/#organization");
    expect(organization.url).toBe("https://open-spot.ca");
    expect(organization.name).toBe("Open Spot");
    expect(organization.alternateName).toBe("2e Chance RDV");
    expect(website["@id"]).toBe("https://open-spot.ca/#website");
    expect(website.url).toBe("https://open-spot.ca");
    expect(website.publisher).toEqual({ "@id": "https://open-spot.ca/#organization" });
    expect(webApp["@id"]).toBe("https://open-spot.ca/#webapp");
    expect(webApp.url).toBe("https://open-spot.ca");
    expect(webApp.applicationCategory).toBe("BusinessApplication");
    expect(webApp.creator).toEqual({ "@id": "https://open-spot.ca/#organization" });
    expect(service["@id"]).toBe("https://open-spot.ca/#service");
    expect(service.serviceType).toBe(
      "SMS cancellation recovery for appointment-based businesses"
    );
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
    expect(payload).not.toContain("review");
    expect(payload).not.toContain("offers");
    expect(payload).not.toContain("automatic confirmation");
    expect(payload).not.toContain("confirmed automatically");
    expect(payload).not.toContain("automatically confirmed");
  });

  it("builds FAQPage and BreadcrumbList JSON-LD from visible page data", () => {
    const faq = buildFaqJsonLd([
      {
        question: "Les clients sont-ils confirmes sans validation?",
        answer:
          "Non. Le commerce garde la confirmation manuelle finale apres avoir revise les reponses."
      }
    ]);
    const breadcrumb = buildBreadcrumbJsonLd([
      { name: "Accueil", path: "/" },
      { name: "Barbiers", path: "/barbiers" }
    ]);

    expect(faq["@type"]).toBe("FAQPage");
    expect(faq.mainEntity).toHaveLength(1);
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
    expect(breadcrumb.itemListElement).toHaveLength(2);
    expect(breadcrumb.itemListElement[1]).toMatchObject({
      position: 2,
      name: "Barbiers",
      item: "https://open-spot.ca/barbiers"
    });
  });

  it("composes page structured data with breadcrumb and FAQ schemas", () => {
    const graphs = buildPageStructuredData({
      path: "/barbiers",
      breadcrumbs: [
        { name: "Accueil", path: "/" },
        { name: "Barbiers", path: "/barbiers" }
      ],
      faq: [
        {
          question: "Open Spot confirme-t-il automatiquement le premier client?",
          answer:
            "Non. L'equipe revise les reponses et garde la confirmation manuelle finale."
        }
      ],
      siteUrl
    });

    expect(graphs.map((graph) => graph["@type"])).toEqual([
      "BreadcrumbList",
      "FAQPage"
    ]);
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
