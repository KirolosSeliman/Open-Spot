import Link from "next/link";
import { headers } from "next/headers";

import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { CopyLinkButton } from "@/components/waitlist/copy-link-button";
import { QrCode } from "@/components/waitlist/qr-code";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { getPublicAppOrigin } from "@/lib/url/public-origin";
import { buildPublicWaitlistUrl } from "@/lib/waitlist/links";

export default async function DashboardQrCodePage() {
  const [workspace, requestHeaders] = await Promise.all([
    getActiveOrganizationWorkspace(),
    headers()
  ]);
  const organization =
    workspace.status === "ready" ? workspace.organization : null;
  const slug = organization?.slug ?? "organization";
  const publicOrigin = getPublicAppOrigin({ requestHeaders });
  const publicLink = publicOrigin.origin
    ? buildPublicWaitlistUrl({ baseUrl: publicOrigin.origin, slug })
    : null;
  const qrLink = publicOrigin.origin
    ? buildPublicWaitlistUrl({
        baseUrl: publicOrigin.origin,
        slug,
        source: "qr_code"
      })
    : null;
  const kioskLink = publicOrigin.origin
    ? buildPublicWaitlistUrl({
        baseUrl: publicOrigin.origin,
        slug,
        mode: "kiosk"
      })
    : null;
  const canRenderPublicLinks =
    publicOrigin.isReady && publicLink && qrLink && kioskLink;

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Partagez ce QR code au comptoir, sur une affiche ou en ligne pour laisser les clients rejoindre la liste d'attente."
        title="QR code et lien public"
      />
      {!canRenderPublicLinks ? (
        <Panel title="Configuration requise">
          <div className="grid gap-4 rounded-2xl border border-[#f2b8b5] bg-[#fff7f6] p-4 text-sm leading-6 text-[#8a1f17]">
            <p className="font-black">
              Les liens publics ne sont pas prets, car l&apos;URL publique de
              l&apos;application n&apos;est pas configuree de façon securitaire.
            </p>
            <ul className="grid gap-2 font-bold">
              {publicOrigin.blockingReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p>
              Configurez{" "}
              <span className="font-black">APP_BASE_URL</span> dans Vercel avec
              l&apos;URL publique HTTPS de production, puis redeployez.
            </p>
          </div>
        </Panel>
      ) : null}
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {canRenderPublicLinks ? (
          <Panel title={"QR code liste d'attente"}>
            <div className="grid justify-items-start gap-4">
              <QrCode value={qrLink} />
              <p className="break-all rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-3 text-sm font-bold">
                {qrLink}
              </p>
              <Link
                className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white"
                href={qrLink}
              >
                Ouvrir le formulaire public
              </Link>
            </div>
          </Panel>
        ) : null}
        <Panel title="Instructions d'impression et de partage">
          <div className="grid gap-4 text-sm leading-6 text-[var(--muted)]">
            <p>
              Placez le QR code a la reception, sur Instagram, Facebook, Google
              Business Profile ou dans un message manuel.
            </p>
            <p>
              Le formulaire public demande un consentement SMS explicite. Sans
              consentement, le client ne devient pas eligible aux SMS.
            </p>
            {canRenderPublicLinks ? (
              <>
                <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3">
                  <p className="font-bold text-[var(--foreground)]">
                    Lien d&apos;inscription public
                  </p>
                  <p className="break-all">{publicLink}</p>
                  <CopyLinkButton value={publicLink} />
                </div>
                <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3">
                  <p className="font-bold text-[var(--foreground)]">
                    Mode kiosque tablette
                  </p>
                  <p className="break-all">{kioskLink}</p>
                  <Link
                    className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[#f1f3ef]"
                    href={kioskLink}
                  >
                    Ouvrir le kiosque
                  </Link>
                </div>
              </>
            ) : null}
          </div>
        </Panel>
      </div>
      <Panel title="Aperçu client">
        <div className="max-w-md rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Open Spot
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            Rejoindre la liste SMS de {organization?.name ?? "votre entreprise"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Les clients voient un formulaire simple avec leur nom, leur numero
            mobile, leur langue preferee, les services souhaites et un
            consentement SMS explicite.
          </p>
        </div>
      </Panel>
    </div>
  );
}
