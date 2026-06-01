import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env/config";
import { decideWorkspaceRedirect } from "@/lib/organization/onboarding";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActiveOrganization = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  defaultLanguage: "en" | "fr";
  role: "owner" | "manager" | "staff";
};

export type OrganizationWorkspace =
  | {
      status: "unconfigured";
      organization: null;
      user: null;
      counts: {
        services: number;
        customers: number;
      };
    }
  | {
      status: "ready";
      organization: ActiveOrganization;
      user: {
        id: string;
        email?: string;
      };
      counts: {
        services: number;
        customers: number;
      };
    };

export async function getActiveOrganizationWorkspace(): Promise<OrganizationWorkspace> {
  if (!isSupabaseConfigured()) {
    return {
      status: "unconfigured",
      organization: null,
      user: null,
      counts: {
        services: 0,
        customers: 0
      }
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const unauthenticatedRedirect = decideWorkspaceRedirect({
    isConfigured: true,
    hasUser: Boolean(user)
  });

  if (!user && unauthenticatedRedirect !== "allow") {
    redirect(unauthenticatedRedirect);
  }

  if (!user) {
    throw new Error("Authenticated user is required.");
  }

  const currentUser = user;

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", currentUser.id)
    .eq("status", "active")
    // Temporary single-org mode still orders deterministically for old data and
    // future switcher work.
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const membership = memberships?.[0] ?? null;
  const organizationRedirect = decideWorkspaceRedirect({
    isConfigured: true,
    hasUser: true,
    hasOrganization: Boolean(membership)
  });

  if (!membership && organizationRedirect !== "allow") {
    redirect(organizationRedirect);
  }

  if (!membership) {
    throw new Error("Organization membership is required.");
  }

  const activeMembership = membership;

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id, name, slug, email, phone, timezone, default_language")
    .eq("id", activeMembership.organization_id)
    .single();

  if (organizationError || !organization) {
    throw new Error(organizationError?.message ?? "Organization not found.");
  }

  const [servicesResult, customersResult] = await Promise.all([
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", activeMembership.organization_id),
    supabase
      .from("customers")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", activeMembership.organization_id)
  ]);

  return {
    status: "ready",
    user: {
      id: currentUser.id,
      email: currentUser.email
    },
    organization: {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      email: organization.email,
      phone: organization.phone,
      timezone: organization.timezone,
      defaultLanguage: organization.default_language,
      role: activeMembership.role
    },
    counts: {
      services: servicesResult.count ?? 0,
      customers: customersResult.count ?? 0
    }
  };
}

export async function redirectAuthenticatedUserByWorkspace() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (membership && membership.length > 0) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}

export async function requireOrganizationOnboardingUser() {
  if (!isSupabaseConfigured()) {
    return {
      status: "unconfigured" as const
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (membership && membership.length > 0) {
    redirect("/dashboard");
  }

  return {
    status: "ready" as const,
    user: {
      id: user.id,
      email: user.email
    }
  };
}
