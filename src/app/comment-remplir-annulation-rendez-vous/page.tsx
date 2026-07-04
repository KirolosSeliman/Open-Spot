import { SeoArticlePage } from "@/components/seo/SeoArticlePage";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import { articlePages } from "@/lib/seo/pages";

const pageData = articlePages["comment-remplir-annulation-rendez-vous"];

export const metadata = createPublicPageMetadata({
  title: pageData.title,
  description: pageData.description,
  path: pageData.path,
  openGraphType: "article"
});

export default function Page() {
  return <SeoArticlePage data={pageData} />;
}
