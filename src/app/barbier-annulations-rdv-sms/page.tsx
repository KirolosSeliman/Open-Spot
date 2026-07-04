import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import { commercialPages } from "@/lib/seo/pages";

const pageData = commercialPages["barbier-annulations-rdv-sms"];

export const metadata = createPublicPageMetadata({
  title: pageData.title,
  description: pageData.description,
  path: pageData.path
});

export default function Page() {
  return <SeoLandingPage data={pageData} />;
}
