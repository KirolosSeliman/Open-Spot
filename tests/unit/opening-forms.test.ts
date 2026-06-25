import { describe, expect, it } from "vitest";

import { buildOpeningCreateInput } from "@/lib/openings/forms";

describe("opening creation form", () => {
  it("validates opening input and never accepts browser organization id", () => {
    expect(
      buildOpeningCreateInput({
        title: "Coupe annulee",
        serviceId: "service_1",
        startTime: "2026-06-01T14:00",
        endTime: "2026-06-01T14:45",
        organizationId: "browser_org"
      })
    ).toEqual({
      ok: true,
      value: {
        title: "Coupe annulee",
        serviceId: "service_1",
        startTime: "2026-06-01T14:00",
        endTime: "2026-06-01T14:45",
        estimatedValueCents: null,
        offerLabel: null,
        internalNote: null
      }
    });
  });

  it("rejects missing title and invalid time order", () => {
    expect(
      buildOpeningCreateInput({
        title: "",
        startTime: "2026-06-01T14:00",
        endTime: "2026-06-01T13:45"
      })
    ).toEqual({
      ok: false,
      errors: [
        "Opening title is required.",
        "End time must be after start time."
      ]
    });
  });

  it("does not require estimated value during initial opening creation", () => {
    expect(
      buildOpeningCreateInput({
        title: "Last-minute spot",
        startTime: "2026-06-01T14:00",
        endTime: "2026-06-01T14:45"
      })
    ).toMatchObject({
      ok: true,
      value: {
        title: "Last-minute spot"
      }
    });
  });
});
