import { OpenSpotMetricsShowcase } from "@/components/marketing/open-spot-metrics-showcase";
import { cookies } from "next/headers";

import { isLocale, localeCookieName } from "@/lib/i18n/shared";

export async function OpenSpotFunnel() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(localeCookieName)?.value;
  const locale = isLocale(savedLocale) ? savedLocale : "en";

  return <OpenSpotMetricsShowcase locale={locale} />;
}
