import { IndustrySeoPage } from "@/components/marketing/industry-seo-page";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getCommercialSeoPage } from "@/lib/seo/public-pages";

const page = getCommercialSeoPage("/spas");

export const metadata = createPageMetadata(page.metadata);

export default function SpasPage() {
  return <IndustrySeoPage page={page} />;
}
