import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { smsConversationPhoneCopy } from "@/components/marketing/sms-conversation-phone";

function source(path: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${path}`, import.meta.url)),
    "utf8"
  );
}

describe("SMS conversation phone marketing preview", () => {
  it("uses Open Spot appointment workflow copy for the hero phone", () => {
    const en = smsConversationPhoneCopy.en;

    expect(en.businessName).toBe("Open Spot");
    expect(en.statusTime).toBe("9:41");
    expect(en.floatingBadges.map((badge) => badge.label)).toEqual([
      "Secure & compliant",
      "Fill more. No-shows down."
    ]);
  });

  it("does not contain forbidden automatic confirmation positioning", () => {
    const forbiddenTerms = [
      "Confirmed automatically",
      "Automatically confirmed",
      "First reply wins",
      "Auto-confirmation",
      "Automatic booking"
    ];
    const serializedCopy = JSON.stringify(smsConversationPhoneCopy);

    for (const term of forbiddenTerms) {
      expect(serializedCopy).not.toContain(term);
    }
  });

  it("uses Lunera-like phone scale, motion, and premium frame constraints", () => {
    const phoneSource = source("src/components/marketing/sms-conversation-phone.tsx");
    const styles = source("src/app/globals.css");

    expect(phoneSource).toContain("scale: 0.965");
    expect(phoneSource).toContain("translateY: 104");
    expect(phoneSource).toContain("translateY: 16");
    expect(styles).toContain("width: clamp(310px, 22.5vw, 385px)");
    expect(styles).toContain("rotateY(-5.5deg)");
    expect(styles).toContain("rotateZ(1.15deg)");
    expect(styles).toContain("right: -0.76rem");
    expect(styles).toContain("width: 1.58rem");
    expect(styles).toContain("inset 0 0 0 6px");
  });
});
