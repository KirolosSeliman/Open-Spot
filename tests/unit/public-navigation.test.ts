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
    expect(homepage).toContain("Fill last-minute");
    expect(homepage).toContain("cancellations by SMS.");
    expect(homepage).toContain(
      "Open Spot contacts opted-in customers, ranks replies, and lets you choose who to confirm"
    );
    expect(homepage).toContain("Manual Confirmation");
    expect(homepage).toContain("No one is confirmed without review");
    expect(rootLayout).toContain("Open Spot");
    expect(rootLayout).not.toContain("2e Chance RDV");
    expect(bookingPage).toContain("Open Spot");
    expect(bookingPage).not.toContain("2e Chance RDV");
    expect(consentSmsSource).toContain("Open Spot");
    expect(consentSmsSource).not.toContain("2e Chance RDV");
  });

  it("publishes the requested Open Spot pricing cards without wiring checkout", () => {
    const homepage = source(homepagePath);
    const pricingPage = source("src/app/pricing/page.tsx");
    const productRequirements = source("docs/product-requirements.md");
    const fixedPricePattern = /34[,.]99|\$34|CAD 34\.99/i;

    expect(homepage).not.toMatch(fixedPricePattern);
    expect(pricingPage).not.toMatch(fixedPricePattern);
    expect(productRequirements).not.toMatch(fixedPricePattern);
    expect(homepage).toContain("$0 / mo");
    expect(homepage).toContain("$49 / mo");
    expect(homepage).toContain("Custom");
    expect(homepage).toContain("Best Deal");
    expect(homepage).not.toContain("stripe");
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

  it("renders the requested Lunera-style landing sections in order", () => {
    const homepage = source(homepagePath);
    const phone = source("src/components/marketing/sms-conversation-phone.tsx");
    const styles = source("src/app/globals.css");
    const mainMarkup = homepage.slice(homepage.indexOf("<main>"), homepage.indexOf("</main>"));
    const heroFunction = homepage.slice(
      homepage.indexOf("function Hero("),
      homepage.indexOf("function MetricsSection(")
    );
    const phoneIndex = heroFunction.indexOf("<HeroPhoneMockup");
    const requiredOrder = [
      "<Hero",
      "<MetricsSection",
      "<SetupSection",
      "<HowItWorks",
      "<WorkflowPreview",
      "<Pricing",
      "<Testimonials",
      "<Faq",
      "<FinalCta"
    ];

    for (let index = 0; index < requiredOrder.length - 1; index += 1) {
      expect(mainMarkup.indexOf(requiredOrder[index])).toBeGreaterThan(-1);
      expect(mainMarkup.indexOf(requiredOrder[index])).toBeLessThan(
        mainMarkup.indexOf(requiredOrder[index + 1])
      );
    }

    expect(homepage).not.toContain("<Resources");
    expect(homepage).not.toContain("<IntegrationsSection");
    expect(heroFunction).toContain("lunera-hero-sky");
    expect(heroFunction).toContain("lunera-hero-visual-scene");
    expect(phoneIndex).toBeGreaterThan(-1);
    expect(heroFunction).toContain("<SmsConversationPhone");
    expect(heroFunction).toContain("<HeroCloudBlend");
    expect(homepage).toContain("Built for appointment-based teams");
    expect(homepage).toContain("Barbers");
    expect(homepage).toContain("Beauty Clinics");
    expect(homepage).toContain("Hair Salons");
    expect(homepage).toContain("Spas");
    expect(homepage).toContain("Nail Studios");
    expect(homepage).toContain("Keep your booking system.");
    expect(homepage).toContain("Fill the empty spots.");
    expect(homepage).toContain("From cancellation");
    expect(homepage).toContain("to confirmation");
    expect(homepage).toContain("Non-disruptive cancellation recovery");
    expect(homepage).toContain("Real results from local teams.");
    expect(homepage).toContain("Ready to recover your next cancellation?");
    expect(homepage).toContain("SMS consent");
    expect(homepage).toContain("bg-[#050505]");
    expect(styles).toContain(".lunera-phone-depth-layer");
    expect(styles).toContain(".lunera-hero-cloud-blend");
    expect(styles).toContain(".open-spot-dashboard-card");
    expect(styles).toContain(".open-spot-setup-arc");
    expect(styles).toContain(".open-spot-step-card");
    expect(styles).toContain("width: clamp(300px, 24vw, 390px)");
    expect(styles).toContain("rotateY(-8deg)");
    expect(styles).toContain("rotateZ(2.5deg)");
    expect(phone).toContain("Secure & compliant");
    expect(phone).toContain("Fill more. No-shows down.");
    expect(phone).toContain("Open spots filled this week");
    expect(phone).toContain("Revenue recovered");
    expect(homepage).not.toContain("setScrollProgress");
    expect(homepage).toContain(".style.setProperty(");
    expect(homepage).toContain('"--lunera-progress"');
  });

  it("uses an Open Spot appointment workflow inside the phone", () => {
    const phone = source("src/components/marketing/sms-conversation-phone.tsx");
    const styles = source("src/app/globals.css");

    expect(phone).toContain("Open Spot");
    expect(phone).toContain("New cancellation");
    expect(phone).toContain("Today, 10:30 AM");
    expect(phone).toContain("60-min Massage with Alex");
    expect(phone).toContain("Waitlist replies");
    expect(phone).toContain("7");
    expect(phone).toContain("Sarah M.");
    expect(phone).toContain("I can come in");
    expect(phone).toContain("Best match");
    expect(phone).toContain("Mike R.");
    expect(phone).toContain("Yes, I");
    expect(phone).toContain("90% match");
    expect(phone).toContain("Jessica T.");
    expect(phone).toContain("Interested");
    expect(phone).toContain("80% match");
    expect(phone).toContain("Confirm Sarah M.");
    expect(phone).toContain("View all replies");
    expect(styles).toContain(".lunera-phone-screen-overlay");
    expect(styles).toContain("transform-origin: center center");
  });

  it("uses the requested category strip instead of fake brand logos", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const expectedBusinessTypes = [
      "Barbers",
      "Beauty Clinics",
      "Hair Salons",
      "Spas",
      "Nail Studios"
    ];
    const oldPlaceholderTypes = [
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

    expect(homepage).toContain("CategoryStrip");
    expect(homepage).toContain("Built for appointment-based teams");
    expect(homepage).not.toContain('logos: ["Salons", "Barbers"');
    expect(homepage).not.toContain("40K+ users worldwide");
    expect(homepage).not.toContain("Codecraft");
    expect(styles).toContain(".open-spot-category-strip");
  });

  it("links sign-in and signup pages to each other", () => {
    expect(source("src/app/sign-in/page.tsx")).toContain('href="/signup"');
    expect(source("src/app/signup/page.tsx")).toContain('href="/sign-in"');
  });
});
