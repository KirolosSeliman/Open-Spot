import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("production sitemap and robots", () => {
  it("lists only public indexable routes with French legal pages", () => {
    const sitemap = source("src/app/sitemap.ts");

    expect(sitemap).toContain('path: "/"');
    expect(sitemap).toContain('path: "/pricing"');
    expect(sitemap).toContain('path: "/how-it-works"');
    expect(sitemap).toContain('path: "/industries"');
    expect(sitemap).toContain('path: "/book-call/questions"');
    expect(sitemap).toContain('path: "/politique-confidentialite"');
    expect(sitemap).toContain('path: "/conditions-utilisation"');
    expect(sitemap).toContain('path: "/consentement-sms"');
    expect(sitemap).toContain("resolveConfiguredSiteUrl");
    expect(sitemap).not.toContain('"/sign-in"');
    expect(sitemap).not.toContain('"/signup"');
    expect(sitemap).not.toContain('"/privacy"');
    expect(sitemap).not.toContain('"/terms"');
    expect(sitemap).not.toContain('"/dashboard"');
  });

  it("disallows private, auth, API, and waitlist routes in robots", () => {
    const robots = source("src/app/robots.ts");

    expect(robots).toContain('allow: "/"');
    expect(robots).toContain('"/dashboard/"');
    expect(robots).toContain('"/admin/"');
    expect(robots).toContain('"/platform-admin/"');
    expect(robots).toContain('"/api/"');
    expect(robots).toContain('"/auth/"');
    expect(robots).toContain('"/sign-in"');
    expect(robots).toContain('"/b/"');
    expect(robots).toContain("/sitemap.xml");
    expect(robots).toContain("resolveConfiguredSiteUrl");
  });
});
