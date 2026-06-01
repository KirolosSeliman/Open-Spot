import { createSupabasePublicServerClient } from "@/lib/supabase/public-server";

export type PublicWaitlistProfile = {
  id: string;
  slug: string;
  name: string;
  services: PublicWaitlistService[];
};

export type PublicWaitlistService = {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number | null;
  normalPriceCents: number | null;
};

type PublicWaitlistSignupData = {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  services: PublicWaitlistService[];
};

export async function getPublicWaitlistProfile(
  slug: string
): Promise<PublicWaitlistProfile | null> {
  const normalizedSlug = slug.trim();
  const supabase = createSupabasePublicServerClient();

  const { data, error } = await supabase.rpc("get_public_waitlist_signup_data", {
    organization_slug: normalizedSlug
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!isPublicWaitlistSignupData(data)) {
    return null;
  }

  return {
    id: data.organization.id,
    slug: data.organization.slug,
    name: data.organization.name,
    services: data.services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      normalPriceCents: service.normalPriceCents
    }))
  };
}

function isPublicWaitlistSignupData(
  value: unknown
): value is PublicWaitlistSignupData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PublicWaitlistSignupData>;
  return Boolean(
    candidate.organization &&
      typeof candidate.organization.id === "string" &&
      typeof candidate.organization.name === "string" &&
      typeof candidate.organization.slug === "string" &&
      Array.isArray(candidate.services)
  );
}
