import { serializeJsonLd } from "@/lib/seo/structured-data";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  const graphs = Array.isArray(data) ? data : [data];

  return (
    <>
      {graphs.map((graph, index) => (
        <script
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
          key={`${String(graph["@type"])}-${index}`}
          type="application/ld+json"
        />
      ))}
    </>
  );
}
