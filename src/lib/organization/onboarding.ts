import { normalizePhoneToE164 } from "@/lib/customers/phone";
import type { Locale } from "@/lib/i18n/types";

export type OrganizationCreateInput = {
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  timezone: string;
  defaultLanguage: Locale;
};

const allowedOrganizationTimezones = new Set([
  "America/Toronto",
  "America/Montreal"
]);
const organizationSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const basicEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const email = input.email?.trim().toLowerCase() || null;
  const rawPhone = input.phone?.trim() || "";
  const timezone = input.timezone?.trim() || "America/Toronto";
  const defaultLanguage = input.defaultLanguage;

  if (!name) {
    errors.push("Business name is required.");
  }

  if (!slug) {
    errors.push("Slug is required.");
  }

  if (slug && !organizationSlugPattern.test(slug)) {
    errors.push("Slug must contain only lowercase letters, numbers, and hyphens.");
  }

  if (email && !basicEmailPattern.test(email)) {
    errors.push("Business email must be valid if provided.");
  }

  const normalizedPhone = rawPhone ? normalizePhoneToE164(rawPhone) : null;

  if (normalizedPhone && !normalizedPhone.ok) {
    errors.push(normalizedPhone.error);
  }

  if (!allowedOrganizationTimezones.has(timezone)) {
    errors.push("Timezone is not supported yet.");
  }

  if (defaultLanguage !== "en" && defaultLanguage !== "fr") {
    errors.push("Default language must be English or French.");
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
      email,
      phone: normalizedPhone?.ok ? normalizedPhone.phoneE164 : null,
      timezone,
      defaultLanguage: defaultLanguage as Locale
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
    return "/sign-in?notice=no_workspace";
  }

  return "allow";
}
