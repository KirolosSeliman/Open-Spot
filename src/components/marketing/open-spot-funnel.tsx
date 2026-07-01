import { SiteHeader } from "@/components/layout/site-header";
import { LuneraOpenSpotTemplate } from "@/components/marketing/lunera-open-spot-template";

export async function OpenSpotFunnel() {
  return (
    <>
      <SiteHeader />
      <LuneraOpenSpotTemplate locale="en" withExternalHeader />
    </>
  );
}
