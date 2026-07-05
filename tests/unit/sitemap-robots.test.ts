import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const publicRoutes = [
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

const privateRoutes = [
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

describe("production sitemap and robots", () => {
  it("lists only public indexable routes with French legal pages", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      publicRoutes.map((route) =>
        route === "/" ? "https://open-spot.ca" : `https://open-spot.ca${route}`
      )
    );

    for (const route of privateRoutes) {
      expect(urls).not.toContain(`https://open-spot.ca${route}`);
    }

    expect(source("src/app/sitemap.ts")).toContain("SITE_LAST_UPDATED");
  });

  it("disallows private, auth, API, and waitlist routes in robots", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules[0] : config.rules;
    const disallow = rules.disallow ?? [];

    expect(rules.allow).toBe("/");
    expect(disallow).toEqual(
      expect.arrayContaining([
        "/dashboard/",
        "/admin/",
        "/platform-admin/",
        "/api/",
        "/auth/",
        "/sign-in",
        "/signup",
        "/login",
        "/forgot-password",
        "/onboarding",
        "/dashboard-preview",
        "/b/"
      ])
    );
    expect(config.sitemap).toBe("https://open-spot.ca/sitemap.xml");

    for (const route of publicRoutes) {
      expect(disallow).not.toContain(route);
      expect(disallow).not.toContain(`${route}/`);
    }
  });
});
