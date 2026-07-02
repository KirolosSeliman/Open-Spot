import { headers } from "next/headers";

import { InstructionsPanel } from "@/components/dashboard/qr-link/instructions-panel";
import { QrCodePanel } from "@/components/dashboard/qr-link/qr-code-panel";
import { QrLinkHero } from "@/components/dashboard/qr-link/qr-link-hero";
import {
  PublicLinkUnavailableState,
  PublicOriginConfigState
} from "@/components/dashboard/qr-link/unavailable-state";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { getPublicAppOrigin } from "@/lib/url/public-origin";
import { buildPublicWaitlistUrl } from "@/lib/waitlist/links";

function buildLinksForSlug({
  baseUrl,
  slug
}: {
  baseUrl: string;
  slug: string;
}) {
  try {
    const publicLink = buildPublicWaitlistUrl({ baseUrl, slug });
    const qrLink = buildPublicWaitlistUrl({
      baseUrl,
      slug,
      source: "qr_code"
    });
    const kioskLink = buildPublicWaitlistUrl({
      baseUrl,
      slug,
      mode: "kiosk"
    });

    return { publicLink, qrLink, kioskLink };
  } catch {
    return null;
  }
}

export default async function DashboardQrCodePage() {
  const [workspace, requestHeaders] = await Promise.all([
    getActiveOrganizationWorkspace(),
    headers()
  ]);
  const organization =
    workspace.status === "ready" ? workspace.organization : null;
  const slug = organization?.slug?.trim() ?? "";
  const hasValidSlug = slug.length > 0;
  const publicOrigin = getPublicAppOrigin({ requestHeaders });
  const links =
    publicOrigin.isReady && hasValidSlug && publicOrigin.origin
      ? buildLinksForSlug({ baseUrl: publicOrigin.origin, slug })
      : null;
  const canRenderPublicLinks = Boolean(
    publicOrigin.isReady && hasValidSlug && links?.publicLink && links.qrLink && links.kioskLink
  );

  return (
    <div className="grid min-w-0 max-w-full gap-6 bg-[#f8fbff] pb-16 lg:gap-6">
      <QrLinkHero />

      {!publicOrigin.isReady ? (
        <PublicOriginConfigState blockingReasons={publicOrigin.blockingReasons} />
      ) : null}

      {publicOrigin.isReady && !hasValidSlug ? <PublicLinkUnavailableState /> : null}

      {canRenderPublicLinks && links ? (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
          <QrCodePanel publicUrl={links.publicLink} qrUrl={links.qrLink} />
          <InstructionsPanel
            kioskUrl={links.kioskLink}
            publicUrl={links.publicLink}
          />
        </div>
      ) : null}
    </div>
  );
}
