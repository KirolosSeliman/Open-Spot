import Link from "next/link";

import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import { CopyLinkButton } from "@/components/waitlist/copy-link-button";
import { QrCode } from "@/components/waitlist/qr-code";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { buildPublicWaitlistUrl } from "@/lib/waitlist/links";

export default async function DashboardQrCodePage() {
  const workspace = await getActiveOrganizationWorkspace();
  const organization =
    workspace.status === "ready" ? workspace.organization : null;
  const slug = organization?.slug ?? "organization";
  const vercelUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : null;
  const baseUrl =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    vercelUrl ??
    "";
  const publicLink = buildPublicWaitlistUrl({ baseUrl, slug });
  const qrLink = buildPublicWaitlistUrl({
    baseUrl,
    slug,
    source: "qr_code"
  });
  const kioskLink = buildPublicWaitlistUrl({ baseUrl, slug, mode: "kiosk" });

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Partagez ce QR code au comptoir, sur une affiche ou en ligne pour laisser les clients rejoindre la liste d'attente."
        title="QR code et lien public"
      />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="QR waitlist">
          <div className="grid justify-items-start gap-4">
            <QrCode value={qrLink} />
            <p className="break-all rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-3 text-sm font-bold">
              {qrLink}
            </p>
            <Link
              className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white"
              href={qrLink}
            >
              Open public signup
            </Link>
          </div>
        </Panel>
        <Panel title="Print / share instructions">
          <div className="grid gap-4 text-sm leading-6 text-[var(--muted)]">
            <p>
              Placez le QR code a la reception, sur Instagram, Facebook, Google
              Business Profile ou dans un message manuel.
            </p>
            <p>
              Le formulaire public demande un consentement SMS explicite. Sans
              consentement, le client ne devient pas eligible aux SMS.
            </p>
            <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3">
              <p className="font-bold text-[var(--foreground)]">
                Public share link
              </p>
              <p className="break-all">{publicLink}</p>
              <CopyLinkButton value={publicLink} />
            </div>
            <div className="grid gap-2 rounded-xl border border-[var(--line)] bg-white p-3">
              <p className="font-bold text-[var(--foreground)]">
                Tablet kiosk mode
              </p>
              <p className="break-all">{kioskLink}</p>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-md border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[#f1f3ef]"
                href={kioskLink}
              >
                Open kiosk
              </Link>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Customer preview">
        <div className="max-w-md rounded-lg border border-[var(--line)] bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
            Open Spot
          </p>
          <h2 className="mt-3 text-2xl font-bold">
            Join the SMS waitlist for {organization?.name ?? "your business"}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Customers see a simple public form with name, mobile phone,
            preferred language, service interest, and an explicit SMS consent
            checkbox.
          </p>
        </div>
      </Panel>
    </div>
  );
}
