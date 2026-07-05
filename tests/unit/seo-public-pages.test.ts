import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  commercialSeoPages,
  publicSeoPages,
  publicSitemapEntries
} from "@/lib/seo/public-pages";

const requiredPublicRoutes = [
  "/",
  "/pricing",
  "/how-it-works",
  "/industries",
  "/book-call/questions",
  "/book-call/ready",
  "/politique-confidentialite",
  "/conditions-utilisation",
  "/consentement-sms",
  "/barbiers",
  "/coiffeurs",
  "/salons-esthetique",
  "/spas",
  "/cliniques-beaute",
  "/ongleries",
  "/liste-attente-sms",
  "/annulations-rendez-vous-sms"
] as const;

const sensitiveRoutes = [
  "/dashboard",
  "/admin",
  "/platform-admin",
  "/api",
  "/auth",
  "/sign-in",
  "/signup",
  "/login",
  "/forgot-password",
  "/onboarding",
  "/dashboard-preview"
] as const;

const forbiddenPublicSeoPhrases = [
  "confirmation automatique",
  "confirmé automatiquement",
  "automatic confirmation",
  "automatically confirmed",
  "réservation automatique",
  "revenu garanti",
  "résultats garantis",
  "CRM complet",
  "remplace votre système de réservation",
  "envoyez des promotions de masse",
  "marketing SMS généraliste"
] as const;

const publicSeoSourceFiles = [
  "src/lib/seo/public-pages.ts",
  "src/components/marketing/lunera-open-spot-template.tsx",
  "src/components/marketing/industry-seo-page.tsx",
  "src/components/marketing/seo-faq.tsx",
  "src/app/page.tsx",
  "src/app/pricing/page.tsx",
  "src/app/how-it-works/page.tsx",
  "src/app/industries/page.tsx",
  "src/app/barbiers/page.tsx",
  "src/app/coiffeurs/page.tsx",
  "src/app/salons-esthetique/page.tsx",
  "src/app/spas/page.tsx",
  "src/app/cliniques-beaute/page.tsx",
  "src/app/ongleries/page.tsx",
  "src/app/liste-attente-sms/page.tsx",
  "src/app/annulations-rendez-vous-sms/page.tsx"
] as const;

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("public SEO page registry", () => {
  it("defines every public indexable route with unique title, description, and canonical path", () => {
    const paths = publicSeoPages.map((page) => page.path);
    const titles = new Set(publicSeoPages.map((page) => page.metadata.title));
    const descriptions = new Set(
      publicSeoPages.map((page) => page.metadata.description)
    );

    expect(paths).toEqual(requiredPublicRoutes);
    expect(titles.size).toBe(publicSeoPages.length);
    expect(descriptions.size).toBe(publicSeoPages.length);

    for (const page of publicSeoPages) {
      expect(page.metadata.title).not.toMatch(/^Open Spot\b/);
      expect(page.metadata.description.length).toBeGreaterThan(80);
      expect(page.metadata.path).toBe(page.path);
      expect(page.metadata.locale).toBe("fr-CA");
    }
  });

  it("keeps sitemap routes public and excludes sensitive routes", () => {
    const sitemapPaths = publicSitemapEntries.map((entry) => entry.path);

    expect(sitemapPaths).toEqual(requiredPublicRoutes);
    for (const route of sensitiveRoutes) {
      expect(sitemapPaths).not.toContain(route);
    }
  });

  it("keeps commercial SEO pages non-thin, manually validated, and internally linked", () => {
    expect(commercialSeoPages.map((page) => page.path)).toEqual([
      "/barbiers",
      "/coiffeurs",
      "/salons-esthetique",
      "/spas",
      "/cliniques-beaute",
      "/ongleries",
      "/liste-attente-sms",
      "/annulations-rendez-vous-sms"
    ]);

    for (const page of commercialSeoPages) {
      expect(page.h1.length).toBeGreaterThan(40);
      expect(page.sections.map((section) => section.title)).toEqual(
        expect.arrayContaining([
          "Pourquoi les annulations coûtent cher",
          "Comment Open Spot aide",
          "Validation manuelle",
          "Consentement SMS et STOP"
        ])
      );
      expect(page.workflow).toHaveLength(5);
      expect(page.faq.length).toBeGreaterThanOrEqual(3);
      expect(page.internalLinks.length).toBeGreaterThanOrEqual(3);
      expect(page.manualValidationCopy.toLowerCase()).toContain(
        "confirmation manuelle"
      );
    }
  });

  it("keeps dangerous product claims out of public marketing and SEO source files", () => {
    const publicMarketingSource = publicSeoSourceFiles.map(source).join("\n");

    const normalized = publicMarketingSource.toLowerCase();
    for (const phrase of forbiddenPublicSeoPhrases) {
      expect(normalized).not.toContain(phrase.toLowerCase());
    }
  });

  it("scans every commercial SEO page source and shared copy source for dangerous phrases", () => {
    const scannedFiles = new Set(publicSeoSourceFiles);

    for (const page of commercialSeoPages) {
      expect(scannedFiles).toContain(`src/app${page.path}/page.tsx`);
    }

    expect(scannedFiles).toContain("src/lib/seo/public-pages.ts");
    expect(scannedFiles).toContain("src/components/marketing/industry-seo-page.tsx");
    expect(scannedFiles).toContain("src/components/marketing/seo-faq.tsx");
  });
});
