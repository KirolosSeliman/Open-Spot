import type { Metadata } from "next";

import type { LegalPageDefinition } from "@/lib/legal/types";

export function createLegalMetadata(page: LegalPageDefinition): Metadata {
  return {
    title: `${page.title} | Open Spot`,
    description: page.description,
    robots: {
      index: true,
      follow: true
    }
  };
}
