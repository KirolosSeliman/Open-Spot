import { OpenSpotBookingPage } from "@/components/marketing/open-spot-booking-page";
import { getRequestLocale } from "@/lib/i18n/locale";

export default async function QuestionsCallPage() {
  const locale = await getRequestLocale();

  return <OpenSpotBookingPage initialLocale={locale} kind="questions" />;
}
