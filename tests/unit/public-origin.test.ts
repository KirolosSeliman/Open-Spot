import { describe, expect, it } from "vitest";

import { getPublicAppOrigin } from "@/lib/url/public-origin";
import { PRODUCTION_SITE_URL } from "@/lib/site-url";

describe("public app origin resolver", () => {
  it("uses APP_BASE_URL and normalizes trailing slash", () => {
    expect(
      getPublicAppOrigin({
        env: { APP_BASE_URL: "https://open-spot.ca/" }
      })
    ).toMatchObject({
      origin: "https://open-spot.ca",
      isReady: true,
      source: "APP_BASE_URL"
    });
  });

  it("uses NEXT_PUBLIC_SITE_URL when APP_BASE_URL is missing", () => {
    expect(
      getPublicAppOrigin({
        env: { NEXT_PUBLIC_SITE_URL: "https://open-spot.ca" }
      })
    ).toMatchObject({
      origin: "https://open-spot.ca",
      isReady: true,
      source: "NEXT_PUBLIC_SITE_URL"
    });
  });

  it("rejects localhost in production", () => {
    const status = getPublicAppOrigin({
      env: {
        APP_BASE_URL: "http://localhost:3000",
        NODE_ENV: "production"
      }
    });

    expect(status.isReady).toBe(false);
    expect(status.origin).toBe("http://localhost:3000");
    expect(status.blockingReasons.join(" ")).toContain(
      "local or internal host"
    );
  });

  it("rejects non-HTTPS origins in production", () => {
    const status = getPublicAppOrigin({
      env: {
        APP_BASE_URL: "http://example.com",
        NODE_ENV: "production"
      }
    });

    expect(status.isReady).toBe(false);
    expect(status.blockingReasons).toContain(
      "Production public links require HTTPS."
    );
  });

  it("allows localhost in development", () => {
    expect(
      getPublicAppOrigin({
        env: {
          APP_BASE_URL: "http://localhost:3000",
          NODE_ENV: "development"
        }
      })
    ).toMatchObject({
      origin: "http://localhost:3000",
      isReady: true
    });
  });

  it("falls back to production domain when no origin is configured in production", () => {
    expect(
      getPublicAppOrigin({
        env: {
          NODE_ENV: "production",
          VERCEL: "1"
        }
      })
    ).toMatchObject({
      origin: PRODUCTION_SITE_URL,
      isReady: true,
      source: "PRODUCTION_FALLBACK"
    });
  });

  it("does not use VERCEL_URL for customer-facing links", () => {
    expect(
      getPublicAppOrigin({
        env: {
          NODE_ENV: "production",
          VERCEL: "1",
          VERCEL_URL: "open-spot-lemon.vercel.app"
        }
      })
    ).toMatchObject({
      origin: PRODUCTION_SITE_URL,
      source: "PRODUCTION_FALLBACK"
    });
  });

  it("rejects private IP addresses in production", () => {
    const status = getPublicAppOrigin({
      env: {
        APP_BASE_URL: "https://192.168.1.5",
        NODE_ENV: "production"
      }
    });

    expect(status.isReady).toBe(false);
    expect(status.blockingReasons.join(" ")).toContain(
      "local or internal host"
    );
  });

  it("does not include secret-shaped values in blocking reasons", () => {
    const status = getPublicAppOrigin({
      env: {
        APP_BASE_URL: "http://localhost:3000",
        TWILIO_AUTH_TOKEN: "super-secret-token",
        SUPABASE_SERVICE_ROLE_KEY: "service-secret",
        NODE_ENV: "production"
      }
    });

    expect(status.blockingReasons.join(" ")).not.toContain(
      "super-secret-token"
    );
    expect(status.blockingReasons.join(" ")).not.toContain("service-secret");
  });
});
