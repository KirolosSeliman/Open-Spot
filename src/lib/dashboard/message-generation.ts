import type { Locale } from "./types";

export type CancellationSmsInput = {
  locale: Locale;
  businessName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  estimatedPrice?: string;
  employeeName?: string;
};

export type SmsTemplateVariables = {
  business_name: string;
  service_name: string;
  appointment_date: string;
  appointment_time: string;
  employee_name: string;
  estimated_price: string;
  reply_keyword: string;
};

export const defaultCancellationTemplates = {
  fr:
    "Bonjour, une place vient de se libérer chez {business_name} le {appointment_date} à {appointment_time} pour {service_name}. Répondez OUI si vous êtes intéressé. Votre rendez-vous sera confirmé seulement après validation par notre équipe.",
  en:
    "Hi, a spot just opened at {business_name} on {appointment_date} at {appointment_time} for {service_name}. Reply YES if you are interested. Your appointment will only be confirmed after our team validates it."
} as const;

export function buildTemplateVariables(
  input: CancellationSmsInput
): SmsTemplateVariables {
  return {
    business_name: input.businessName,
    service_name: input.serviceName,
    appointment_date: input.appointmentDate,
    appointment_time: input.appointmentTime,
    employee_name: input.employeeName ?? "",
    estimated_price: input.estimatedPrice ?? "",
    reply_keyword: input.locale === "fr" ? "OUI" : "YES"
  };
}

export function renderSmsTemplate(
  template: string,
  variables: SmsTemplateVariables
) {
  return template.replace(/\{([a-z_]+)\}/g, (match, key: string) => {
    return variables[key as keyof SmsTemplateVariables] ?? match;
  });
}

export function generateCancellationSms(input: CancellationSmsInput) {
  return renderSmsTemplate(
    defaultCancellationTemplates[input.locale],
    buildTemplateVariables(input)
  );
}

export function countSmsCharacters(message: string) {
  return [...message].length;
}

export function estimateSmsSegments(message: string) {
  const characters = countSmsCharacters(message);

  if (characters <= 160) {
    return 1;
  }

  return Math.ceil(characters / 153);
}
