"use server";

import { redirect } from "next/navigation";

import {
  buildOrganizationCreateInput,
  type OrganizationCreateInput
} from "@/lib/organization/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function onboardingError(message: string): never {
  redirect(`/onboarding?error=${encodeURIComponent(message)}`);
}

export async function createOrganizationAction(formData: FormData) {
  const payload = buildOrganizationCreateInput({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    defaultLanguage: String(formData.get("defaultLanguage") ?? "en")
  });

  if (!payload.ok) {
    onboardingError(payload.errors.join(" "));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/sign-in");
  }

  await bootstrapOrganizationForUser(supabase, payload.value);

  redirect("/dashboard");
}

async function bootstrapOrganizationForUser(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  input: OrganizationCreateInput
) {
  const { error } = await supabase.rpc("create_organization_with_owner", {
    organization_name: input.name,
    organization_slug: input.slug,
    organization_email: input.email ?? "",
    organization_phone: input.phone ?? "",
    organization_timezone: input.timezone,
    organization_default_language: input.defaultLanguage
  });

  if (error) {
    if (error.code === "23505") {
      onboardingError("This organization slug is already used.");
    }

    onboardingError(error.message || "Organization creation failed.");
  }
}
