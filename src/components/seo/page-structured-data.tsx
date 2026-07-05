import {
  buildPageStructuredData,
  serializeJsonLd
} from "@/lib/seo/structured-data";
import type { FaqItem } from "@/lib/seo/public-pages";

type BreadcrumbItem = {
  name: string;
  path: string;
};

export function PageStructuredData({
  breadcrumbs,
  faq,
  path
}: {
  breadcrumbs?: BreadcrumbItem[];
  faq?: FaqItem[];
  path: string;
}) {
  const graphs = buildPageStructuredData({ breadcrumbs, faq, path });

  return (
    <>
      {graphs.map((graph) => (
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
          key={`${path}-${graph["@type"] as string}`}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
