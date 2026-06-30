import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { resolveOpeningDisplayValueCents } from "@/lib/dashboard/operations-data";

describe("opening display value", () => {
  it("prioritizes confirmed booking recovered value over opening and service values", () => {
    expect(
      resolveOpeningDisplayValueCents({
        bookingRecoveredValueCents: 12000,
        openingNormalPriceCents: 9000,
        serviceNormalPriceCents: 7000
      })
    ).toEqual({
      valueCents: 12000,
      source: "booking_request"
    });
  });

  it("falls back to opening value, then service value, then unknown", () => {
    expect(
      resolveOpeningDisplayValueCents({
        bookingRecoveredValueCents: null,
        openingNormalPriceCents: 9000,
        serviceNormalPriceCents: 7000
      })
    ).toEqual({
      valueCents: 9000,
      source: "opening"
    });
    expect(
      resolveOpeningDisplayValueCents({
        bookingRecoveredValueCents: null,
        openingNormalPriceCents: null,
        serviceNormalPriceCents: 7000
      })
    ).toEqual({
      valueCents: 7000,
      source: "service"
    });
    expect(
      resolveOpeningDisplayValueCents({
        bookingRecoveredValueCents: null,
        openingNormalPriceCents: null,
        serviceNormalPriceCents: null
      })
    ).toEqual({
      valueCents: null,
      source: "unknown"
    });
  });

  it("uses computed display value and localized statuses on the cancellations page", () => {
    const cancellationsTable = readFileSync(
      join(process.cwd(), "src/components/dashboard/cancellations-history-table.tsx"),
      "utf8"
    );

    expect(cancellationsTable).toContain("displayValueCents");
    expect(cancellationsTable).toContain("OpeningStatusBadge");
    expect(cancellationsTable).not.toContain(
      "formatCurrency(opening.normal_price_cents)"
    );
    expect(cancellationsTable).not.toContain(
      "<StatusBadge>{opening.status}</StatusBadge>"
    );
  });
});
