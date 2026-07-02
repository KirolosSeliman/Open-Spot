import { describe, expect, it } from "vitest";

import {
  LOCAL_DEV_SITE_URL,
  PRODUCTION_SITE_URL,
  isLocalDevelopment,
  normalizeSiteUrl,
  resolveConfiguredSiteUrl
} from "@/lib/site-url";

describe("site url resolver", () => {
  it("normalizes trailing slashes", () => {
    expect(normalizeSiteUrl("https://open-spot.ca/")).toBe("https://open-spot.ca");
  });

  it("prefers NEXT_PUBLIC_SITE_URL", () => {
    expect(
      resolveConfiguredSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://open-spot.ca",
        NEXT_PUBLIC_APP_URL: "https://other.example",
        APP_BASE_URL: "https://other.example"
      })
    ).toBe("https://open-spot.ca");
  });

  it("falls back to NEXT_PUBLIC_APP_URL then APP_BASE_URL", () => {
    expect(
      resolveConfiguredSiteUrl({
        NEXT_PUBLIC_APP_URL: "https://open-spot.ca/",
        APP_BASE_URL: "https://other.example"
      })
    ).toBe("https://open-spot.ca");

    expect(
      resolveConfiguredSiteUrl({
        APP_BASE_URL: "https://open-spot.ca"
      })
    ).toBe("https://open-spot.ca");
  });

  it("uses localhost during local development without explicit config", () => {
    expect(
      resolveConfiguredSiteUrl({
        NODE_ENV: "development"
      })
    ).toBe(LOCAL_DEV_SITE_URL);
  });

  it("uses production fallback when deployed without explicit config", () => {
    expect(
      resolveConfiguredSiteUrl({
        NODE_ENV: "production",
        VERCEL: "1"
      })
    ).toBe(PRODUCTION_SITE_URL);
  });

  it("does not use VERCEL_URL for customer-facing resolution", () => {
    expect(
      resolveConfiguredSiteUrl({
        NODE_ENV: "production",
        VERCEL: "1",
        VERCEL_URL: "open-spot-lemon.vercel.app"
      })
    ).toBe(PRODUCTION_SITE_URL);
  });

  it("detects local development", () => {
    expect(isLocalDevelopment({ NODE_ENV: "development" })).toBe(true);
    expect(isLocalDevelopment({ NODE_ENV: "development", VERCEL: "1" })).toBe(
      false
    );
  });
});
