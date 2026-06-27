import type { SupabaseClient } from "@supabase/supabase-js";

import {
  generateOpeningConfirmationSmsMessage,
  generateOpeningSmsMessage,
  type OpeningConfirmationSmsInput,
  type OpeningSmsInput
} from "@/lib/sms/message-generator";
import { renderSmsTemplate } from "@/lib/sms/template-renderer";
import {
  getDefaultTemplateBody,
  type SmsTemplateKey,
  type SmsTemplateLanguage
} from "@/lib/sms/template-variables";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

export type OrganizationSmsTemplateRecord = {
  id: string;
  templateKey: SmsTemplateKey;
  language: SmsTemplateLanguage;
  body: string;
  isActive: boolean;
  updatedAt: string;
};

export type OpeningAlertTemplateContext = {
  businessName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  clientName?: string | null;
  businessAddress?: string | null;
  employeeName?: string | null;
  estimatedPrice?: string | null;
  replyKeyword?: string | null;
};

export type OpeningConfirmationTemplateContext = {
  businessName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  clientName?: string | null;
  businessAddress?: string | null;
  employeeName?: string | null;
  estimatedPrice?: string | null;
  replyKeyword?: string | null;
};

export async function loadOrganizationSmsTemplates(
  supabase: DbClient,
  organizationId: string
) {
  const { data, error } = await supabase
    .from("sms_templates")
    .select("id, template_key, language, body, is_active, updated_at")
    .eq("organization_id", organizationId)
    .in("template_key", ["opening_alert", "opening_confirmation"])
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .filter(
      (
        row
      ): row is typeof row & {
        template_key: SmsTemplateKey;
        language: SmsTemplateLanguage;
      } =>
        (row.template_key === "opening_alert" ||
          row.template_key === "opening_confirmation") &&
        (row.language === "fr" || row.language === "en")
    )
    .map((row) => ({
      id: row.id,
      templateKey: row.template_key,
      language: row.language,
      body: row.body,
      isActive: row.is_active,
      updatedAt: row.updated_at
    }));
}

export async function loadOrganizationSmsTemplate(
  supabase: DbClient,
  {
    organizationId,
    templateKey,
    language
  }: {
    organizationId: string;
    templateKey: SmsTemplateKey;
    language: SmsTemplateLanguage;
  }
) {
  const { data, error } = await supabase
    .from("sms_templates")
    .select("id, template_key, language, body, is_active, updated_at")
    .eq("organization_id", organizationId)
    .eq("template_key", templateKey)
    .eq("language", language)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    templateKey: data.template_key as SmsTemplateKey,
    language: data.language as SmsTemplateLanguage,
    body: data.body,
    isActive: data.is_active,
    updatedAt: data.updated_at
  } satisfies OrganizationSmsTemplateRecord;
}

export async function upsertOrganizationSmsTemplate(
  supabase: DbClient,
  {
    organizationId,
    templateKey,
    language,
    body
  }: {
    organizationId: string;
    templateKey: SmsTemplateKey;
    language: SmsTemplateLanguage;
    body: string;
  }
) {
  const existing = await loadOrganizationSmsTemplate(supabase, {
    organizationId,
    templateKey,
    language
  });

  if (existing) {
    const { data, error } = await supabase
      .from("sms_templates")
      .update({
        body: body.trim(),
        is_active: true
      })
      .eq("id", existing.id)
      .eq("organization_id", organizationId)
      .select("id, template_key, language, body, is_active, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      templateKey: data.template_key as SmsTemplateKey,
      language: data.language as SmsTemplateLanguage,
      body: data.body,
      isActive: data.is_active,
      updatedAt: data.updated_at
    } satisfies OrganizationSmsTemplateRecord;
  }

  const { data, error } = await supabase
    .from("sms_templates")
    .insert({
      organization_id: organizationId,
      template_key: templateKey,
      language,
      body: body.trim(),
      is_active: true
    })
    .select("id, template_key, language, body, is_active, updated_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.id,
    templateKey: data.template_key as SmsTemplateKey,
    language: data.language as SmsTemplateLanguage,
    body: data.body,
    isActive: data.is_active,
    updatedAt: data.updated_at
  } satisfies OrganizationSmsTemplateRecord;
}

function buildOpeningAlertValues(context: OpeningAlertTemplateContext) {
  return {
    "{business_name}": context.businessName,
    "{service_name}": context.serviceName,
    "{appointment_date}": context.appointmentDate,
    "{appointment_time}": context.appointmentTime,
    "{client_name}": context.clientName ?? "",
    "{business_address}": context.businessAddress ?? "",
    "{employee_name}": context.employeeName ?? "",
    "{estimated_price}": context.estimatedPrice ?? "",
    "{reply_keyword}": context.replyKeyword ?? ""
  };
}

function buildOpeningConfirmationValues(
  context: OpeningConfirmationTemplateContext
) {
  return {
    "{business_name}": context.businessName,
    "{service_name}": context.serviceName,
    "{appointment_date}": context.appointmentDate,
    "{appointment_time}": context.appointmentTime,
    "{client_name}": context.clientName ?? "",
    "{business_address}": context.businessAddress ?? "",
    "{employee_name}": context.employeeName ?? "",
    "{estimated_price}": context.estimatedPrice ?? "",
    "{reply_keyword}": context.replyKeyword ?? ""
  };
}

export async function resolveOpeningAlertSmsBody(
  supabase: DbClient,
  {
    organizationId,
    language,
    context,
    fallbackInput
  }: {
    organizationId: string;
    language: SmsTemplateLanguage;
    context: OpeningAlertTemplateContext;
    fallbackInput: OpeningSmsInput;
  }
) {
  const template = await loadOrganizationSmsTemplate(supabase, {
    organizationId,
    templateKey: "opening_alert",
    language
  });

  if (template) {
    const body = renderSmsTemplate(
      template.body,
      buildOpeningAlertValues(context)
    ).trim();

    if (body) {
      return body;
    }
  }

  return generateOpeningSmsMessage(fallbackInput).body;
}

export async function resolveOpeningConfirmationSmsBody(
  supabase: DbClient,
  {
    organizationId,
    language,
    context,
    fallbackInput
  }: {
    organizationId: string;
    language: SmsTemplateLanguage;
    context: OpeningConfirmationTemplateContext;
    fallbackInput: OpeningConfirmationSmsInput;
  }
) {
  const template = await loadOrganizationSmsTemplate(supabase, {
    organizationId,
    templateKey: "opening_confirmation",
    language
  });

  if (template) {
    const body = renderSmsTemplate(
      template.body,
      buildOpeningConfirmationValues(context)
    ).trim();

    if (body) {
      return body;
    }
  }

  return generateOpeningConfirmationSmsMessage(fallbackInput).body;
}

export function getInitialTemplateEditorState({
  templateKey,
  language,
  savedBody
}: {
  templateKey: SmsTemplateKey;
  language: SmsTemplateLanguage;
  savedBody?: string | null;
}) {
  return {
    body: savedBody?.trim() || getDefaultTemplateBody(templateKey, language)
  };
}
