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
  const metricsShowcasePath = "src/components/marketing/open-spot-metrics-showcase.tsx";
  const bookingFlowPath = "src/components/marketing/booking-flow-section.tsx";

  it("renders the full Lunera landing as the public homepage and integrates the metrics showcase as a section", () => {
    const funnel = source("src/components/marketing/open-spot-funnel.tsx");
    const homepage = source(homepagePath);
    const metricsShowcase = source(metricsShowcasePath);
    const styles = source("src/app/globals.css");
    const mainMarkup = homepage.slice(homepage.indexOf("<main>"), homepage.indexOf("</main>"));

    expect(funnel).toContain("LuneraOpenSpotTemplate");
    expect(funnel).toContain("getRequestLocale");
    expect(funnel).not.toContain("getMarketingLocale");
    expect(funnel).not.toContain("localeCookieName");
    expect(funnel).not.toContain("OpenSpotMetricsShowcase");
    expect(funnel).toContain("locale={locale}");

    expect(mainMarkup).toContain("<Hero");
    expect(mainMarkup).toContain("<OpenSpotMetricsShowcase");
    expect(mainMarkup).toContain("<RevenueCalculatorSection");
    expect(mainMarkup).toContain("<BookingFlowSection");
    expect(mainMarkup).toContain("<SetupSection");
    expect(mainMarkup).toContain("<HowItWorks");
    expect(mainMarkup).toContain("<PersonalizedPricingSection");
    expect(mainMarkup).toContain("<Faq");
    expect(mainMarkup.indexOf("<Hero")).toBeLessThan(
      mainMarkup.indexOf("<OpenSpotMetricsShowcase")
    );
    expect(mainMarkup.indexOf("<OpenSpotMetricsShowcase")).toBeLessThan(
      mainMarkup.indexOf("<RevenueCalculatorSection")
    );
    expect(mainMarkup.indexOf("<RevenueCalculatorSection")).toBeLessThan(
      mainMarkup.indexOf("<BookingFlowSection")
    );
    expect(mainMarkup.indexOf("<BookingFlowSection")).toBeLessThan(
      mainMarkup.indexOf("<SetupSection")
    );
    expect(mainMarkup.indexOf("<SetupSection")).toBeLessThan(
      mainMarkup.indexOf("<HowItWorks")
    );

    expect(metricsShowcase).toContain("Open Spot metrics overview");
    expect(metricsShowcase).toContain("open-spot-metrics-showcase-page");
    expect(metricsShowcase).not.toContain("open-spot-metrics-floating-header");
    expect(metricsShowcase).toContain("open-spot-metrics-grid");
    expect(metricsShowcase).toContain("open-spot-metric-card--top");
    expect(metricsShowcase).toContain("open-spot-metric-card--wide");
    expect(metricsShowcase).toContain("grid-cols-1");
    expect(metricsShowcase).toContain("xl:grid-cols-12");
    expect(metricsShowcase).not.toContain("<Hero");
    expect(metricsShowcase).not.toContain("SmsConversationPhone");
    expect(metricsShowcase).not.toContain("HeroPhoneMockup");
    expect(metricsShowcase).not.toContain("LanguageSwitcher");
    expect(metricsShowcase).not.toContain('const loginHref = "/sign-in";');

    for (const requiredText of [
      "Real-Time Replies",
      "See who replied YES as soon as your waitlist responds.",
      "12",
      "people replied",
      "Revenue Saved",
      "Track how much revenue is recovered from filled last-minute openings.",
      "$8.3K",
      "This month",
      "Manual Confirmation",
      "Your team chooses who gets the appointment.",
      "No one is confirmed without review.",
      "Confirmation",
      "72%",
      "Average Fill Time",
      "See how quickly last-minute openings are filled after your SMS goes out.",
      "18",
      "min",
      "22% faster this week",
      "Successfully Filled Spots",
      "Track the number of cancelled appointments you've successfully filled.",
      "84",
      "filled spots",
      "18% this week"
    ]) {
      expect(metricsShowcase).toContain(requiredText);
    }

    expect(metricsShowcase).toContain("Réponses en temps réel");
    expect(metricsShowcase).toContain("Confirmation manuelle");
    expect(metricsShowcase).toContain("Créneaux remplis avec succès");
    expect(metricsShowcase).toContain('aria-hidden="true"');
    expect(metricsShowcase).toContain("RevenueLineChart");
    expect(metricsShowcase).toContain("ConfirmationRing");
    expect(metricsShowcase).toContain("FilledSpotsGauge");
    expect(metricsShowcase).toContain("Array.from({ length: 42 })");
    const restrictedHomepageTerms = [
      ["automatically", " confirmed"].join(""),
      ["confirmed", " automatically"].join(""),
      ["auto", "-confirm"].join(""),
      ["pay", "ment"].join(""),
      ["wal", "let"].join(""),
      ["cry", "pto"].join(""),
      ["credit", " card"].join(""),
      ["ba", "nk"].join("")
    ];

    for (const restrictedTerm of restrictedHomepageTerms) {
      expect(metricsShowcase).not.toContain(restrictedTerm);
    }

    expect(styles).toContain(".open-spot-metrics-showcase-page");
    expect(styles).toContain("background:");
    expect(styles).toContain(".open-spot-metric-card");
    expect(styles).toContain("border: 1px solid rgba(148, 163, 184, 0.26)");
    expect(styles).toContain(".open-spot-metric-card--top");
    expect(styles).toContain("min-height: 360px");
    expect(styles).toContain(".open-spot-metric-card--wide");
    expect(styles).toContain("min-height: 310px");
    expect(styles).toContain(".open-spot-filled-gauge-tick");
    expect(styles).toContain("@media (max-width: 767px)");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  it("adds the screenshot-matched booking flow compatibility section to the public homepage", () => {
    const homepage = source(homepagePath);
    const metricsShowcase = source(metricsShowcasePath);
    const bookingFlow = source(bookingFlowPath);
    const styles = source("src/app/globals.css");
    const mainMarkup = homepage.slice(homepage.indexOf("<main>"), homepage.indexOf("</main>"));

    expect(mainMarkup).toContain("<BookingFlowSection locale={locale} />");
    expect(metricsShowcase).not.toContain("BookingFlowSection");

    expect(bookingFlow).toContain("booking-flow-section");
    expect(bookingFlow).toContain('id="why-open-spot"');
    expect(bookingFlow).toContain('aria-labelledby="why-open-spot-title"');
    expect(bookingFlow).toContain('id="why-open-spot-title"');
    expect(bookingFlow).toContain("open-spot-booking-flow-dome");
    expect(bookingFlow).toContain("open-spot-booking-flow-stage");
    expect(bookingFlow).toContain("open-spot-booking-flow-card");
    expect(bookingFlow).toContain("open-spot-booking-flow-mobile-grid");

    for (const requiredText of [
      "Why Open Spot",
      "Works with the booking",
      "flow you already use.",
      "Open Spot fits around your existing appointment workflow so your team",
      "can fill last-minute cancellations without changing how clients already book.",
      "No migration",
      "needed",
      "Built for",
      "cancellations",
      "Clients reply",
      "by SMS",
      "You stay in",
      "control",
      "Pourquoi Open Spot",
      "Fonctionne avec le flux de réservation que vous utilisez déjà.",
      "Aucune migration",
      "nécessaire",
      "Conçu pour les",
      "annulations",
      "Les clients répondent",
      "par SMS",
      "Vous gardez le",
      "contrôle"
    ]) {
      expect(bookingFlow).toContain(requiredText);
    }

    for (const cardClass of [
      "open-spot-booking-flow-card--migration",
      "open-spot-booking-flow-card--cancellations",
      "open-spot-booking-flow-card--sms",
      "open-spot-booking-flow-card--control"
    ]) {
      expect(styles).toContain(`.${cardClass}`);
    }

    for (const restrictedTerm of [
      ["automatically", " confirmed"].join(""),
      ["confirmed", " automatically"].join(""),
      ["auto", "-confirm"].join(""),
      ["first", " reply"].join(""),
      ["pay", "ment"].join(""),
      ["wal", "let"].join(""),
      ["cry", "pto"].join(""),
      ["credit", " card"].join(""),
      ["ba", "nk"].join("")
    ]) {
      expect(bookingFlow).not.toContain(restrictedTerm);
    }

    expect(styles).toContain(".open-spot-booking-flow-section");
    expect(bookingFlow).toContain("bg-[#fbfdff]");
    expect(styles).toContain(".open-spot-booking-flow-dome");
    expect(styles).toContain("radial-gradient(ellipse at 50% 0%");
    expect(styles).toContain("top: 32rem");
    expect(styles).toContain("max-width: 54rem");
    expect(styles).toContain("--card-rotation");
    expect(styles).toContain("transform: rotate(var(--card-rotation))");
    expect(styles).toContain(".open-spot-booking-flow-card--migration");
    expect(styles).toContain("--card-rotation: -18deg");
    expect(styles).toContain(".open-spot-booking-flow-card--sms");
    expect(styles).toContain("--card-rotation: 7deg");
    expect(styles).toContain(".open-spot-booking-flow-mobile-grid");
    expect(styles).toContain("@media (max-width: 1023px)");
  });

  it("keeps the homepage header minimal for Lunera-style parity", () => {
    const homepage = source(homepagePath);

    expect(homepage).toContain('const loginHref = "/sign-in"');
    expect(homepage).toContain('features: "Features"');
    expect(homepage).toContain('how: "How it works"');
    expect(homepage).toContain('pricing: "Pricing"');
    expect(homepage).toContain('contact: "Contact"');
    expect(homepage).toContain('primary: "Log in"');
    expect(homepage).toContain("Se connecter");
    expect(homepage).not.toContain("Get Early Access");
    expect(homepage).toContain('const getStartedHref = "/signup"');
    expect(homepage).toContain('const bookCallHref = "/book-call"');
    expect(homepage).toContain("const contactHref = bookCallHref");
    expect(homepage).toContain("LanguageSwitcher");
    expect(homepage).toContain('initialLocale={locale}');
    expect(homepage).not.toContain('login: "Connexion"');
    expect(homepage).not.toContain('resources: "Guides"');
    expect(homepage).not.toContain('tools: "Tools"');
  });

  it("uses the Open Spot brand in bilingual public landing copy", () => {
    const homepage = source(homepagePath);
    const rootLayout = source("src/app/layout.tsx");
    const bookingPage = source("src/components/marketing/open-spot-booking-page.tsx");
    const consentSmsSource = source("src/lib/sms/message-generator.ts");

    expect(homepage).toContain("Open Spot");
    expect(homepage).not.toContain("2e Chance RDV");
    expect(homepage).toContain("Fill last-minute");
    expect(homepage).toContain("cancellations by SMS.");
    expect(homepage).toContain("Comblez les annulations");
    expect(homepage).toContain("de dernière minute par SMS.");
    expect(homepage).toContain(
      "Open Spot alerts interested clients, collects replies, and lets your team choose who to confirm"
    );
    expect(homepage).toContain(
      "Open Spot alerte les clients intéressés, recueille les réponses et laisse votre équipe choisir qui confirmer"
    );
    expect(homepage).not.toContain("ranks replies");
    expect(homepage).not.toContain("classe les reponses");
    expect(homepage).toContain("Manual Confirmation");
    expect(homepage).toContain("Confirmation manuelle");
    expect(homepage).toContain("No one is confirmed without review");
    expect(rootLayout).toContain("Open Spot");
    expect(rootLayout).not.toContain("2e Chance RDV");
    expect(bookingPage).toContain("Open Spot");
    expect(bookingPage).not.toContain("2e Chance RDV");
    expect(consentSmsSource).toContain("Open Spot");
    expect(consentSmsSource).not.toContain("2e Chance RDV");
  });

  it("replaces fixed pricing tiers with the personalized call pricing section", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const pricingPage = source("src/app/pricing/page.tsx");
    const productRequirements = source("docs/product-requirements.md");
    const fixedPricePattern = /34[,.]99|\$34|CAD 34\.99/i;

    expect(homepage).not.toMatch(fixedPricePattern);
    expect(pricingPage).not.toMatch(fixedPricePattern);
    expect(productRequirements).not.toMatch(fixedPricePattern);
    expect(homepage).not.toContain("$0 / mo");
    expect(homepage).not.toContain("$49 / mo");
    expect(homepage).not.toContain("Best Deal");
    expect(homepage).not.toContain("Starter");
    expect(homepage).not.toContain("Growth");
    expect(homepage).not.toContain("Scale");
    expect(homepage).toContain("Personalized pricing for");
    expect(homepage).toContain("every appointment business.");
    expect(homepage).toContain("Every team has different needs. Book a call and we'll walk you through Open Spot");
    expect(homepage).toContain("Let's find the");
    expect(homepage).toContain("right setup");
    expect(homepage).toContain("Personalized setup recommendations");
    expect(homepage).toContain("SMS volume matched to your needs");
    expect(homepage).toContain("Workflow tailored to your business");
    expect(homepage).toContain("Tell us about your business and");
    expect(homepage).toContain("we'll recommend the best setup.");
    expect(homepage).toContain("Single location or multi-location");
    expect(homepage).toContain("Low or high SMS volume");
    expect(homepage).toContain("Custom rollout support");
    expect(homepage).toContain('aria-label="Book a call about Open Spot pricing"');
    expect(homepage).toContain('primaryHref: "/book-call"');
    expect(homepage).toContain("href={t.pricing.primaryHref}");
    expect(homepage).toContain('href="/book-call"');
    expect(homepage).not.toContain('href="/contact"');
    expect(homepage).not.toContain('secondaryHref: "/contact"');
    expect(homepage).not.toContain('aria-label="Contact sales about Open Spot pricing"');
    expect(homepage).toContain("function PersonalizedPricingSection(");
    expect(styles).toContain(".open-spot-personalized-pricing");
    expect(styles).toContain("scroll-margin-top: 7rem");
    expect(styles).toContain(".open-spot-pricing-panel");
    expect(styles).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 1fr)");
    expect(styles).toContain("border-radius: clamp(1.75rem, 2.1vw, 2.125rem)");
    expect(styles).toContain("0 28px 80px rgba(15, 23, 42, 0.06)");
    expect(styles).toContain(".open-spot-pricing-panel:hover");
    expect(styles).toContain(".open-spot-pricing-option:hover");
    expect(styles).toContain(".open-spot-pricing-primary:hover .open-spot-pricing-arrow");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
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
      "Secure & compliant",
      "Automatically confirmed",
      "auto-confirmation",
      "first reply wins"
    ];

    for (const term of forbiddenTerms) {
      expect(combinedVisibleSource).not.toContain(term);
    }
  });

  it("renders the requested reference homepage hero and landing sections in order", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const mainMarkup = homepage.slice(homepage.indexOf("<main>"), homepage.indexOf("</main>"));
    const heroFunction = homepage.slice(
      homepage.indexOf("function Hero("),
      homepage.indexOf("function MetricsSection(")
    );
    const requiredOrder = [
      "<Hero",
      "<OpenSpotMetricsShowcase",
      "<RevenueCalculatorSection",
      "<BookingFlowSection",
      "<SetupSection",
      "<HowItWorks",
      "<PersonalizedPricingSection",
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
    expect(heroFunction).toContain("reference-hero-section");
    expect(heroFunction).toContain("<ReferenceHeroStage");
    expect(heroFunction).toContain("reference-phone-fade");
    expect(heroFunction).toContain("<TrustRow");
    expect(heroFunction).toContain("<HeroActions");
    expect(heroFunction).not.toContain("<SmsConversationPhone");
    expect(heroFunction).not.toContain("<HeroPhoneMockup");
    expect(heroFunction).not.toContain("<HeroCloudBlend");
    expect(homepage).toContain("Send waitlist alert");
    expect(homepage).toContain("$840");
    expect(homepage).toContain("Revenue saved this month");
    expect(homepage).toContain("12 replies");
    expect(homepage).toContain("Clients responded");
    expect(homepage).toContain("Confirm manually");
    expect(homepage).toContain("Cancellation detected");
    expect(homepage).toContain("SMS to waitlist (156 people)");
    expect(homepage).toContain("Reply queue");
    expect(homepage).toContain("Sophie M.");
    expect(homepage).toContain("Ava L.");
    expect(homepage).toContain("Jordan K.");
    expect(homepage).toContain("Trusted by clinics, salons & studios");
    expect(homepage).toContain("Get started");
    expect(homepage).toContain("Book a call");
    expect(homepage).toContain("Keep your booking system.");
    expect(homepage).toContain("Recover the empty spots.");
    expect(homepage).toContain("From cancellation");
    expect(homepage).toContain("to confirmation");
    expect(homepage).toContain("Estimate the revenue");
    expect(homepage).toContain("you could recover");
    expect(homepage).not.toContain("Non-disruptive cancellation recovery");
    expect(homepage).toContain("What local teams say about Open Spot.");
    expect(homepage).toContain("Ce que les équipes locales disent d'Open Spot.");
    expect(homepage).toContain("Ready to recover your next cancellation?");
    expect(homepage).toContain("SMS consent");
    expect(homepage).toContain("bg-[#050505]");
    expect(styles).toContain(".reference-navbar-shell");
    expect(styles).toContain(".reference-hero-section");
    expect(styles).toContain(".reference-hero-cloud");
    expect(styles).toContain(".reference-phone");
    expect(styles).toContain(".reference-dynamic-island");
    expect(styles).toContain(".reference-revenue-card");
    expect(styles).toContain(".reference-replies-card");
    expect(styles).toContain(".reference-pill-confirm");
    expect(styles).toContain(".reference-trust-row");
    expect(styles).toContain(".reference-cta-primary");
    expect(styles).toContain(".open-spot-dashboard-card");
    expect(styles).toContain(".open-spot-setup-panel");
    expect(styles).toContain(".open-spot-setup-card");
    expect(homepage).not.toContain("setScrollProgress");
    expect(homepage).not.toContain("Automatically confirmed");
    expect(homepage).not.toContain("auto-confirmation");
    expect(homepage).not.toContain("first reply wins");
  });

  it("keeps the Lunera landing dictionaries distinct across English and French", () => {
    const homepage = source(homepagePath);

    expect(homepage).toContain("const openSpotFrCopy");
    expect(homepage).toContain("copy = {");
    expect(homepage).toContain("en: openSpotCopy");
    expect(homepage).toContain("fr: openSpotFrCopy");
    expect(homepage).toContain("Average service price");
    expect(homepage).toContain("Coût moyen du service");
    expect(homepage).toContain("Potential recovered revenue");
    expect(homepage).toContain("Revenu potentiel récupéré");
    expect(homepage).toContain("Create open spot");
    expect(homepage).toContain("Créer un créneau");
    expect(homepage).toContain("Replies received");
    expect(homepage).toContain("Réponses reçues");
    expect(homepage).toContain("Manual review");
    expect(homepage).toContain("Révision manuelle");
    expect(homepage).toContain("Confirm client");
    expect(homepage).toContain("Confirmer le client");
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
    expect(phone).toContain("Reply received");
    expect(phone).toContain("Mike R.");
    expect(phone).toContain("Yes, I");
    expect(phone).toContain("Available");
    expect(phone).toContain("Jessica T.");
    expect(phone).toContain("Interested");
    expect(phone).toContain("To confirm");
    expect(phone).toContain("Confirm Sarah M.");
    expect(phone).toContain("View all replies");
    expect(phone).toContain("SMS reply queue and manual merchant confirmation");
    expect(phone).not.toContain("Best match");
    expect(phone).not.toContain("90% match");
    expect(phone).not.toContain("80% match");
    expect(phone).not.toContain("+35 fit");
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
      "Does Open Spot confirm clients for me?",
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
    expect(faqCopy).toContain("keeps the decision with your team when another client may be a better match");
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

  it("links the footer Product column to the existing FAQ anchor with scroll offset", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");

    expect(homepage).toContain('["Product", "Features", "How it works", "Pricing", "FAQ"]');
    expect(homepage).toContain('["Produit", "Fonctionnalités", "Comment ça marche", "Prix", "FAQ"]');
    expect(homepage).toContain('if (normalized === "faq") return "#faq";');
    expect(homepage).toContain('<section className="open-spot-faq-section" id="faq">');

    const faqSectionStyles = styles.slice(
      styles.indexOf(".open-spot-faq-section"),
      styles.indexOf(".open-spot-faq-shell")
    );

    expect(faqSectionStyles).toContain("scroll-margin-top: 7rem");
  });

  it("keeps the reference hero proof row and CTAs in the lower white flow", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const heroFunction = homepage.slice(
      homepage.indexOf("function Hero("),
      homepage.indexOf("function ReferenceHeroStage(")
    );
    const fadeIndex = heroFunction.indexOf("reference-phone-fade");
    const footerIndex = heroFunction.indexOf("reference-hero-footer");
    const socialIndex = heroFunction.indexOf("<TrustRow");
    const ctaIndex = heroFunction.indexOf("<HeroActions");

    expect(fadeIndex).toBeGreaterThan(-1);
    expect(footerIndex).toBeGreaterThan(fadeIndex);
    expect(socialIndex).toBeGreaterThan(footerIndex);
    expect(socialIndex).toBeLessThan(ctaIndex);
    expect(heroFunction).not.toContain("lunera-hero-lower-content");

    expect(styles).toContain(".reference-phone-fade");
    expect(styles).toContain(".reference-hero-footer");
    expect(styles).toContain(".reference-avatar-stack");
    expect(styles).toContain(".reference-stars");
    expect(styles).toContain(".reference-hero-actions");
    expect(styles).toContain(".reference-cta-primary");
    expect(styles).toContain(".reference-cta-secondary");
  });

  it("uses the premium integrated metrics showcase grid and card visuals", () => {
    const homepage = source(homepagePath);
    const metricsShowcase = source(metricsShowcasePath);
    const styles = source("src/app/globals.css");

    expect(homepage).toContain("<OpenSpotMetricsShowcase locale={locale} />");
    expect(homepage).not.toContain("function MetricsSection(");
    expect(metricsShowcase).toContain("open-spot-metrics-showcase-page");
    expect(metricsShowcase).toContain("open-spot-metrics-grid");
    expect(metricsShowcase).toContain("xl:grid-cols-12");
    expect(metricsShowcase).toContain("open-spot-metric-card--top");
    expect(metricsShowcase).toContain("open-spot-metric-card--wide");
    expect(metricsShowcase).toContain("RevenueLineChart");
    expect(metricsShowcase).toContain("ConfirmationRing");
    expect(metricsShowcase).toContain("FilledSpotsGauge");
    expect(metricsShowcase).toContain("Array.from({ length: 42 })");
    expect(styles).toContain(".open-spot-metrics-grid");
    expect(styles).toContain(".open-spot-metrics-showcase-page .open-spot-metric-card");
    expect(styles).toContain(".open-spot-metric-card--top");
    expect(styles).toContain(".open-spot-metric-card--wide");
    expect(styles).toContain(".open-spot-filled-gauge-tick");
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
    expect(stepMiniUi).toContain("t.how.mockups.detected");
    expect(stepMiniUi).toContain("t.how.mockups.confirm");
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

  it("centers the confirmation client initials inside the avatar circle", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const stepMiniUi = homepage.slice(
      homepage.indexOf("function StepMiniUi("),
      homepage.indexOf("function RevenueCalculatorSection(")
    );
    const confirmAvatarStyles = styles.slice(
      styles.indexOf(".open-spot-how-confirm-avatar"),
      styles.indexOf(".open-spot-how-confirm-button")
    );

    expect(stepMiniUi).toContain("open-spot-how-confirm-avatar");
    expect(stepMiniUi).toContain("SM");
    expect(stepMiniUi).toContain("Sarah M.");
    expect(stepMiniUi).toContain("t.how.mockups.confirm");

    expect(confirmAvatarStyles).toContain("align-items: center");
    expect(confirmAvatarStyles).toContain("justify-content: center");
    expect(confirmAvatarStyles).toContain("border-radius: 999px");
    expect(confirmAvatarStyles).toContain("height: 2.32rem");
    expect(confirmAvatarStyles).toContain("width: 2.32rem");
    expect(confirmAvatarStyles).toContain("line-height: 1");
    expect(confirmAvatarStyles).toContain("flex-shrink: 0");
    expect(styles).toContain(".open-spot-how-confirm-person .open-spot-how-confirm-avatar");
    expect(confirmAvatarStyles).not.toContain("position: absolute");
    expect(confirmAvatarStyles).not.toContain("top:");
    expect(confirmAvatarStyles).not.toContain("left:");
    expect(confirmAvatarStyles).not.toContain("margin-");
  });

  it("replaces the workflow preview with an interactive premium revenue calculator", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const revenueCalculator = source("src/lib/marketing/revenue-calculator.ts");
    const mainMarkup = homepage.slice(homepage.indexOf("<main>"), homepage.indexOf("</main>"));
    const calculatorSection = homepage.slice(
      homepage.indexOf("function RevenueCalculatorSection("),
      homepage.indexOf("function PersonalizedPricingSection(")
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
    expect(calculatorSection).toContain("useState(110)");
    expect(calculatorSection).toContain("useState(4)");
    expect(calculatorSection).toContain("useState(30)");
    expect(revenueCalculator).toContain("averageServicePrice * lostSpotsPerWeek * 4");
    expect(revenueCalculator).toContain("monthlyRevenueAtRisk * (recoveryRate / 100)");
    expect(calculatorSection).toContain("calculateRevenueEstimate");
    expect(calculatorSection).toContain("formatRevenueAmount");
    expect(calculatorSection).toContain("RevenueSlider");
    expect(calculatorSection).toContain("ResultMetricCard");
    expect(calculatorSection).toContain("open-spot-revenue-note");
    expect(calculatorSection).toContain("t.revenue.badge");
    expect(homepage).toContain("Estimez le revenu que");
    expect(calculatorSection).toContain("t.revenue.subtitle");
    expect(calculatorSection).toContain("t.revenue.averageServiceCost");
    expect(calculatorSection).toContain("t.revenue.lostPerWeek");
    expect(calculatorSection).toContain("t.revenue.recoveryEstimate");
    expect(calculatorSection).toContain("t.revenue.notePrefix");
    expect(calculatorSection).toContain("t.revenue.noteSuffix");
    expect(calculatorSection).toContain("t.revenue.recoveredRevenue");
    expect(calculatorSection).toContain("t.revenue.monthlyAtRiskBeforeRecovery");
    expect(calculatorSection).not.toContain("t.revenue.trustNote");
    expect(calculatorSection).toContain("t.revenue.primaryCta");
    expect(calculatorSection).toContain("t.revenue.secondaryCta");
    expect(calculatorSection).toContain('min={25}');
    expect(calculatorSection).toContain('max={200}');
    expect(calculatorSection).toContain('step={5}');
    expect(calculatorSection).toContain('min={1}');
    expect(calculatorSection).toContain('max={20}');
    expect(calculatorSection).toContain('min={10}');
    expect(calculatorSection).toContain('max={100}');
    expect(calculatorSection).toContain('"$25"');
    expect(calculatorSection).toContain('"$50"');
    expect(calculatorSection).toContain('"$100"');
    expect(calculatorSection).toContain('"$150"');
    expect(calculatorSection).toContain('"$200"');
    expect(calculatorSection).toContain('"10 %"');
    expect(calculatorSection).toContain('"25 %"');
    expect(calculatorSection).toContain('"50 %"');
    expect(calculatorSection).toContain('"75 %"');
    expect(calculatorSection).toContain('"100 %"');
    expect(calculatorSection).toContain('"--slider-progress"');
    expect(calculatorSection).toContain('type="range"');
    expect(calculatorSection).toContain("aria-label");
    expect(calculatorSection).toContain("aria-valuemax={max}");
    expect(calculatorSection).toContain("aria-valuemin={min}");
    expect(calculatorSection).toContain("aria-valuenow={value}");
    expect(calculatorSection).toContain("aria-valuetext={displayValue}");
    expect(calculatorSection).toContain("onInput");
    expect(calculatorSection).toContain("onPointerDown");
    expect(calculatorSection).toContain("onPointerMove");
    expect(calculatorSection).toContain("onPointerUp");
    expect(calculatorSection).toContain('aria-live="polite"');
    expect(homepage).not.toContain(
      "Estimation basÃ©e sur vos donnÃ©es. Les rÃ©sultats rÃ©els varient selon vos clients, vos services et votre volume d'annulations."
    );

    for (const term of forbiddenCalculatorTerms) {
      expect(calculatorSection).not.toContain(term);
    }

    expect(styles).toContain(".open-spot-revenue-section");
    expect(styles).toContain(".open-spot-revenue-shell");
    expect(styles).toContain("radial-gradient(circle at 50% 100%, rgba(74, 139, 255, 0.16), transparent 38rem)");
    expect(styles).toContain("max-width: min(calc(100% - 32px), 76rem)");
    expect(styles).toContain("border-radius: clamp(1.75rem, 3vw, 2.35rem)");
    expect(styles).toContain(".open-spot-revenue-card");
    expect(styles).toContain("grid-template-columns: minmax(0, 1.25fr) minmax(20rem, 0.9fr)");
    const rangeStyles = styles.slice(
      styles.indexOf(".revenue-calculator-range"),
      styles.indexOf(".open-spot-slider-ticks")
    );

    expect(styles).toContain(".revenue-slider-native");
    expect(styles).toContain(".open-spot-slider-marker");
    expect(styles).toContain("width: 3px");
    expect(rangeStyles).toContain("-webkit-tap-highlight-color: transparent");
    expect(rangeStyles).toContain("touch-action: pan-y");
    expect(rangeStyles).toContain("width: 44px");
    expect(rangeStyles).toContain("height: 44px");
    expect(rangeStyles).not.toContain(".open-spot-slider-input-wrap:focus-within");
    expect(styles).toContain("color: #071126");
    expect(styles).toContain("letter-spacing: -0.04em");
    expect(styles).not.toContain(".open-spot-result-note");
    expect(styles).toContain(".open-spot-result-primary");
    expect(styles).toContain(".open-spot-result-secondary");
    expect(styles).toContain("@media (max-width: 767px)");
  });

  it("keeps the mobile sign-in CTA inside the floating navbar", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
    const compactHeaderStyles = styles.slice(styles.indexOf("@media (max-width: 767px)"));

    expect(homepage).toContain("reference-navbar");
    expect(homepage).toContain("reference-mobile-menu");
    expect(homepage).toContain('href={loginHref}');
    expect(compactHeaderStyles).toContain(".reference-mobile-menu");
    expect(compactHeaderStyles).toContain("display: none");
    expect(compactHeaderStyles).toContain(".reference-nav-links");
    expect(compactHeaderStyles).toContain("display: none");
    expect(styles).toContain("overflow-x: hidden");
  });

  it("prevents French navbar and hero phone badge text from overflowing", () => {
    const styles = source("src/app/globals.css");
    const navbarStyles = styles.slice(
      styles.indexOf(".reference-navbar-shell"),
      styles.indexOf(".reference-mobile-menu")
    );
    const floatingStyles = styles.slice(
      styles.indexOf(".reference-floating-pill"),
      styles.indexOf(".reference-phone-fade")
    );
    const mobileStyles = styles.slice(styles.indexOf("@media (max-width: 767px)"));

    expect(navbarStyles).toContain("max-width: min(1040px, calc(100vw - 32px))");
    expect(navbarStyles).toContain("min-width: 0");
    expect(navbarStyles).toContain("flex-shrink: 0");
    expect(navbarStyles).not.toContain("width: 92px");
    expect(navbarStyles).not.toContain("width: 84px");

    expect(floatingStyles).toContain("white-space: normal");
    expect(floatingStyles).toContain("overflow-wrap: anywhere");
    expect(floatingStyles).toContain("min-width: 0");
    expect(floatingStyles).toContain("max-width:");
    expect(floatingStyles).not.toContain("white-space: nowrap");

    expect(mobileStyles).toContain(".reference-floating-pill span");
    expect(mobileStyles).toContain("max-width: 100%");
    expect(mobileStyles).toContain("width: min(100%, 13.5rem)");
  });

  it("matches the mobile reference hero with a controlled phone scene", () => {
    const styles = source("src/app/globals.css");
    const mobileStyles = styles.slice(styles.indexOf("@media (max-width: 767px)"));

    expect(mobileStyles).toContain(".reference-navbar {");
    expect(mobileStyles).toContain("top: 24px");
    expect(mobileStyles).toContain(".reference-navbar-shell {");
    expect(mobileStyles).toContain("height: 76px");
    expect(mobileStyles).toContain("border-radius: 999px");

    expect(mobileStyles).toContain(".reference-hero-section {");
    expect(mobileStyles).toContain("min-height: 1680px");
    expect(mobileStyles).toContain("padding-top: 158px");

    expect(mobileStyles).toContain(".reference-hero-stage {");
    expect(mobileStyles).toContain("height: 705px");
    expect(mobileStyles).toContain("overflow: visible");
    expect(mobileStyles).toContain("position: relative");

    expect(mobileStyles).toContain(".reference-phone {");
    expect(mobileStyles).toContain("position: absolute");
    expect(mobileStyles).toContain("left: calc(50% - min(42.5vw, 165px))");
    expect(mobileStyles).toContain("transform: none");
    expect(mobileStyles).toContain("width: min(85vw, 330px)");

    expect(mobileStyles).toContain(".reference-floating-pill,");
    expect(mobileStyles).toContain(".reference-floating-card {");
    expect(mobileStyles).toContain("position: absolute");
    expect(mobileStyles).toContain("z-index: 24");

    expect(mobileStyles).toContain(".reference-phone-fade {");
    expect(mobileStyles).toContain("display: block");
    expect(mobileStyles).toContain("top: 885px");

    expect(mobileStyles).toContain(".reference-hero-footer {");
    expect(mobileStyles).toContain("position: absolute");
    expect(mobileStyles).toContain("top: 1198px");

    expect(mobileStyles).toContain(".reference-trust-row {");
    expect(mobileStyles).toContain("flex-direction: row");

    expect(mobileStyles).toContain(".reference-hero-actions {");
    expect(mobileStyles).toContain("flex-direction: column");
    expect(mobileStyles).toContain("width: min(342px, calc(100vw - 48px))");
  });

  it("uses a long blue-to-white gradient before the Why Open Spot section", () => {
    const styles = source("src/app/globals.css");
    const bookingFlowStyles = styles.slice(
      styles.indexOf(".open-spot-booking-flow-section"),
      styles.indexOf(".open-spot-booking-flow-dome")
    );

    expect(bookingFlowStyles).toContain("#eef6ff 0%");
    expect(bookingFlowStyles).toContain("#f8fbff 34%");
    expect(bookingFlowStyles).toContain("#ffffff 76%");
    expect(bookingFlowStyles).toContain("#fbfdff 100%");
    expect(bookingFlowStyles).not.toContain("#ffffff 45%");
  });

  it("uses the requested reference hero proof and CTA copy instead of fake brand logos", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");
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

    for (const businessType of oldPlaceholderTypes) {
      expect(homepage).not.toContain(businessType);
    }

    expect(homepage).toContain("Trusted by clinics, salons & studios");
    expect(homepage).toContain("Adopte par des cliniques, salons et studios");
    expect(homepage).toContain("Get started");
    expect(homepage).toContain("Commencer");
    expect(homepage).toContain("Book a call");
    expect(homepage).toContain("Reserver un appel");
    expect(homepage).toContain("reference-avatar-stack");
    expect(homepage).toContain("reference-stars");
    expect(homepage).toContain("aria-hidden=\"true\"");
    expect(homepage).not.toContain("CategoryStrip");
    expect(homepage).not.toContain("open-spot-category-marquee");
    expect(homepage).not.toContain('logos: ["Salons", "Barbers"');
    expect(homepage).not.toContain("40K+ users worldwide");
    expect(homepage).not.toContain("Codecraft");
    expect(styles).toContain(".reference-avatar-stack");
    expect(styles).toContain(".reference-stars");
    expect(styles).toContain(".reference-hero-actions");
    expect(styles).toContain(".reference-cta-primary");
    expect(styles).toContain(".reference-cta-secondary");
    expect(styles).toContain("prefers-reduced-motion: reduce");
  });

  it("uses photographic social proof avatars instead of initials", () => {
    const homepage = source(homepagePath);
    const styles = source("src/app/globals.css");

    expect(homepage).toContain("/testimonials/sophie-clinic-coordinator.webp");
    expect(homepage).toContain("/testimonials/amelie-spa-receptionist.webp");
    expect(homepage).toContain("/testimonials/karim-barber-manager.webp");
    expect(homepage).toContain("open-spot-social-avatar");
    expect(homepage).toContain("Five star social proof");
    expect(homepage).not.toContain('["SA", "MR", "JT", "AL"]');
    expect(styles).toContain(".reference-avatar-stack img");
    expect(styles).toContain("height: 52px");
    expect(styles).toContain("margin-left: -12px");
  });

  it("links sign-in and signup pages to each other", () => {
    expect(source("src/app/sign-in/page.tsx")).toContain('href="/signup"');
    expect(source("src/app/signup/page.tsx")).toContain('href="/sign-in"');
  });

  it("keeps the sign-in page focused on authentication without the promo control card", () => {
    const signInPage = source("src/app/sign-in/page.tsx");

    expect(signInPage).toContain("signInAction");
    expect(signInPage).toContain('href="/signup"');
    expect(signInPage).toContain('<FormField htmlFor="email"');
    expect(signInPage).toContain('<Input id="email"');
    expect(signInPage).toContain('<FormField htmlFor="password"');
    expect(signInPage).toContain('<Button className="w-full" type="submit">');

    expect(signInPage).not.toContain("panelTitle");
    expect(signInPage).not.toContain("panelItems");
    expect(signInPage).not.toContain("Votre commerce garde le contr");
    expect(signInPage).not.toContain("Your business stays in control");
    expect(signInPage).not.toContain("Replies ranked by time");
    expect(signInPage).not.toContain("Clients consentants seulement");
    expect(signInPage).not.toContain('variant="dark"');
    expect(signInPage).not.toContain("bg-white/10");
  });
});
