import { OpenSpotFunnel } from "@/components/marketing/open-spot-funnel";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getPublicSeoPage } from "@/lib/seo/public-pages";

const page = getPublicSeoPage("/");

export const metadata = createPageMetadata(page.metadata);

export default function HomePage() {
  return <OpenSpotFunnel />;
}
