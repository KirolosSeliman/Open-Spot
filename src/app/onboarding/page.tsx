import { redirect } from "next/navigation";

import { resolvePostAuthDestination } from "@/lib/organization/current";

export default async function OnboardingPage() {
  redirect(await resolvePostAuthDestination());
}
