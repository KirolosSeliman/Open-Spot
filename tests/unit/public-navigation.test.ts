import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${path}`, import.meta.url)),
    "utf8"
  );
}

describe("public navigation", () => {
  const homepagePath = "src/components/marketing/lunera-open-spot-template.tsx";

  it("exposes auth and sales actions from the homepage marketing header", () => {
    const homepage = source(homepagePath);

    expect(homepage).toContain('href="/sign-in"');
    expect(homepage).toContain('href="/signup"');
    expect(homepage).toContain('href="/book-call/questions"');
    expect(homepage).toContain("Connexion");
    expect(homepage).toContain("Créer un compte");
    expect(homepage).toContain("Sign in");
    expect(homepage).toContain("Create account");
    expect(homepage).toContain('login: "Connexion"');
    expect(homepage).toContain('primary: "Créer un compte"');
  });

  it("uses the Open Spot brand in the public landing copy", () => {
    const homepage = source(homepagePath);
    const rootLayout = source("src/app/layout.tsx");
    const bookingPage = source("src/components/marketing/open-spot-booking-page.tsx");
    const consentSmsSource = source("src/lib/sms/message-generator.ts");

    expect(homepage).toContain("Open Spot");
    expect(homepage).not.toContain("2e Chance RDV");
    expect(homepage).toContain("SMS de récupération pour commerces à rendez-vous");
    expect(homepage).toContain("Validation manuelle requise");
    expect(rootLayout).toContain("Open Spot");
    expect(rootLayout).not.toContain("2e Chance RDV");
    expect(bookingPage).toContain("Open Spot");
    expect(bookingPage).not.toContain("2e Chance RDV");
    expect(consentSmsSource).toContain("Open Spot");
    expect(consentSmsSource).not.toContain("2e Chance RDV");
  });

  it("does not publish a fixed beta price", () => {
    const homepage = source(homepagePath);
    const pricingPage = source("src/app/pricing/page.tsx");
    const productRequirements = source("docs/product-requirements.md");
    const fixedPricePattern = /34[,.]99|\$34|CAD 34\.99/i;

    expect(homepage).not.toMatch(fixedPricePattern);
    expect(pricingPage).not.toMatch(fixedPricePattern);
    expect(productRequirements).not.toMatch(fixedPricePattern);
    expect(homepage).toContain("No fixed public price");
    expect(pricingPage).toContain("Pricing adapted to your business.");
    expect(productRequirements).toContain("Public pricing is not fixed");
  });

  it("does not make unsupported AI targeting claims on the public landing page", () => {
    const homepage = source(homepagePath);

    expect(homepage).not.toContain("Ciblage intelligent par IA");
    expect(homepage).not.toContain("agent IA");
    expect(homepage).not.toContain("AI smart targeting");
    expect(homepage).not.toContain("Product direction: AI assistance");
    expect(homepage).not.toContain("aide par IA");
    expect(homepage).not.toContain("AI selects");
  });

  it("does not keep dormant AI marketing sections that can be reintroduced", () => {
    const marketingComponents = readdirSync(
      fileURLToPath(new URL("../../src/components/marketing", import.meta.url))
    )
      .filter((fileName) => fileName.endsWith(".tsx"))
      .map((fileName) => source(`src/components/marketing/${fileName}`))
      .join("\n");

    expect(marketingComponents).not.toContain("Ciblage IA");
    expect(marketingComponents).not.toContain("aide par IA");
    expect(marketingComponents).not.toContain("AI smart targeting");
    expect(marketingComponents).not.toContain("AI selects");
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
