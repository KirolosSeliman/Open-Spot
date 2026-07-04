import { redirect } from "next/navigation";

import { resolvePostAuthDestination } from "@/lib/organization/current";
import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default async function OnboardingPage() {
  redirect(await resolvePostAuthDestination());
}
