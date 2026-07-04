import type { Metadata } from "next";

import { NOINDEX_ROBOTS } from "@/lib/seo/site";

export const privatePageMetadata: Metadata = {
  robots: NOINDEX_ROBOTS
};
