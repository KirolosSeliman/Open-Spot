"use server";

import { redirect } from "next/navigation";

import {
  buildOrganizationCreateInput,
  type OrganizationCreateInput
} from "@/lib/organization/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

type OrganizationBootstrapClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: { id: string } | null;
          error: { message: string; code?: string } | null;
        }>;
      };
    };
    delete: () => {
      eq: (
        column: string,
        value: string
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
};

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

  const serviceClient = createSupabaseServiceClient();

  if (!serviceClient) {
    onboardingError("Supabase service role is not configured on the server.");
  }

  await bootstrapOrganizationForUser(
    serviceClient as unknown as OrganizationBootstrapClient,
    user.id,
    payload.value
  );

  redirect("/dashboard");
}

async function bootstrapOrganizationForUser(
  serviceClient: OrganizationBootstrapClient,
  userId: string,
  input: OrganizationCreateInput
) {
  const { data: organization, error: organizationError } = await serviceClient
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      email: input.email,
      phone: input.phone,
      timezone: input.timezone,
      default_language: input.defaultLanguage
    })
    .select("id")
    .single();

  if (organizationError || !organization) {
    if (organizationError?.code === "23505") {
      onboardingError("This organization slug is already used.");
    }

    onboardingError(organizationError?.message ?? "Organization creation failed.");
  }

  const membershipResult = await serviceClient
    .from("organization_members")
    .insert({
      organization_id: organization.id,
      user_id: userId,
      role: "owner"
    })
    .select("id")
    .single();

  if (membershipResult.error) {
    await serviceClient.from("organizations").delete().eq("id", organization.id);
    onboardingError(membershipResult.error.message);
  }

  const billingResult = await serviceClient
    .from("organization_billing_settings")
    .insert({
      organization_id: organization.id
    })
    .select("id")
    .single();

  if (billingResult.error) {
    await serviceClient.from("organizations").delete().eq("id", organization.id);
    onboardingError(billingResult.error.message);
  }
}
