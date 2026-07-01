import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const width = 432;
const height = 768;

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 2,
  isMobile: true
});
await page.context().addCookies([
  { name: "open_spot_locale", value: "fr", domain: "localhost", path: "/" }
]);
await page.setExtraHTTPHeaders({ "Accept-Language": "fr" });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await mkdir("/workspace/tmp", { recursive: true });
await page.screenshot({ path: "/workspace/tmp/mobile-hero-fr-432.png", fullPage: false });

const metrics = await page.evaluate(() => {
  const pick = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      bottom: Math.round(rect.bottom)
    };
  };

  return {
    headerCard: pick(".landing-site-header-card"),
    title: pick(".reference-hero-title"),
    subtitle: pick(".reference-hero-subtitle"),
    phone: pick(".reference-phone"),
    gradient: pick(".reference-mobile-hero-gradient"),
    trust: pick(".reference-trust-row"),
    ctaPrimary: pick(".reference-cta-primary"),
    ctaSecondary: pick(".reference-cta-secondary"),
    shell: pick(".reference-hero-mobile-shell"),
    hero: pick(".reference-hero-section"),
    viewportHeight: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  };
});

const output = { viewport: { width, height }, metrics };
await writeFile("/workspace/tmp/mobile-hero-metrics.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
await browser.close();
