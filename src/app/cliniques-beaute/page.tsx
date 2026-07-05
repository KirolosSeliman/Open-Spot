import { IndustrySeoPage } from "@/components/marketing/industry-seo-page";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getCommercialSeoPage } from "@/lib/seo/public-pages";

const page = getCommercialSeoPage("/cliniques-beaute");

export const metadata = createPageMetadata(page.metadata);

export default function CliniquesBeautePage() {
  return <IndustrySeoPage page={page} />;
}
