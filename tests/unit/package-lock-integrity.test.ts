import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type LockPackage = {
  link?: boolean;
  version?: string;
};

type PackageLock = {
  packages?: Record<string, LockPackage>;
};

describe("package-lock integrity", () => {
  it("does not contain non-link package entries without versions", () => {
    const lock = JSON.parse(
      readFileSync(new URL("../../package-lock.json", import.meta.url), "utf8")
    ) as PackageLock;

    const malformedPackages = Object.entries(lock.packages ?? {})
      .filter(([path, pkg]) => path && !pkg.link && !pkg.version)
      .map(([path]) => path);

    expect(malformedPackages).toEqual([]);
  });
});
