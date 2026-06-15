import { describe, expect, it } from "vitest";

import { smsConversationPhoneCopy } from "@/components/marketing/sms-conversation-phone";

describe("SMS conversation phone marketing preview", () => {
  it("uses appointment cancellation SMS copy with manual merchant confirmation", () => {
    const fr = smsConversationPhoneCopy.fr;

    expect(fr.businessName).toBe("Studio Élise");
    expect(fr.messages).toEqual([
      {
        from: "business",
        text: "Bonjour Léa, une place vient de se libérer aujourd’hui à 15 h 30 pour coupe + brushing. Réponds OUI si tu es intéressée."
      },
      {
        from: "customer",
        text: "OUI, je suis disponible."
      },
      {
        from: "business",
        text: "Merci! Le salon va confirmer manuellement le rendez-vous."
      }
    ]);
    expect(fr.complianceLine).toBe("Réponds STOP pour te désinscrire.");
    expect(fr.floatingBadges.map((badge) => badge.label)).toEqual([
      "Réponse reçue",
      "À confirmer par le commerce",
      "85 $ de revenu à récupérer",
      "2 réponses"
    ]);
  });

  it("does not contain forbidden automatic confirmation positioning", () => {
    const forbiddenTerms = [
      "Confirmé automatiquement",
      "Premier arrivé confirmé",
      "Réservation automatique"
    ];
    const serializedCopy = JSON.stringify(smsConversationPhoneCopy);

    for (const term of forbiddenTerms) {
      expect(serializedCopy).not.toContain(term);
    }
  });
});
