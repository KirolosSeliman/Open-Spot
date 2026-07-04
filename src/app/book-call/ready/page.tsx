import { OpenSpotBookingPage } from "@/components/marketing/open-spot-booking-page";
import { getRequestLocale } from "@/lib/i18n/locale";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function ReadyCallPage() {
  const locale = await getRequestLocale();

  return <OpenSpotBookingPage initialLocale={locale} kind="ready" />;
}
