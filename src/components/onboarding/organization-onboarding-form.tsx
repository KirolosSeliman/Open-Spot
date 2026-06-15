"use client";

import { useState, type ChangeEvent } from "react";

import { PhoneInput } from "@/components/forms/phone-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField, Input, Select } from "@/components/ui/form-field";
import type { Locale } from "@/lib/i18n/types";
import { normalizeOrganizationSlug } from "@/lib/organization/onboarding";

type OrganizationOnboardingFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  error?: string;
  locale?: Locale;
};

const formCopy = {
  fr: {
    title: "Détails du commerce",
    name: "Nom du commerce",
    slug: "Slug public",
    slugHelp: "Utilisé dans les liens publics comme la page de liste d’attente.",
    email: "Email du commerce",
    phone: "Téléphone du commerce",
    phoneHelp: "Le +1 sera ajouté automatiquement.",
    timezone: "Fuseau horaire",
    defaultLanguage: "Langue par défaut",
    submit: "Créer l’organisation",
    errorTitle: "Impossible de créer l’organisation"
  },
  en: {
    title: "Business details",
    name: "Business name",
    slug: "Public slug",
    slugHelp: "Used in public links such as the waitlist page.",
    email: "Business email",
    phone: "Business phone",
    phoneHelp: "+1 will be added automatically.",
    timezone: "Timezone",
    defaultLanguage: "Default language",
    submit: "Create organization",
    errorTitle: "Unable to create organization"
  }
} as const;

export function OrganizationOnboardingForm({
  action,
  error,
  locale = "fr"
}: OrganizationOnboardingFormProps) {
  const t = formCopy[locale];
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const nextName = event.target.value;
    setName(nextName);

    if (!slugEdited) {
      setSlug(normalizeOrganizationSlug(nextName));
    }
  }

  function handleSlugChange(event: ChangeEvent<HTMLInputElement>) {
    setSlugEdited(true);
    setSlug(normalizeOrganizationSlug(event.target.value));
  }

  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-2xl font-black">{t.title}</h2>
      {error ? (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-black text-red-800">{t.errorTitle}</p>
          <p className="mt-1 text-sm font-bold text-red-700">{error}</p>
        </div>
      ) : null}
      <form action={action} className="mt-6 grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField htmlFor="name" label={t.name} required>
            <Input
              id="name"
              name="name"
              onChange={handleNameChange}
              required
              value={name}
            />
          </FormField>
          <FormField helperText={t.slugHelp} htmlFor="slug" label={t.slug}>
            <Input
              id="slug"
              name="slug"
              onChange={handleSlugChange}
              placeholder="salon-demo"
              value={slug}
            />
          </FormField>
          <FormField htmlFor="email" label={t.email}>
            <Input id="email" name="email" type="email" />
          </FormField>
          <FormField helperText={t.phoneHelp} htmlFor="phone" label={t.phone}>
            <PhoneInput
              className="min-h-11 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-4 focus:ring-blue-100"
              id="phone"
              name="phone"
            />
          </FormField>
          <FormField htmlFor="timezone" label={t.timezone}>
            <Select defaultValue="America/Toronto" id="timezone" name="timezone">
              <option value="America/Toronto">America/Toronto</option>
              <option value="America/Montreal">America/Montreal</option>
            </Select>
          </FormField>
          <FormField htmlFor="defaultLanguage" label={t.defaultLanguage}>
            <Select defaultValue="fr" id="defaultLanguage" name="defaultLanguage">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </Select>
          </FormField>
        </div>
        <Button className="w-full sm:w-auto" type="submit">
          {t.submit}
        </Button>
      </form>
    </Card>
  );
}
