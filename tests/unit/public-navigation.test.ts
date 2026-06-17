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

  it("keeps the homepage header minimal for Lunera-style parity", () => {
    const homepage = source(homepagePath);

    expect(homepage).toContain('const loginHref = "/sign-in"');
    expect(homepage).toContain('features: "Features"');
    expect(homepage).toContain('how: "How it works"');
    expect(homepage).toContain('pricing: "Pricing"');
    expect(homepage).toContain('contact: "Contact"');
    expect(homepage).toContain("Se connecter");
    expect(homepage).not.toContain("Get Early Access");
    expect(homepage).not.toContain('href="/signup"');
    expect(homepage).not.toContain("LanguageSwitcher");
    expect(homepage).not.toContain('login: "Connexion"');
    expect(homepage).not.toContain('login: "Sign in"');
    expect(homepage).not.toContain('resources: "Guides"');
    expect(homepage).not.toContain('tools: "Tools"');
  });

  it("uses the Open Spot brand in the public landing copy", () => {
    const homepage = source(homepagePath);
    const rootLayout = source("src/app/layout.tsx");
    const bookingPage = source("src/components/marketing/open-spot-booking-page.tsx");
    const consentSmsSource = source("src/lib/sms/message-generator.ts");

    expect(homepage).toContain("Open Spot");
    expect(homepage).not.toContain("2e Chance RDV");
    expect(homepage).toContain("recover every booking.");
    expect(homepage).toContain(
      "Simple SMS tools that help salons fill open spots and turns refill last-minute cancellations into new appointments."
    );
    expect(homepage).toContain("Manual Confirmation");
    expect(homepage).toContain("Open Spot never confirms automatically");
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

  it("keeps forbidden fintech and automatic booking content out of the public homepage source", () => {
    const homepage = source(homepagePath);
    const phone = source("src/components/marketing/sms-conversation-phone.tsx");
    const combinedVisibleSource = `${homepage}\n${phone}`;
    const forbiddenTerms = [
      "Apple Store",
      "Spotify",
      "My Cards",
      "Credit",
      "Wallet",
      "Transaction",
      "Budget",
      "Spending",
      "Expense",
      "Secure payment",
      "Finance",
      "Bank",
      "Automatically confirmed",
      "auto-confirmation",
      "first reply wins"
    ];

    for (const term of forbiddenTerms) {
      expect(combinedVisibleSource).not.toContain(term);
    }
  });

  it("renders the angled phone hero before the rest of the public funnel", () => {
    const homepage = source(homepagePath);
    const phone = source("src/components/marketing/sms-conversation-phone.tsx");
    const styles = source("src/app/globals.css");
    const mainMarkup = homepage.slice(homepage.indexOf("<main>"), homepage.indexOf("</main>"));
    const heroFunction = homepage.slice(
      homepage.indexOf("function Hero("),
      homepage.indexOf("function LogoStrip(")
    );

    expect(mainMarkup.indexOf("<Hero")).toBeLessThan(
      mainMarkup.indexOf("<LogoStrip")
    );
    expect(mainMarkup.indexOf("<Hero")).toBeLessThan(
      mainMarkup.indexOf("<IntegrationsSection")
    );
    expect(heroFunction).toContain("lunera-hero-sky");
    expect(heroFunction).toContain("lunera-hero-visual-scene");
    expect(heroFunction).toContain("<SmsConversationPhone");
    expect(heroFunction).toContain("<HeroCloudBlend");
    expect(styles).toContain(".lunera-phone-depth-layer");
    expect(styles).toContain(".lunera-hero-cloud-blend");
    expect(styles).toContain("width: clamp(300px, 24vw, 390px)");
    expect(styles).toContain("rotateY(-8deg)");
    expect(styles).toContain("rotateZ(2.5deg)");
    expect(phone).toContain("Consent checked");
    expect(phone).toContain("Reply received");
    expect(phone).toContain("Open slot created");
    expect(phone).toContain("Ready to");
    expect(phone).toContain("fill.");
    expect(homepage).not.toContain("setScrollProgress");
    expect(homepage).toContain(".style.setProperty(");
    expect(homepage).toContain('"--lunera-progress"');
  });

  it("uses an Open Spot appointment workflow inside the phone", () => {
    const phone = source("src/components/marketing/sms-conversation-phone.tsx");
    const styles = source("src/app/globals.css");

    expect(phone).toContain("4:31");
    expect(phone).toContain("Open Spots");
    expect(phone).toContain("Open slot");
    expect(phone).toContain("4:30 PM");
    expect(phone).toContain("Haircut + brushing");
    expect(phone).toContain("2 replies");
    expect(phone).toContain("Manual review");
    expect(phone).toContain("Client replies");
    expect(phone).toContain("Maria C.");
    expect(phone).toContain("I can do that!");
    expect(phone).toContain("James L.");
    expect(phone).toContain("Yes, I");
    expect(styles).toContain(".lunera-phone-screen-overlay");
    expect(styles).toContain("transform-origin: center center");
  });

  it("uses a long seamless business marquee instead of a short logo loop", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const expectedBusinessTypes = [
      "Salons",
      "Barbers",
      "Beauty Clinics",
      "Spas",
      "Nail Studios",
      "Hair Stylists",
      "Massage Clinics",
      "Med Spas",
      "Tattoo Studios",
      "Physio Clinics",
      "Chiropractors",
      "Dental Clinics",
      "Estheticians",
      "Lash Studios",
      "Brow Studios",
      "Wellness Studios",
      "Pet Groomers",
      "Personal Trainers",
      "Therapy Clinics",
      "Appointment Teams",
    ];
    const oldPlaceholderTypes = [
      "Hair Salons",
      "Barbershops",
      "Massage Therapists",
      "Physiotherapy",
      "Medical Aesthetics",
      "Tutors",
      "Yoga Studios",
      "Repair Shops",
      "Consultants",
      "Wellness Centers",
      "Local Services"
    ];

    for (const businessType of expectedBusinessTypes) {
      expect(homepage).toContain(businessType);
    }

    for (const businessType of oldPlaceholderTypes) {
      expect(homepage).not.toContain(businessType);
    }

    expect(homepage).toContain(
      "[...t.businessTypes, ...t.businessTypes, ...t.businessTypes]"
    );
    expect(homepage).toContain("lunera-business-marquee");
    expect(homepage).toContain("lunera-business-marquee-track");
    expect(homepage).not.toContain('logos: ["Salons", "Barbers"');
    expect(styles).toContain(".lunera-business-marquee");
    expect(styles).toContain(".lunera-business-marquee-track");
    expect(styles).toContain("@keyframes lunera-business-marquee");
    expect(styles).toContain("translate3d(-33.333%");
  });

  it("links sign-in and signup pages to each other", () => {
    expect(source("src/app/sign-in/page.tsx")).toContain('href="/signup"');
    expect(source("src/app/signup/page.tsx")).toContain('href="/sign-in"');
  });
});
