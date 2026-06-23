import { LuneraOpenSpotTemplate } from "@/components/marketing/lunera-open-spot-template";
import { localeCookieName, normalizeLocale } from "@/lib/i18n/shared";
import type { Locale } from "@/lib/i18n/types";
import { cookies } from "next/headers";

async function getMarketingLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const selectedLocale = cookieStore.get(localeCookieName)?.value;

  return selectedLocale ? normalizeLocale(selectedLocale) : "en";
}

export async function OpenSpotFunnel() {
  const locale = await getMarketingLocale();

  return <LuneraOpenSpotTemplate locale={locale} />;
}
