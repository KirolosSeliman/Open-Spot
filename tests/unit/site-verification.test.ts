import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("site verification metadata", () => {
  it("supports optional Google verification through Next.js metadata", () => {
    const layout = source("src/app/layout.tsx");

    expect(layout).toContain("NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION");
    expect(layout).toContain("verification:");
    expect(layout).toContain("google: googleSiteVerification");
  });

  it("renders Bing msvalidate.01 only when env is set", () => {
    const bingComponent = source("src/components/seo/site-verification.tsx");

    expect(bingComponent).toContain('name="msvalidate.01"');
    expect(bingComponent).toContain("NEXT_PUBLIC_BING_SITE_VERIFICATION");
    expect(bingComponent).toContain("return null");
  });
});
