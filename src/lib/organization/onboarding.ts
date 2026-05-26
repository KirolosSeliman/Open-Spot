import type { Locale } from "@/lib/i18n/types";

export type OrganizationCreateInput = {
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  defaultLanguage: Locale;
};

export function normalizeOrganizationSlug(input: string) {
  return input
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildOrganizationCreateInput(input: {
  name: string;
  slug?: string;
  email?: string | null;
  phone?: string | null;
  timezone?: string | null;
  defaultLanguage?: string | null;
}):
  | { ok: true; value: OrganizationCreateInput }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const name = input.name.trim();
  const slug = normalizeOrganizationSlug(input.slug?.trim() || name);
  const defaultLanguage: Locale = input.defaultLanguage === "fr" ? "fr" : "en";

  if (!name) {
    errors.push("Business name is required.");
  }

  if (!slug) {
    errors.push("Slug is required.");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors
    };
  }

  return {
    ok: true,
    value: {
      name,
      slug,
      email: input.email?.trim() || null,
      phone: input.phone?.trim() || null,
      timezone: input.timezone?.trim() || "America/Toronto",
      defaultLanguage
    }
  };
}

export function decideWorkspaceRedirect({
  isConfigured,
  hasUser,
  hasOrganization
}: {
  isConfigured: boolean;
  hasUser?: boolean;
  hasOrganization?: boolean;
}) {
  if (!isConfigured) {
    return "allow";
  }

  if (!hasUser) {
    return "/sign-in";
  }

  if (!hasOrganization) {
    return "/onboarding";
  }

  return "allow";
}
