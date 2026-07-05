import { describe, expect, it } from "vitest";

import { createPageMetadata } from "@/lib/seo/metadata";

describe("SEO metadata helper", () => {
  it("builds canonical, Open Graph, Twitter, and public robots metadata", () => {
    const metadata = createPageMetadata({
      title: "Comment Open Spot remplit une annulation par SMS",
      description:
        "Open Spot aide les commerces sur rendez-vous a recuperer les annulations par SMS avec validation manuelle.",
      path: "/how-it-works",
      locale: "fr-CA"
    });

    expect(metadata.title).toBe(
      "Comment Open Spot remplit une annulation par SMS | Open Spot"
    );
    expect(metadata.description).toContain("validation manuelle");
    expect(metadata.alternates?.canonical).toBe("https://open-spot.ca/how-it-works");
    expect(metadata.openGraph).toMatchObject({
      title: "Comment Open Spot remplit une annulation par SMS | Open Spot",
      description:
        "Open Spot aide les commerces sur rendez-vous a recuperer les annulations par SMS avec validation manuelle.",
      url: "https://open-spot.ca/how-it-works",
      siteName: "Open Spot",
      locale: "fr_CA",
      type: "website"
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "Comment Open Spot remplit une annulation par SMS | Open Spot",
      description:
        "Open Spot aide les commerces sur rendez-vous a recuperer les annulations par SMS avec validation manuelle."
    });
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph).not.toHaveProperty("images");
  });

  it("adds an absolute image only when a real public image path is supplied", () => {
    const metadata = createPageMetadata({
      title: "Tarifs Open Spot",
      description:
        "Tarification personnalisee pour les commerces qui recuperent des annulations par SMS.",
      path: "/pricing",
      locale: "fr-CA",
      imagePath: "/brand/open-spot-logo-mark.png"
    });

    expect(metadata.openGraph).toHaveProperty("images", [
      {
        url: "https://open-spot.ca/brand/open-spot-logo-mark.png",
        alt: "Open Spot"
      }
    ]);
  });
});
