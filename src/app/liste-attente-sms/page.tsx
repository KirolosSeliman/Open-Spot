import { IndustrySeoPage } from "@/components/marketing/industry-seo-page";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getCommercialSeoPage } from "@/lib/seo/public-pages";

const page = getCommercialSeoPage("/liste-attente-sms");

export const metadata = createPageMetadata(page.metadata);

export default function ListeAttenteSmsPage() {
  return <IndustrySeoPage page={page} />;
}
