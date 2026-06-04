import { describe, expect, it } from "vitest";

import { getPublicAppOrigin } from "@/lib/url/public-origin";

describe("public app origin resolver", () => {
  it("uses APP_BASE_URL and normalizes trailing slash", () => {
    expect(
      getPublicAppOrigin({
        env: { APP_BASE_URL: "https://example.com/" }
      })
    ).toMatchObject({
      origin: "https://example.com",
      isReady: true,
      source: "APP_BASE_URL"
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

  it("normalizes Vercel deployment URLs to HTTPS", () => {
    expect(
      getPublicAppOrigin({
        env: { VERCEL_URL: "open-spot.vercel.app" }
      })
    ).toMatchObject({
      origin: "https://open-spot.vercel.app",
      isReady: true,
      source: "VERCEL_URL"
    });
  });

  it("returns a blocking state when no origin exists", () => {
    expect(getPublicAppOrigin({ env: {} })).toMatchObject({
      origin: null,
      isReady: false,
      source: "none",
      blockingReasons: ["Public origin is missing or invalid."]
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
