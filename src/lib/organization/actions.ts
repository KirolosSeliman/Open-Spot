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

  const { data: existingMembership, error: membershipError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (membershipError) {
    onboardingError(membershipError.message);
  }

  if (existingMembership && existingMembership.length > 0) {
    redirect("/dashboard");
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
    if (error.message.includes("already belongs to an organization")) {
      redirect("/dashboard");
    }

    if (error.code === "23505") {
      onboardingError("Ce slug d’organisation est déjà utilisé.");
    }

    onboardingError(error.message || "La création de l’organisation a échoué.");
  }
}
