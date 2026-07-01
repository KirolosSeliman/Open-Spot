import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const width = 432;
const height = 768;

const targets = {
  header: { y: 16, tolerance: 12 },
  title: { y: 92, tolerance: 16 },
  subtitle: { y: 215, tolerance: 24 },
  phone: { y: 292, w: 240, tolerance: 24 },
  gradient: { y: 555, tolerance: 30 },
  trust: { y: 620, tolerance: 24 },
  ctaPrimary: { y: 682, tolerance: 24 },
  ctaSecondary: { y: 728, tolerance: 24 }
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 2,
  isMobile: true
});
await page.context().addCookies([
  { name: "open_spot_locale", value: "en", domain: "localhost", path: "/" }
]);
await page.setExtraHTTPHeaders({ "Accept-Language": "en" });
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await mkdir("/workspace/tmp", { recursive: true });
await page.screenshot({ path: "/workspace/tmp/mobile-hero-432.png", fullPage: false });

const metrics = await page.evaluate(() => {
  const pick = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return {
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height)
    };
  };

  return {
    header: pick("header"),
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
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  };
});

const report = {};
for (const [key, target] of Object.entries(targets)) {
  const value = metrics[key];
  if (!value) {
    report[key] = { status: "missing" };
    continue;
  }

  const deltaY = value.y - target.y;
  const withinY = Math.abs(deltaY) <= target.tolerance;
  const withinW =
    typeof target.w === "number" ? Math.abs(value.w - target.w) <= target.tolerance : true;

  report[key] = {
    status: withinY && withinW ? "ok" : "off",
    actual: value,
    deltaY,
    deltaW: typeof target.w === "number" ? value.w - target.w : null
  };
}

const output = { viewport: { width, height }, metrics, report };
await writeFile("/workspace/tmp/mobile-hero-metrics.json", JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
await browser.close();
