import {
  buildGlobalStructuredData,
  serializeJsonLd
} from "@/lib/seo/structured-data";
import { resolveConfiguredSiteUrl } from "@/lib/site-url";

export function GlobalStructuredData() {
  const siteUrl = resolveConfiguredSiteUrl();
  const graphs = buildGlobalStructuredData(siteUrl);

  return (
    <>
      {graphs.map((graph) => (
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
          key={graph["@type"] as string}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
