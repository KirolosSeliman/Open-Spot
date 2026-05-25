import { describe, expect, it } from "vitest";

import { dictionaries, supportedLocales } from "@/lib/i18n/dictionaries";

describe("dictionaries", () => {
  it("contains French and English product copy namespaces", () => {
    expect(supportedLocales).toEqual(["en", "fr"]);
    expect(dictionaries.en.common.productName).toBe("2e Chance RDV");
    expect(dictionaries.fr.common.productName).toBe("2e Chance RDV");
    expect(dictionaries.en.navigation.dashboard).toBeTruthy();
    expect(dictionaries.fr.navigation.dashboard).toBeTruthy();
  });
});
