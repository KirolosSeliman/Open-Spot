import { existsSync, readdirSync, readFileSync } from "node:fs";
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
      "<RevenueCalculatorSection",
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
    expect(homepage).toContain("Recover the empty spots.");
    expect(homepage).toContain("From cancellation");
    expect(homepage).toContain("to confirmation");
    expect(homepage).toContain("See what empty spots");
    expect(homepage).toContain("are costing you.");
    expect(homepage).not.toContain("Non-disruptive cancellation recovery");
    expect(homepage).toContain("What local teams say about Open Spot.");
    expect(homepage).toContain("Ready to recover your next cancellation?");
    expect(homepage).toContain("SMS consent");
    expect(homepage).toContain("bg-[#050505]");
    expect(styles).toContain(".lunera-phone-depth-layer");
    expect(styles).toContain(".lunera-hero-cloud-blend");
    expect(styles).toContain(".open-spot-dashboard-card");
    expect(styles).toContain(".open-spot-setup-panel");
    expect(styles).toContain(".open-spot-setup-card");
    expect(styles).toContain("width: clamp(310px, 22.5vw, 385px)");
    expect(styles).toContain("rotateY(-5.5deg)");
    expect(styles).toContain("rotateZ(1.15deg)");
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

  it("replaces the setup workflow steps with the premium booking-system trust section", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const setupCopy = homepage.slice(
      homepage.indexOf("setup: {"),
      homepage.indexOf("how: {")
    );
    const setupSection = homepage.slice(
      homepage.indexOf("function SetupSection("),
      homepage.indexOf("function HowItWorks(")
    );
    const forbiddenSetupTerms = [
      "Fill the empty spots.",
      "Open Spot adds a simple SMS recovery layer",
      "steps:",
      "Spot opens",
      "SMS sent to waitlist",
      "Replies ranked",
      "You confirm manually",
      "{index + 1}",
      "workflow step",
      "step 1",
      "step 2",
      "step 3",
      "step 4",
      "confirmed automatically",
      "automatically confirmed",
      "first reply confirmed"
    ];

    expect(setupCopy).toContain('tag: "Simple setup"');
    expect(setupCopy).toContain('"Keep your booking system."');
    expect(setupCopy).toContain('"Recover the empty spots."');
    expect(setupCopy).toContain(
      "Open Spot works around your existing appointment workflow, so your team can fill last-minute cancellations without changing how clients already book."
    );
    expect(setupCopy).toContain("No migration needed");
    expect(setupCopy).toContain("Built for cancellations");
    expect(setupCopy).toContain("Clients reply by SMS");
    expect(setupCopy).toContain("You stay in control");
    expect(setupCopy).toContain("Keep using your current booking system. Open Spot only helps when a spot opens.");
    expect(setupCopy).toContain("Launch a targeted SMS alert when you have an empty appointment to fill.");
    expect(setupCopy).toContain("Interested clients answer directly from their phone. No app download required.");
    expect(setupCopy).toContain("Review the replies and manually choose who gets confirmed.");

    for (const term of forbiddenSetupTerms) {
      expect(setupCopy).not.toContain(term);
      expect(setupSection).not.toContain(term);
    }

    expect(setupSection).toContain("open-spot-setup-section");
    expect(setupSection).toContain("open-spot-setup-panel");
    expect(setupSection).toContain("open-spot-setup-grid");
    expect(setupSection).toContain("open-spot-setup-card");
    expect(setupSection).toContain("open-spot-setup-icon");
    expect(setupSection).toContain("<SetupIcon");
    expect(styles).toContain(".open-spot-setup-panel");
    expect(styles).toContain("max-width: min(100% - 4rem, 94rem)");
    expect(styles).toContain("border-radius: clamp(2rem, 3vw, 3.25rem)");
    expect(styles).toContain("padding: clamp(5.75rem, 7vw, 7.2rem) clamp(4rem, 5.8vw, 5.75rem) clamp(3.5rem, 5vw, 4.5rem)");
    expect(styles).toContain(".open-spot-setup-grid");
    expect(styles).toContain("grid-template-columns: repeat(4, minmax(0, 1fr))");
    expect(styles).toContain(".open-spot-setup-card:hover");
    expect(styles).toContain("transform: translateY(-6px) scale(1.01)");
    expect(styles).toContain("0 28px 90px rgba(37, 99, 235, 0.1)");
    expect(styles).toContain(".open-spot-setup-card:hover .open-spot-setup-icon");
  });

  it("uses premium human testimonial cards with local profile photos", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const testimonialCopy = homepage.slice(
      homepage.indexOf("testimonials: {"),
      homepage.indexOf("faq: {")
    );
    const testimonialSection = homepage.slice(
      homepage.indexOf("function Testimonials("),
      homepage.indexOf("function Faq(")
    );
    const testimonialImagePaths = [
      "public/testimonials/maya-salon-owner.webp",
      "public/testimonials/karim-barber-manager.webp",
      "public/testimonials/sophie-clinic-coordinator.webp",
      "public/testimonials/amelie-spa-receptionist.webp"
    ];
    const forbiddenTerms = [
      "Real results from local teams.",
      "SO",
      "BM",
      "BC",
      "SR",
      "Appointment-based team",
      "Verified customers",
      "Real clients",
      "Actual customer results"
    ];

    expect(testimonialCopy).toContain("What local teams say about Open Spot.");
    expect(testimonialCopy).toContain(
      "Human stories from appointment-based teams using consent-based SMS to recover last-minute cancellations while keeping final confirmation in their hands."
    );
    expect(testimonialCopy).toContain("Maya R.");
    expect(testimonialCopy).toContain("Salon owner");
    expect(testimonialCopy).toContain("Hair salon");
    expect(testimonialCopy).toContain("Color slot recovered");
    expect(testimonialCopy).toContain("Karim B.");
    expect(testimonialCopy).toContain("Barber shop manager");
    expect(testimonialCopy).toContain("Barber shop");
    expect(testimonialCopy).toContain("Empty chair filled");
    expect(testimonialCopy).toContain("Sophie L.");
    expect(testimonialCopy).toContain("Clinic coordinator");
    expect(testimonialCopy).toContain("Beauty clinic");
    expect(testimonialCopy).toContain("Late slot recovered");
    expect(testimonialCopy).toContain("Amélie T.");
    expect(testimonialCopy).toContain("Spa receptionist");
    expect(testimonialCopy).toContain("Manual review kept");
    expect(testimonialCopy).toContain("/testimonials/maya-salon-owner.webp");
    expect(testimonialCopy).toContain("/testimonials/karim-barber-manager.webp");
    expect(testimonialCopy).toContain("/testimonials/sophie-clinic-coordinator.webp");
    expect(testimonialCopy).toContain("/testimonials/amelie-spa-receptionist.webp");
    expect(testimonialSection).toContain("<Image");
    expect(testimonialSection).toContain("open-spot-testimonial-card");
    expect(testimonialSection).toContain("open-spot-testimonial-photo");
    expect(testimonialSection).toContain("open-spot-testimonial-badge");
    expect(testimonialSection).toContain("open-spot-testimonial-shine");
    expect(testimonialSection).not.toContain("initials");
    expect(testimonialSection).not.toContain("map(([");

    for (const term of forbiddenTerms) {
      expect(testimonialCopy).not.toContain(term);
      expect(testimonialSection).not.toContain(term);
    }

    for (const imagePath of testimonialImagePaths) {
      expect(existsSync(fileURLToPath(new URL(`../../${imagePath}`, import.meta.url)))).toBe(true);
    }

    expect(styles).toContain(".open-spot-testimonials-section");
    expect(styles).toContain(".open-spot-testimonial-card");
    expect(styles).toContain("transform: translateY(-8px) scale(1.012)");
    expect(styles).toContain("0 28px 80px rgba(37, 99, 235, 0.14)");
    expect(styles).toContain(".open-spot-testimonial-card:hover .open-spot-testimonial-photo");
    expect(styles).toContain("transform: scale(1.045)");
    expect(styles).toContain(".open-spot-testimonial-card:hover .open-spot-testimonial-badge");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("upgrades the FAQ with relevant professional answers and accessible premium accordion states", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const faqCopy = homepage.slice(
      homepage.indexOf("faq: {"),
      homepage.indexOf("final: {")
    );
    const faqSection = homepage.slice(
      homepage.indexOf("function Faq("),
      homepage.indexOf("function FinalCta(")
    );
    const requiredQuestions = [
      "Does Open Spot replace my booking system?",
      "How does Open Spot help fill a last-minute cancellation?",
      "Are clients confirmed automatically?",
      "Do clients need to download an app?",
      "How does Open Spot handle SMS consent?",
      "What happens if multiple clients reply?",
      "Can I start with a small client list?",
      "Is Open Spot a marketing SMS tool?",
      "Which businesses is Open Spot built for?",
      "How quickly can a team start using it?"
    ];
    const forbiddenFaqCopy = [
      "Questions before your first SMS sends.",
      "Open Spot keeps merchant control intact and respects SMS consent.",
      "No. It works beside your current system.",
      "No. Your team reviews replies and confirms manually.",
      "No. They reply by SMS.",
      "Open Spot is designed around consent-based messaging and STOP opt-out handling.",
      "Yes. You can start with a simple opted-in waitlist.",
      "fully compliant",
      "guarantees SMS compliance"
    ];

    expect(faqCopy).toContain('title: "Questions before your first open spot."');
    expect(faqCopy).toContain(
      "Everything local teams need to know before using consent-based SMS to recover last-minute cancellations."
    );
    expect((faqCopy.match(/question:/g) ?? []).length).toBe(10);
    for (const question of requiredQuestions) {
      expect(faqCopy).toContain(question);
    }
    expect(faqCopy).toContain("sit beside your existing booking system, not replace it");
    expect(faqCopy).toContain("service, time, and optional details");
    expect(faqCopy).toContain("final confirmation in the hands of the business");
    expect(faqCopy).toContain("regular SMS");
    expect(faqCopy).toContain("consent-based recovery, not cold texting or mass spam");
    expect(faqCopy).toContain("prevents the first reply from automatically taking the spot");
    expect(faqCopy).toContain("higher-value services like color, treatments, spa appointments, or longer bookings");
    expect(faqCopy).toContain("not meant to blast promotions or run generic SMS campaigns");
    expect(faqCopy).toContain("hair salons, barber shops, beauty clinics, spas, wellness studios");
    expect(faqCopy).toContain("without needing a complex setup or a full migration from existing tools");

    for (const term of forbiddenFaqCopy) {
      expect(faqCopy).not.toContain(term);
    }

    expect(faqSection).toContain("open-spot-faq-section");
    expect(faqSection).toContain("open-spot-faq-shell");
    expect(faqSection).toContain("open-spot-faq-panel");
    expect(faqSection).toContain("open-spot-faq-item");
    expect(faqSection).toContain('data-open={isOpen ? "true" : "false"}');
    expect(faqSection).toContain("open-spot-faq-trigger");
    expect(faqSection).toContain("aria-expanded={isOpen}");
    expect(faqSection).toContain("aria-controls={answerId}");
    expect(faqSection).toContain("id={answerId}");
    expect(faqSection).toContain('role="region"');
    expect(faqSection).toContain("open-spot-faq-icon");
    expect(faqSection).toContain("open-spot-faq-answer");
    expect(faqSection).toContain("open-spot-faq-answer-inner");
    expect(faqSection).not.toContain("map(([question, answer]");
    expect(faqSection).not.toContain("lunera-faq-answer");

    expect(styles).toContain(".open-spot-faq-item");
    expect(styles).toContain(".open-spot-faq-item:hover");
    expect(styles).toContain("transform: translateY(-3px)");
    expect(styles).toContain("0 22px 60px rgba(37, 99, 235, 0.1)");
    expect(styles).toContain('.open-spot-faq-item[data-open="true"]');
    expect(styles).toContain("0 28px 80px rgba(37, 99, 235, 0.12)");
    expect(styles).toContain(".open-spot-faq-icon");
    expect(styles).toContain('.open-spot-faq-item[data-open="true"] .open-spot-faq-icon');
    expect(styles).toContain("transform: rotate(45deg)");
    expect(styles).toContain(".open-spot-faq-answer");
    expect(styles).toContain("grid-template-rows: 0fr");
    expect(styles).toContain('.open-spot-faq-item[data-open="true"] .open-spot-faq-answer');
    expect(styles).toContain("grid-template-rows: 1fr");
    expect(styles).toContain(".open-spot-faq-trigger:focus-visible");
  });

  it("keeps hero social proof, CTA, and business marquee in an airy lower white flow", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const heroFunction = homepage.slice(
      homepage.indexOf("function Hero("),
      homepage.indexOf("function HeroPhoneMockup(")
    );
    const lowerFlowIndex = heroFunction.indexOf("lunera-hero-lower-content");
    const socialIndex = heroFunction.indexOf("<HeroSocialProof");
    const ctaIndex = heroFunction.indexOf("<HeroCtaRow");
    const marqueeIndex = heroFunction.indexOf("<CategoryStrip");

    expect(lowerFlowIndex).toBeGreaterThan(-1);
    expect(socialIndex).toBeGreaterThan(lowerFlowIndex);
    expect(socialIndex).toBeLessThan(ctaIndex);
    expect(ctaIndex).toBeLessThan(marqueeIndex);
    expect(heroFunction).not.toContain("pb-10 pt-24");

    expect(styles).toContain(".lunera-hero-lower-content");
    expect(styles).toContain(".lunera-hero-lower-content::before");
    expect(styles).toContain("min-height: clamp(66rem, 98vw, 76rem)");
    expect(styles).toContain("margin-top: clamp(4.25rem, 7vw, 6.75rem)");
    expect(styles).toContain("padding-bottom: clamp(6rem, 9vw, 8.5rem)");
    expect(styles).toContain("rgba(255, 255, 255, 0.96) 58%");
    expect(styles).toContain("margin-top: clamp(1.25rem, 2vw, 1.7rem)");
    expect(styles).toContain("gap: clamp(0.85rem, 1.4vw, 1.15rem)");
    expect(styles).toContain("margin-top: clamp(3.75rem, 5.8vw, 5.6rem)");
    expect(styles).toContain("margin-bottom: clamp(1.25rem, 2vw, 2rem)");
    expect(styles).toContain(".open-spot-category-marquee-track");
    expect(styles).toContain("animation: none !important");
  });

  it("uses the compact Lunera-style analytics grid and card visuals", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const metricsSection = homepage.slice(
      homepage.indexOf("function MetricsSection("),
      homepage.indexOf("function DashboardCard(")
    );
    const filledSpotsVisual = homepage.slice(
      homepage.indexOf("function FilledSpotsVisual("),
      homepage.indexOf("function SetupSection(")
    );

    expect(metricsSection).toContain("open-spot-metrics-section");
    expect(metricsSection).toContain("open-spot-metrics-heading");
    expect(metricsSection).toContain("open-spot-metrics-grid");
    expect(metricsSection).toContain("lg:grid-cols-12");
    expect(metricsSection).toContain('size="top"');
    expect(metricsSection).toContain('size="wide"');
    expect(metricsSection).toContain("lg:col-span-4");
    expect(metricsSection).toContain("lg:col-span-6");
    expect(homepage).toContain("open-spot-dashboard-card--top");
    expect(homepage).toContain("open-spot-dashboard-card--wide");
    expect(filledSpotsVisual).toContain("open-spot-gauge-ticks");
    expect(filledSpotsVisual).toContain("open-spot-gauge-tick");
    expect(filledSpotsVisual).toContain("Array.from({ length: 34 })");
    expect(styles).toContain(".open-spot-metrics-grid");
    expect(styles).toContain(".open-spot-dashboard-card--top");
    expect(styles).toContain(".open-spot-dashboard-card--wide");
    expect(styles).toContain("transform: translateY(-6px) scale(1.01)");
    expect(styles).toContain("0 28px 80px rgba(37, 99, 235, 0.1)");
    expect(styles).toContain(".open-spot-dashboard-card:hover .open-spot-dashboard-visual");
    expect(styles).toContain(".open-spot-gauge-tick");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("uses the premium How It Works reference layout and step cards", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const howSection = homepage.slice(
      homepage.indexOf("function HowItWorks("),
      homepage.indexOf("function StepMiniUi(")
    );
    const stepMiniUi = homepage.slice(
      homepage.indexOf("function StepMiniUi("),
      homepage.indexOf("function RevenueCalculatorSection(")
    );

    expect(homepage).toContain('"to confirmation—"');
    expect(homepage).not.toContain('"to confirmation -"');
    expect(howSection).toContain("open-spot-how-section");
    expect(howSection).toContain("open-spot-how-shell");
    expect(howSection).toContain("open-spot-how-title");
    expect(howSection).toContain("open-spot-how-title-nowrap");
    expect(howSection).not.toContain("border-l-4");
    expect(howSection).not.toContain("border-[#141414]");
    expect(howSection).toContain("open-spot-how-card");
    expect(howSection).toContain("open-spot-how-icon");
    expect(howSection).toContain("open-spot-how-step-number");
    expect(stepMiniUi).toContain("open-spot-how-alert-mockup");
    expect(stepMiniUi).toContain("open-spot-how-replies-mockup");
    expect(stepMiniUi).toContain("open-spot-how-confirm-mockup");
    expect(stepMiniUi).toContain("Spot opening detected");
    expect(stepMiniUi).toContain("Confirm Sarah");
    expect(homepage).toContain("confirm the appointment manually");
    expect(styles).toContain(".open-spot-how-shell");
    expect(styles).toContain("grid-template-columns: minmax(17rem, 0.85fr) minmax(0, 1.35fr)");
    expect(styles).toContain(".open-spot-how-card");
    expect(styles).toContain("height: 15rem");
    expect(styles).toContain(".open-spot-how-step-number");
    expect(styles).toContain("bottom: 1rem");
    expect(styles).toContain(".open-spot-how-card:hover");
    expect(styles).toContain("0 28px 90px rgba(37, 99, 235, 0.12)");
    expect(styles).toContain(".open-spot-how-card:hover .open-spot-how-mockup");
  });

  it("replaces the workflow preview with an interactive premium revenue calculator", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const mainMarkup = homepage.slice(homepage.indexOf("<main>"), homepage.indexOf("</main>"));
    const calculatorSection = homepage.slice(
      homepage.indexOf("function RevenueCalculatorSection("),
      homepage.indexOf("function Pricing(")
    );
    const forbiddenCalculatorTerms = [
      "Workflow",
      "Non-disruptive cancellation recovery",
      "Open Spot queue",
      "New cancellation",
      "Sarah M.",
      "Mike R.",
      "Jessica T.",
      "Consent-based SMS alerts",
      "Ranked reply queue for review",
      "Manual confirmation before any appointment is filled",
      "Works with your existing workflow",
      "No booking system migration",
      "My Cards",
      "Apple Store",
      "Spotify",
      "Secure payment",
      "Entertainment Spending",
      "New Sales from App Store",
      "Credit card",
      "Budgeting",
      "Investment",
      "Download App",
      "40K+ users worldwide",
      "automatically confirmed",
      "auto-confirmed",
      "first reply confirmed",
      "first client gets the appointment",
      "confirmed without review"
    ];

    expect(mainMarkup).toContain("<RevenueCalculatorSection");
    expect(mainMarkup).not.toContain("<WorkflowPreview");
    expect(homepage).not.toContain("function WorkflowPreview(");
    expect(homepage).not.toContain("workflow: {");
    expect(homepage).not.toContain("Consent-based SMS alerts");
    expect(homepage).not.toContain("Ranked reply queue for review");
    expect(homepage).not.toContain("Manual confirmation before any appointment is filled");
    expect(calculatorSection).toContain("useState(85)");
    expect(calculatorSection).toContain("useState(6)");
    expect(calculatorSection).toContain("useState(40)");
    expect(calculatorSection).toContain("averageServiceCost * lastMinuteSpots * 4");
    expect(calculatorSection).toContain("monthlyRevenueAtRisk * recoveryEstimate / 100");
    expect(calculatorSection).toContain("formatRevenueCurrency");
    expect(calculatorSection).toContain("SliderControl");
    expect(calculatorSection).toContain("MiniLineChart");
    expect(calculatorSection).toContain("ResultMetricCard");
    expect(calculatorSection).toContain("MiniStatItem");
    expect(calculatorSection).toContain("Revenue calculator");
    expect(calculatorSection).toContain("See what empty spots");
    expect(calculatorSection).toContain("are costing you.");
    expect(calculatorSection).toContain("Enter your average service price and the number of last-minute cancellations you usually lose. Open Spot estimates the revenue at risk and what you could recover.");
    expect(calculatorSection).toContain("Average service cost");
    expect(calculatorSection).toContain("Last-minute spots lost per week");
    expect(calculatorSection).toContain("Recovery estimate");
    expect(calculatorSection).toContain("Based on a");
    expect(calculatorSection).toContain("recovery estimate");
    expect(calculatorSection).toContain("Monthly revenue at risk");
    expect(calculatorSection).toContain("Recovered with Open Spot");
    expect(calculatorSection).toContain("Average service");
    expect(calculatorSection).toContain("Open spots / week");
    expect(calculatorSection).toContain("Manual confirmation");
    expect(calculatorSection).toContain("stays in your control");
    expect(calculatorSection).toContain('min={25}');
    expect(calculatorSection).toContain('max={200}');
    expect(calculatorSection).toContain('step={5}');
    expect(calculatorSection).toContain('min={1}');
    expect(calculatorSection).toContain('max={20}');
    expect(calculatorSection).toContain('min={10}');
    expect(calculatorSection).toContain('max={60}');
    expect(calculatorSection).toContain('"$25"');
    expect(calculatorSection).toContain('"$50"');
    expect(calculatorSection).toContain('"$100"');
    expect(calculatorSection).toContain('"$150"');
    expect(calculatorSection).toContain('"$200"');
    expect(calculatorSection).toContain('"10%"');
    expect(calculatorSection).toContain('"20%"');
    expect(calculatorSection).toContain('"30%"');
    expect(calculatorSection).toContain('"40%"');
    expect(calculatorSection).toContain('"50%"');
    expect(calculatorSection).toContain('"60%"');
    expect(calculatorSection).toContain('"--slider-progress"');
    expect(calculatorSection).toContain('type="range"');
    expect(calculatorSection).toContain("aria-label");
    expect(calculatorSection).toContain('aria-live="polite"');

    for (const term of forbiddenCalculatorTerms) {
      expect(calculatorSection).not.toContain(term);
    }

    expect(styles).toContain(".open-spot-revenue-section");
    expect(styles).toContain(".open-spot-revenue-shell");
    expect(styles).toContain("max-width: min(calc(100% - 48px), 1520px)");
    expect(styles).toContain("border-radius: clamp(2.75rem, 3.4vw, 3.5rem)");
    expect(styles).toContain("linear-gradient(180deg, rgba(248, 251, 255, 1) 0%, rgba(241, 247, 255, 0.92) 100%)");
    expect(styles).toContain(".open-spot-revenue-card");
    expect(styles).toContain("grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr)");
    expect(styles).toContain(".revenue-calculator-range");
    expect(styles).toContain("height: 0.5rem");
    expect(styles).toContain("height: 2rem");
    expect(styles).toContain("width: 2rem");
    expect(styles).toContain(".open-spot-revenue-card:hover");
    expect(styles).toContain("transform: translateY(-4px)");
    expect(styles).toContain(".open-spot-result-card:hover");
    expect(styles).toContain("transform: translateY(-2px)");
    expect(styles).toContain("@media (max-width: 767px)");
  });

  it("keeps the mobile sign-in CTA inside the floating navbar", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const compactHeaderStyles = styles.slice(styles.indexOf("@media (max-width: 520px)"));

    expect(homepage).toContain("w-[calc(100vw-1.5rem)]");
    expect(compactHeaderStyles).toContain('.lunera-template > header a[href="/sign-in"]');
    expect(compactHeaderStyles).toContain("position: static");
    expect(compactHeaderStyles).not.toContain("position: fixed");
    expect(styles).toContain("overflow-x: hidden");
  });

  it("uses the requested category strip instead of fake brand logos", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const expectedBusinessTypes = [
      "Barbers",
      "Beauty Clinics",
      "Hair Salons",
      "Spas",
      "Nail Studios",
      "Massage Studios",
      "Brows & Lashes",
      "Med Spas",
      "Wellness Clinics",
      "Tattoo Studios",
      "Physiotherapy Clinics",
      "Aesthetic Clinics"
    ];
    const oldPlaceholderTypes = [
      "Barbershops",
      "Massage Therapists",
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
    expect(homepage).toContain("open-spot-category-marquee");
    expect(homepage).toContain("aria-hidden=\"true\"");
    expect(homepage).toContain("Built for appointment-based teams");
    expect(homepage).not.toContain('logos: ["Salons", "Barbers"');
    expect(homepage).not.toContain("40K+ users worldwide");
    expect(homepage).not.toContain("Codecraft");
    expect(styles).toContain(".open-spot-category-marquee");
    expect(styles).toContain("@keyframes open-spot-category-marquee");
    expect(styles).toContain("animation: open-spot-category-marquee 38s linear infinite");
    expect(styles).toContain("mask-image");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("uses photographic social proof avatars instead of initials", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");

    expect(homepage).toContain("/lunera-style/avatars/review-1.jpg");
    expect(homepage).toContain("/lunera-style/avatars/review-2.jpg");
    expect(homepage).toContain("/lunera-style/avatars/review-3.jpg");
    expect(homepage).toContain("open-spot-social-avatar");
    expect(homepage).toContain("Five star social proof");
    expect(homepage).not.toContain('["SA", "MR", "JT", "AL"]');
    expect(styles).toContain(".open-spot-social-avatar");
    expect(styles).toContain("height: 2.52rem");
    expect(styles).toContain("margin-left: -0.58rem");
  });

  it("links sign-in and signup pages to each other", () => {
    expect(source("src/app/sign-in/page.tsx")).toContain('href="/signup"');
    expect(source("src/app/signup/page.tsx")).toContain('href="/sign-in"');
  });
});
