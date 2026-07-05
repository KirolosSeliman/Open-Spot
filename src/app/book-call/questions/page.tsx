import { OpenSpotBookingPage } from "@/components/marketing/open-spot-booking-page";
import { getRequestLocale } from "@/lib/i18n/locale";
import { createPageMetadata } from "@/lib/seo/metadata";
import { getPublicSeoPage } from "@/lib/seo/public-pages";

const page = getPublicSeoPage("/book-call/questions");

export const metadata = createPageMetadata(page.metadata);

export default async function QuestionsCallPage() {
  const locale = await getRequestLocale();

  return <OpenSpotBookingPage initialLocale={locale} kind="questions" />;
}
