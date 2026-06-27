import {
  SMS_TEMPLATE_PREVIEW_SAMPLES,
  type SmsTemplateLanguage,
  type SmsTemplateVariable
} from "@/lib/sms/template-variables";

export type SmsTemplateRenderValues = Partial<
  Record<SmsTemplateVariable, string>
>;

export function renderSmsTemplatePreview(
  body: string,
  language: SmsTemplateLanguage
) {
  return renderSmsTemplate(body, {
    "{business_name}": SMS_TEMPLATE_PREVIEW_SAMPLES["{business_name}"][language],
    "{service_name}": SMS_TEMPLATE_PREVIEW_SAMPLES["{service_name}"][language],
    "{appointment_date}":
      SMS_TEMPLATE_PREVIEW_SAMPLES["{appointment_date}"][language],
    "{appointment_time}":
      SMS_TEMPLATE_PREVIEW_SAMPLES["{appointment_time}"][language],
    "{client_name}": SMS_TEMPLATE_PREVIEW_SAMPLES["{client_name}"][language],
    "{business_address}":
      SMS_TEMPLATE_PREVIEW_SAMPLES["{business_address}"][language],
    "{employee_name}":
      SMS_TEMPLATE_PREVIEW_SAMPLES["{employee_name}"][language],
    "{estimated_price}":
      SMS_TEMPLATE_PREVIEW_SAMPLES["{estimated_price}"][language],
    "{reply_keyword}":
      SMS_TEMPLATE_PREVIEW_SAMPLES["{reply_keyword}"][language]
  });
}

export function renderSmsTemplate(
  body: string,
  values: SmsTemplateRenderValues
) {
  let rendered = body;

  for (const [variable, value] of Object.entries(values)) {
    if (typeof value === "string" && value.trim()) {
      rendered = rendered.replaceAll(variable, value.trim());
    }
  }

  return rendered;
}

export function hasUnresolvedTemplateVariables(body: string) {
  return /\{[a-z_]+\}/i.test(body);
}
