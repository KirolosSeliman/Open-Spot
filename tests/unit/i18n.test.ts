import { afterEach, describe, expect, it, vi } from "vitest";

import { persistClientLocale } from "@/lib/i18n/client";
import { dashboardCopy } from "@/lib/i18n/dashboard-copy";
import { dictionaries, supportedLocales } from "@/lib/i18n/dictionaries";

describe("dictionaries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("contains French and English product copy namespaces", () => {
    expect(supportedLocales).toEqual(["en", "fr"]);
    expect(dictionaries.en.common.productName).toBe("Open Spot");
    expect(dictionaries.fr.common.productName).toBe("Open Spot");
    expect(dictionaries.en.navigation.dashboard).toBeTruthy();
    expect(dictionaries.fr.navigation.dashboard).toBeTruthy();
  });

  it("uses professional French accents in shared navigation copy", () => {
    expect(dictionaries.fr.auth.createAccount).toBe("Créer un compte");
    expect(dictionaries.fr.auth.signOut).toBe("Déconnexion");
    expect(dictionaries.fr.navigation.waitlist).toBe("Liste d’attente");
    expect(dictionaries.fr.settings.settings).toBe("Paramètres");
  });

  it("does not expose Twilio debug copy in user-facing SMS runtime text", () => {
    const runtimeCopy = JSON.stringify(dashboardCopy);

    expect(runtimeCopy).not.toContain("Twilio mode");
    expect(runtimeCopy).not.toContain("real SMS will be sent");
    expect(runtimeCopy).not.toContain("opted_in");
    expect(dashboardCopy.en.smsRuntime.ready).toContain("opted in");
    expect(dashboardCopy.fr.smsRuntime.ready).toContain("consenti");
  });

  it("keeps the locale cookie as the client-side source of truth when storage is unavailable", () => {
    const documentStub = { cookie: "" };

    vi.stubGlobal("document", documentStub);
    vi.stubGlobal("window", {
      localStorage: {
        setItem: () => {
          throw new Error("storage unavailable");
        }
      }
    });

    persistClientLocale("fr");

    expect(documentStub.cookie).toContain("open_spot_locale=fr");
  });
});
