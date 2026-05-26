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

type MembershipRow = {
  organization_id: string;
  role: "owner" | "manager" | "staff";
};

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  default_language: "en" | "fr";
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
    .order("created_at", { ascending: true })
    .limit(1);

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const membership = (memberships?.[0] ?? null) as MembershipRow | null;
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

  if (organizationError) {
    throw new Error(organizationError.message);
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

  const organizationRow = organization as OrganizationRow;

  return {
    status: "ready",
    user: {
      id: currentUser.id,
      email: currentUser.email
    },
    organization: {
      id: organizationRow.id,
      name: organizationRow.name,
      slug: organizationRow.slug,
      email: organizationRow.email,
      phone: organizationRow.phone,
      timezone: organizationRow.timezone,
      defaultLanguage: organizationRow.default_language,
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
