import { LuneraOpenSpotTemplate } from "@/components/marketing/lunera-open-spot-template";
import { getRequestLocale } from "@/lib/i18n/locale";

export async function OpenSpotFunnel() {
  const locale = await getRequestLocale();

  return <LuneraOpenSpotTemplate locale={locale} />;
}
