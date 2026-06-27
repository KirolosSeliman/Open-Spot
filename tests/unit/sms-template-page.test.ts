import { describe, expect, it } from "vitest";

import { countSmsSegments, formatSmsCounterLabel } from "@/lib/sms/sms-counter";
import { renderSmsTemplatePreview } from "@/lib/sms/template-renderer";
import {
  getDefaultTemplateBody,
  validateSmsTemplateInput
} from "@/lib/sms/template-variables";

describe("sms template utilities", () => {
  it("counts GSM segments dynamically", () => {
    const body = getDefaultTemplateBody("opening_alert", "fr");
    const counter = countSmsSegments(body);

    expect(counter.characterCount).toBeGreaterThan(100);
    expect(counter.segmentCount).toBeGreaterThanOrEqual(1);
    expect(formatSmsCounterLabel(body).label).toContain("caractères");
  });

  it("renders preview samples instead of raw variables", () => {
    const preview = renderSmsTemplatePreview(
      getDefaultTemplateBody("opening_alert", "fr"),
      "fr"
    );

    expect(preview).toContain("Chez Kiro");
    expect(preview).toContain("14 juin");
    expect(preview).not.toContain("{business_name}");
  });

  it("warns when manual validation copy is missing", () => {
    const validation = validateSmsTemplateInput({
      templateKey: "opening_alert",
      language: "fr",
      name: "Alerte de créneau libre — FR",
      body: "Bonjour, une place est disponible chez {business_name}."
    });

    expect(validation.warnings.some((warning) => warning.includes("manuelle"))).toBe(
      true
    );
  });

  it("warns on unknown variables", () => {
    const validation = validateSmsTemplateInput({
      templateKey: "opening_alert",
      language: "fr",
      name: "Alerte de créneau libre — FR",
      body: "Bonjour {unknown_variable}"
    });

    expect(validation.warnings).toContain("Variable inconnue : {unknown_variable}");
  });
});

describe("sms template selection", () => {
  it("builds selectable saved and default templates", async () => {
    const { buildSmsTemplateSelectionOptions, formatTemplateSelectionLabel } =
      await import("@/lib/sms/template-selection");

    const options = buildSmsTemplateSelectionOptions([
      {
        id: "saved-1",
        templateKey: "opening_alert",
        language: "fr",
        body: "Message personnalisé",
        isActive: true,
        updatedAt: "2026-06-27T00:00:00.000Z"
      }
    ]);

    expect(options).toHaveLength(4);
    expect(
      options.find(
        (option) => option.templateKey === "opening_alert" && option.language === "fr"
      )?.isSaved
    ).toBe(true);
    expect(formatTemplateSelectionLabel(options[0])).toContain("Alerte de créneau libre");
  });
});
