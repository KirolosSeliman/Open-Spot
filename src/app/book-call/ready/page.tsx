import { PageShell } from "@/components/layout/page-shell";
import { OpenSpotBookingPage } from "@/components/marketing/open-spot-booking-page";
import { getRequestLocale } from "@/lib/i18n/locale";

export default async function ReadyCallPage() {
  const locale = await getRequestLocale();

  return (
    <PageShell>
      <OpenSpotBookingPage initialLocale={locale} kind="ready" />
    </PageShell>
  );
}
