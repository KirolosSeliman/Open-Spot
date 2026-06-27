import type { OrganizationSmsTemplateRecord } from "@/lib/sms/organization-templates";
import {
  getDefaultTemplateBody,
  getDefaultTemplateName,
  SMS_TEMPLATE_DEFINITIONS,
  type SmsTemplateKey,
  type SmsTemplateLanguage
} from "@/lib/sms/template-variables";

export type SmsTemplateSelectionId = `${SmsTemplateKey}:${SmsTemplateLanguage}`;

export type SmsTemplateSelectionOption = {
  id: SmsTemplateSelectionId;
  templateKey: SmsTemplateKey;
  language: SmsTemplateLanguage;
  name: string;
  body: string;
  isSaved: boolean;
  updatedAt: string | null;
};

const TEMPLATE_KEYS: SmsTemplateKey[] = ["opening_alert", "opening_confirmation"];
const TEMPLATE_LANGUAGES: SmsTemplateLanguage[] = ["fr", "en"];

export function buildTemplateSelectionId(
  templateKey: SmsTemplateKey,
  language: SmsTemplateLanguage
): SmsTemplateSelectionId {
  return `${templateKey}:${language}`;
}

export function parseTemplateSelectionId(
  value: string
): { templateKey: SmsTemplateKey; language: SmsTemplateLanguage } | null {
  const [templateKey, language] = value.split(":");

  if (
    (templateKey === "opening_alert" || templateKey === "opening_confirmation") &&
    (language === "fr" || language === "en")
  ) {
    return { templateKey, language };
  }

  return null;
}

export function buildSmsTemplateSelectionOptions(
  savedTemplates: OrganizationSmsTemplateRecord[]
): SmsTemplateSelectionOption[] {
  const savedById = new Map(
    savedTemplates.map((template) => [
      buildTemplateSelectionId(template.templateKey, template.language),
      template
    ])
  );

  return TEMPLATE_KEYS.flatMap((templateKey) =>
    TEMPLATE_LANGUAGES.map((language) => {
      const id = buildTemplateSelectionId(templateKey, language);
      const saved = savedById.get(id);

      return {
        id,
        templateKey,
        language,
        name: getDefaultTemplateName(templateKey, language),
        body: saved?.body ?? getDefaultTemplateBody(templateKey, language),
        isSaved: Boolean(saved),
        updatedAt: saved?.updatedAt ?? null
      };
    })
  );
}

export function formatTemplateSelectionLabel(option: SmsTemplateSelectionOption) {
  const typeLabel = SMS_TEMPLATE_DEFINITIONS[option.templateKey].label.fr;
  const languageLabel = option.language === "fr" ? "FR" : "EN";
  const savedLabel = option.isSaved ? " · Enregistré" : " · Par défaut";

  return `${typeLabel} — ${languageLabel}${savedLabel}`;
}
