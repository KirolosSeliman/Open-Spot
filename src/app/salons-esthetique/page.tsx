import { IndustrySeoPage } from "@/components/marketing/industry-seo-page";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getCommercialSeoPage } from "@/lib/seo/public-pages";

const page = getCommercialSeoPage("/salons-esthetique");

export const metadata = createPageMetadata(page.metadata);

export default function SalonsEsthetiquePage() {
  return <IndustrySeoPage page={page} />;
}
