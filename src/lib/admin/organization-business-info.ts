import { normalizePhoneToE164 } from "@/lib/customers/phone";
import {
  buildOrganizationCreateInput,
  normalizeOrganizationSlug
} from "@/lib/organization/onboarding";
import type { Locale } from "@/lib/i18n/types";

export type OrganizationBusinessInfoInput = {
  name: string;
  slug: string;
  email: string;
  phone: string;
  timezone: string;
  defaultLanguage: Locale;
  contactName: string;
  businessType: string;
  bookingSystem: string;
  cancellationVolume: string;
  businessAddress: string;
  internalNotes: string;
};

export function parseOrganizationBusinessInfoInput(input: {
  name: string;
  slug?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  defaultLanguage?: string;
  contactName?: string;
  businessType?: string;
  bookingSystem?: string;
  cancellationVolume?: string;
  businessAddress?: string;
  internalNotes?: string;
}):
  | { ok: true; value: OrganizationBusinessInfoInput }
  | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const name = input.name.trim();

  if (!name) {
    errors.push("Veuillez entrer un nom de commerce.");
  }

  const organizationPayload = buildOrganizationCreateInput({
    name,
    slug: input.slug,
    email: input.email,
    phone: input.phone,
    timezone: input.timezone,
    defaultLanguage: input.defaultLanguage
  });

  if (!organizationPayload.ok) {
    for (const error of organizationPayload.errors) {
      if (error.includes("Business email must be valid")) {
        errors.push("Veuillez entrer une adresse email valide.");
      } else if (error.includes("phone number")) {
        errors.push("Veuillez entrer un numéro de téléphone valide.");
      } else if (
        error.includes("Timezone") ||
        error.includes("Default language") ||
        error.includes("Slug")
      ) {
        errors.push(error);
      }
    }
  }

  const contactName = input.contactName?.trim() ?? "";
  const businessType = input.businessType?.trim() ?? "";
  const bookingSystem = input.bookingSystem?.trim() ?? "";
  const cancellationVolume = input.cancellationVolume?.trim() ?? "";
  const businessAddress = input.businessAddress?.trim() ?? "";
  const internalNotes = input.internalNotes?.trim() ?? "";

  if (errors.length > 0 || !organizationPayload.ok) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name: organizationPayload.value.name,
      slug: organizationPayload.value.slug,
      email: organizationPayload.value.email ?? "",
      phone: organizationPayload.value.phone ?? "",
      timezone: organizationPayload.value.timezone,
      defaultLanguage: organizationPayload.value.defaultLanguage,
      contactName,
      businessType,
      bookingSystem,
      cancellationVolume,
      businessAddress,
      internalNotes
    }
  };
}

export function organizationBusinessInfoFromFormData(formData: FormData) {
  return parseOrganizationBusinessInfoInput({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    defaultLanguage: String(formData.get("defaultLanguage") ?? "fr"),
    contactName: String(formData.get("contactName") ?? ""),
    businessType: String(formData.get("businessType") ?? ""),
    bookingSystem: String(formData.get("bookingSystem") ?? ""),
    cancellationVolume: String(formData.get("cancellationVolume") ?? ""),
    businessAddress: String(formData.get("businessAddress") ?? ""),
    internalNotes: String(formData.get("internalNotes") ?? "")
  });
}

export function normalizeBusinessSlugInput(input: string) {
  return normalizeOrganizationSlug(input);
}

export function normalizeBusinessPhoneInput(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = normalizePhoneToE164(trimmed);
  return normalized.ok ? normalized.phoneE164 : null;
}
