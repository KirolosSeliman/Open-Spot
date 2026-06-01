import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${path}`, import.meta.url)),
    "utf8"
  );
}

describe("public navigation", () => {
  it("exposes auth and sales actions from the homepage marketing header", () => {
    const homepage = source("src/components/marketing/open-spot-funnel.tsx");

    expect(homepage).toContain('href="/sign-in"');
    expect(homepage).toContain('href="/signup"');
    expect(homepage).toContain('href="/book-call/questions"');
    expect(homepage).toContain("Connexion");
    expect(homepage).toContain("Créer un compte");
    expect(homepage).toContain("Sign in");
    expect(homepage).toContain("Create account");
    expect(homepage).toContain('login: "Connexion"');
    expect(homepage).toContain('signup: "Créer un compte"');
  });

  it("uses the Open Spot brand in the public landing copy", () => {
    const homepage = source("src/components/marketing/open-spot-funnel.tsx");
    const rootLayout = source("src/app/layout.tsx");
    const bookingPage = source("src/components/marketing/open-spot-booking-page.tsx");

    expect(homepage).toContain("Open Spot");
    expect(homepage).not.toContain("2e Chance RDV");
    expect(homepage).toContain("Pourquoi Open Spot");
    expect(rootLayout).toContain("Open Spot");
    expect(rootLayout).not.toContain("2e Chance RDV");
    expect(bookingPage).toContain("Open Spot");
    expect(bookingPage).not.toContain("2e Chance RDV");
  });

  it("does not make unsupported AI targeting claims on the public landing page", () => {
    const homepage = source("src/components/marketing/open-spot-funnel.tsx");

    expect(homepage).not.toContain("Ciblage intelligent par IA");
    expect(homepage).not.toContain("agent IA");
    expect(homepage).not.toContain("AI smart targeting");
    expect(homepage).not.toContain("AI selects");
  });

  it("keeps dashboard access visible in the global authenticated header", () => {
    const siteHeader = source("src/components/layout/site-header.tsx");

    expect(siteHeader).toContain('href="/dashboard"');
    expect(siteHeader).not.toContain('className="hidden rounded-full');
  });

  it("links sign-in and signup pages to each other", () => {
    expect(source("src/app/sign-in/page.tsx")).toContain('href="/signup"');
    expect(source("src/app/signup/page.tsx")).toContain('href="/sign-in"');
  });
});
