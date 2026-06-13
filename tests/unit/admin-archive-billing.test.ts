import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { canPerformPlatformAdminAction } from "@/lib/admin/action-permissions";
import {
  aggregateFilledSpotFees,
  calculateFilledSpotFeeCents,
  normalizeBillingTermsInput
} from "@/lib/admin/billing-terms";
import {
  aggregateSmsCost,
  estimateSmsMessageCostCents
} from "@/lib/admin/sms-cost";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260613230000_add_platform_organization_archive_and_billing_terms.sql"
);

describe("admin archive and billing terms", () => {
  it("keeps archive and billing mutations super-admin only", () => {
    expect(
      canPerformPlatformAdminAction({
        adminRole: "super_admin",
        accessLevel: "super_admin",
        action: "organization.archive"
      })
    ).toBe(true);
    expect(
      canPerformPlatformAdminAction({
        adminRole: "analyst",
        accessLevel: "manager_mode",
        action: "organization.archive"
      })
    ).toBe(false);
    expect(
      canPerformPlatformAdminAction({
        adminRole: "support_admin",
        accessLevel: "manager_mode",
        action: "organization.update_billing_terms"
      })
    ).toBe(false);
  });

  it("normalizes billing terms to cents and basis points", () => {
    const { terms, notes } = normalizeBillingTermsInput({
      currency: "cad",
      monthlySubscription: "99.95",
      filledSpotFeeMode: "fixed_plus_percentage",
      fixedFee: "12.50",
      percentage: "15",
      notes: " internal "
    });

    expect(terms.currency).toBe("CAD");
    expect(terms.monthlySubscriptionCents).toBe(9995);
    expect(terms.filledSpotFixedFeeCents).toBe(1250);
    expect(terms.filledSpotPercentageBps).toBe(1500);
    expect(notes).toBe("internal");
  });

  it("zeroes irrelevant fee fields by mode", () => {
    expect(
      normalizeBillingTermsInput({
        currency: "CAD",
        monthlySubscription: "0",
        filledSpotFeeMode: "none",
        fixedFee: "10",
        percentage: "25",
        notes: ""
      }).terms
    ).toMatchObject({
      filledSpotFixedFeeCents: 0,
      filledSpotPercentageBps: 0
    });
    expect(
      normalizeBillingTermsInput({
        currency: "CAD",
        monthlySubscription: "0",
        filledSpotFeeMode: "percentage",
        fixedFee: "10",
        percentage: "25",
        notes: ""
      }).terms.filledSpotFixedFeeCents
    ).toBe(0);
  });

  it("calculates filled spot fees without inventing recovered value", () => {
    const fixed = calculateFilledSpotFeeCents({
      terms: {
        currency: "CAD",
        monthlySubscriptionCents: 0,
        filledSpotFeeMode: "fixed",
        filledSpotFixedFeeCents: 1000,
        filledSpotPercentageBps: 0
      },
      filledSpot: { id: "spot-1", recoveredValueCents: null }
    });

    expect(fixed.feeCents).toBe(1000);
    expect(fixed.warning).toBeNull();

    const percentage = calculateFilledSpotFeeCents({
      terms: {
        currency: "CAD",
        monthlySubscriptionCents: 0,
        filledSpotFeeMode: "percentage",
        filledSpotFixedFeeCents: 0,
        filledSpotPercentageBps: 1250
      },
      filledSpot: { id: "spot-2", recoveredValueCents: 8000 }
    });

    expect(percentage.feeCents).toBe(1000);

    const aggregate = aggregateFilledSpotFees({
      terms: {
        currency: "CAD",
        monthlySubscriptionCents: 0,
        filledSpotFeeMode: "fixed_plus_percentage",
        filledSpotFixedFeeCents: 500,
        filledSpotPercentageBps: 1000
      },
      filledSpots: [
        { id: "spot-3", recoveredValueCents: 10000 },
        { id: "spot-4", recoveredValueCents: null }
      ]
    });

    expect(aggregate.totalFeeCents).toBe(2000);
    expect(aggregate.warnings[0]).toContain("Percentage fee requires recovered value");
  });

  it("centralizes SMS cost estimates and actual provider prices", () => {
    expect(
      estimateSmsMessageCostCents({
        provider: "simulator",
        direction: "outbound",
        status: "sent",
        segments: null
      }).estimatedSmsCostCents
    ).toBe(0);
    expect(
      estimateSmsMessageCostCents({
        provider: "twilio",
        direction: "outbound",
        status: "failed",
        segments: 2
      }).estimatedSmsCostCents
    ).toBe(1.66);
    expect(
      estimateSmsMessageCostCents({
        provider: "twilio",
        direction: "outbound",
        status: "delivered",
        segments: null,
        actualProviderPriceCents: -3
      }).actualSmsCostCents
    ).toBe(3);

    const aggregate = aggregateSmsCost([
      {
        id: "sms-1",
        provider: "twilio",
        direction: "outbound",
        status: "sent",
        segments: null
      },
      {
        id: "sms-1",
        provider: "twilio",
        direction: "outbound",
        status: "sent",
        segments: null
      }
    ]);

    expect(aggregate.billableMessageCount).toBe(1);
    expect(aggregate.actualSmsCostCents).toBeNull();
    expect(aggregate.warnings.length).toBeGreaterThan(0);
  });

  it("adds archive and billing tables without destructive SQL", () => {
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("add column if not exists archived_at");
    expect(sql).toContain(
      "create table if not exists public.platform_organization_billing_terms"
    );
    expect(sql).toContain(
      "alter table public.platform_organization_billing_terms enable row level security"
    );
    expect(sql).not.toMatch(/\bdrop\s+table\b|\btruncate\b/i);
  });
});
