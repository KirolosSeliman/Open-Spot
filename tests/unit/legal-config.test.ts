import { afterEach, describe, expect, it } from "vitest";

import {
  assertProductionLegalConfig,
  getLegalBusinessAddress,
  getLegalContactEmail
} from "@/lib/legal/constants";

const originalVercelEnv = process.env.VERCEL_ENV;
const originalNextPhase = process.env.NEXT_PHASE;
const originalLegalEmail = process.env.LEGAL_CONTACT_EMAIL;
const originalLegalAddress = process.env.LEGAL_BUSINESS_ADDRESS;

afterEach(() => {
  if (originalVercelEnv === undefined) {
    delete process.env.VERCEL_ENV;
  } else {
    process.env.VERCEL_ENV = originalVercelEnv;
  }

  if (originalNextPhase === undefined) {
    delete process.env.NEXT_PHASE;
  } else {
    process.env.NEXT_PHASE = originalNextPhase;
  }

  if (originalLegalEmail === undefined) {
    delete process.env.LEGAL_CONTACT_EMAIL;
  } else {
    process.env.LEGAL_CONTACT_EMAIL = originalLegalEmail;
  }

  if (originalLegalAddress === undefined) {
    delete process.env.LEGAL_BUSINESS_ADDRESS;
  } else {
    process.env.LEGAL_BUSINESS_ADDRESS = originalLegalAddress;
  }
});

describe("legal production configuration", () => {
  it("allows production builds without legal env vars during the build phase", () => {
    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PHASE = "phase-production-build";
    delete process.env.LEGAL_CONTACT_EMAIL;
    delete process.env.LEGAL_BUSINESS_ADDRESS;

    expect(() => assertProductionLegalConfig()).not.toThrow();
    expect(getLegalContactEmail()).toContain("@example.invalid");
    expect(getLegalBusinessAddress()).toContain("configurer");
  });

  it("requires legal env vars in production runtime", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.NEXT_PHASE;
    delete process.env.LEGAL_CONTACT_EMAIL;
    delete process.env.LEGAL_BUSINESS_ADDRESS;

    expect(() => getLegalContactEmail()).toThrow(
      "LEGAL_CONTACT_EMAIL must be configured before publishing legal pages."
    );
    expect(() => getLegalBusinessAddress()).toThrow(
      "LEGAL_BUSINESS_ADDRESS must be configured before publishing legal pages."
    );
  });

  it("uses configured legal values when present", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.NEXT_PHASE;
    process.env.LEGAL_CONTACT_EMAIL = "legal@openspot.ca";
    process.env.LEGAL_BUSINESS_ADDRESS = "123 Rue Example, Montreal QC";

    expect(getLegalContactEmail()).toBe("legal@openspot.ca");
    expect(getLegalBusinessAddress()).toBe("123 Rue Example, Montreal QC");
    expect(() => assertProductionLegalConfig()).not.toThrow();
  });
});
