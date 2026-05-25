import { describe, expect, it } from "vitest";

import { parseCsv } from "@/lib/import/csv";

describe("parseCsv", () => {
  it("parses quoted commas and trims headers", () => {
    expect(parseCsv(' name,phone,notes\n"Ada Lovelace",5145550199,"VIP, color"')).toEqual({
      headers: ["name", "phone", "notes"],
      rows: [
        {
          lineNumber: 2,
          values: ["Ada Lovelace", "5145550199", "VIP, color"]
        }
      ]
    });
  });

  it("keeps empty trailing cells for validation", () => {
    expect(parseCsv("name,phone,email\nGrace,5145550100,")).toEqual({
      headers: ["name", "phone", "email"],
      rows: [
        {
          lineNumber: 2,
          values: ["Grace", "5145550100", ""]
        }
      ]
    });
  });
});
