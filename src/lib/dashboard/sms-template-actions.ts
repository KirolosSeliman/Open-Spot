"use server";

import { revalidatePath } from "next/cache";

import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { canManageOrganizationSettings } from "@/lib/organization/permissions";
import {
  deactivateOrganizationSmsTemplate,
  loadOrganizationSmsTemplates,
  upsertOrganizationSmsTemplate
} from "@/lib/sms/organization-templates";
import {
  SMS_TEMPLATE_DEFINITIONS,
  validateSmsTemplateInput,
  type SmsTemplateKey,
  type SmsTemplateLanguage
} from "@/lib/sms/template-variables";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireReadyWorkspaceOrganization() {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    throw new Error(
      "Supabase doit être configuré avant d'accéder aux templates SMS."
    );
  }

  return workspace.organization;
}

async function requireTemplateEditorOrganization() {
  const organization = await requireReadyWorkspaceOrganization();

  if (!canManageOrganizationSettings(organization.role)) {
    throw new Error(
      "Seuls le propriétaire et le gestionnaire peuvent modifier les templates SMS."
    );
  }

  return organization;
}

function parseTemplateKey(value: FormDataEntryValue | null): SmsTemplateKey {
  if (value === "opening_alert" || value === "opening_confirmation") {
    return value;
  }

  return "opening_alert";
}

function parseTemplateLanguage(
  value: FormDataEntryValue | null
): SmsTemplateLanguage {
  return value === "en" ? "en" : "fr";
}

export async function loadSmsTemplatesPageData() {
  const organization = await requireReadyWorkspaceOrganization();
  const supabase = await createSupabaseServerClient();
  const templates = await loadOrganizationSmsTemplates(
    supabase,
    organization.id
  );

  return {
    organizationId: organization.id,
    canEdit: canManageOrganizationSettings(organization.role),
    templates
  };
}

export async function saveSmsTemplateAction(formData: FormData) {
  try {
    const organization = await requireTemplateEditorOrganization();
    const templateKey = parseTemplateKey(formData.get("templateKey"));
    const language = parseTemplateLanguage(formData.get("language"));
    const name = String(formData.get("name") ?? "");
    const body = String(formData.get("body") ?? "");
    const validation = validateSmsTemplateInput({
      templateKey,
      language,
      name,
      body
    });

    if (!validation.isValid) {
      return {
        ok: false as const,
        message: "Impossible d'enregistrer le template pour le moment.",
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    const supabase = await createSupabaseServerClient();
    const savedTemplate = await upsertOrganizationSmsTemplate(supabase, {
      organizationId: organization.id,
      templateKey,
      language,
      body
    });

    revalidatePath("/dashboard/messages");

    return {
      ok: true as const,
      message: "Template SMS enregistré.",
      warnings: validation.warnings,
      templateKey,
      language,
      savedBody: savedTemplate.body,
      savedTemplate,
      templateLabel: SMS_TEMPLATE_DEFINITIONS[templateKey].label[language]
    };
  } catch {
    return {
      ok: false as const,
      message: "Impossible d'enregistrer le template pour le moment.",
      errors: [],
      warnings: []
    };
  }
}

export async function deleteSmsTemplateAction(formData: FormData) {
  try {
    const organization = await requireTemplateEditorOrganization();
    const templateKey = parseTemplateKey(formData.get("templateKey"));
    const language = parseTemplateLanguage(formData.get("language"));
    const supabase = await createSupabaseServerClient();
    const deleted = await deactivateOrganizationSmsTemplate(supabase, {
      organizationId: organization.id,
      templateKey,
      language
    });

    if (!deleted) {
      return {
        ok: false as const,
        message: "Impossible de supprimer le template pour le moment."
      };
    }

    revalidatePath("/dashboard/messages");

    return {
      ok: true as const,
      message: "Template SMS supprimé.",
      templateKey,
      language
    };
  } catch {
    return {
      ok: false as const,
      message: "Impossible de supprimer le template pour le moment."
    };
  }
}
