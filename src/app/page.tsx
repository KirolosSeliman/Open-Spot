import { OpenSpotFunnel } from "@/components/marketing/open-spot-funnel";
import { PageStructuredData } from "@/components/seo/page-structured-data";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getPublicSeoPage, homepageFaq } from "@/lib/seo/public-pages";

const page = getPublicSeoPage("/");

export const metadata = createPageMetadata(page.metadata);

export default function HomePage() {
  return (
    <>
      <PageStructuredData faq={homepageFaq} path="/" />
      <OpenSpotFunnel />
    </>
  );
}
