import { describe, expect, it } from "vitest";

import { createSmsProviderDescriptor } from "@/lib/sms/provider";

describe("createSmsProviderDescriptor", () => {
  it("describes simulator mode as non-sending", () => {
    expect(createSmsProviderDescriptor("simulator")).toEqual({
      name: "simulator",
      sendsRealMessages: false
    });
  });
});
