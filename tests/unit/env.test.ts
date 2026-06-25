import { describe, expect, it } from "vitest";

import {
  clientEnvKeys,
  getSmsProvider,
  isSupabaseConfigured,
  serverOnlyEnvKeys
} from "@/lib/env/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("environment configuration", () => {
  it("keeps service role and SMS credentials server-only", () => {
    expect(serverOnlyEnvKeys).toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(serverOnlyEnvKeys).toContain("ALLOW_REAL_SMS_SENDS");
    expect(serverOnlyEnvKeys).toContain("CRON_SECRET");
    expect(serverOnlyEnvKeys).toContain("SIMULATOR_WEBHOOK_SECRET");
    expect(serverOnlyEnvKeys).toContain("PLIVO_AUTH_TOKEN");
    expect(serverOnlyEnvKeys).toContain("TWILIO_AUTH_TOKEN");
    expect(serverOnlyEnvKeys).toContain("TWILIO_MESSAGING_SERVICE_SID");
    expect(serverOnlyEnvKeys).toContain("RESEND_API_KEY");
    expect(serverOnlyEnvKeys).toContain("SALES_OWNER_EMAIL");
    expect(clientEnvKeys).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(clientEnvKeys).not.toContain("ALLOW_REAL_SMS_SENDS");
    expect(clientEnvKeys).not.toContain("CRON_SECRET");
    expect(clientEnvKeys).not.toContain("SIMULATOR_WEBHOOK_SECRET");
    expect(clientEnvKeys).not.toContain("PLIVO_AUTH_TOKEN");
    expect(clientEnvKeys).not.toContain("TWILIO_AUTH_TOKEN");
    expect(clientEnvKeys).not.toContain("TWILIO_MESSAGING_SERVICE_SID");
    expect(clientEnvKeys).not.toContain("RESEND_API_KEY");
    expect(clientEnvKeys).not.toContain("SALES_OWNER_EMAIL");
  });

  it("documents Supabase env placeholders without public service-role naming", () => {
    const envExample = readFileSync(join(process.cwd(), ".env.example"), "utf8");

    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_URL=");
    expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY=");
    expect(envExample).toContain("SUPABASE_SERVICE_ROLE_KEY=");
    expect(envExample).toContain("CRON_SECRET=");
    expect(envExample).toContain("SIMULATOR_WEBHOOK_SECRET=");
    expect(envExample).toContain("SMS_PROVIDER=simulator");
    expect(envExample).toContain("ALLOW_REAL_SMS_SENDS=false");
    expect(envExample).toContain("TWILIO_ACCOUNT_SID=");
    expect(envExample).toContain("TWILIO_AUTH_TOKEN=");
    expect(envExample).toContain("TWILIO_MESSAGING_SERVICE_SID=");
    expect(envExample).toContain("TWILIO_SOURCE_NUMBER=");
    expect(envExample).toContain("TWILIO_STATUS_CALLBACK_URL=");
    expect(envExample).toContain("RESEND_API_KEY=");
    expect(envExample).toContain("SALES_FROM_EMAIL=");
    expect(envExample).toContain("SALES_REPLY_TO_EMAIL=");
    expect(envExample).toContain("SALES_OWNER_EMAIL=");
    expect(envExample).toContain(
      "APP_BASE_URL=https://your-production-domain.com"
    );
    expect(envExample).toContain(
      "NEXT_PUBLIC_APP_URL=https://your-production-domain.com"
    );
    expect(envExample).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
  });

  it("defaults SMS provider to simulator for local safety", () => {
    expect(getSmsProvider({})).toBe("simulator");
  });

  it("requires both public Supabase values before auth clients are used", () => {
    expect(isSupabaseConfigured({})).toBe(false);
    expect(
      isSupabaseConfigured({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key"
      })
    ).toBe(true);
  });
});
