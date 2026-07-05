import type { Metadata } from "next";

import type { LegalPageDefinition } from "@/lib/legal/types";
import { createPageMetadata } from "@/lib/seo/metadata";

export function createLegalMetadata(page: LegalPageDefinition): Metadata {
  return createPageMetadata({
    title: page.title,
    description: page.description,
    path: `/${page.slug}`,
    locale: "fr-CA"
  });
}
