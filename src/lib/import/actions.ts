"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  type CustomerImportValidatedRow,
  mapCsvToCustomerImportRows,
  validateCustomerImportRows
} from "@/lib/import/customer-import";
import { mapPastedTextToCustomerImportRows } from "@/lib/import/paste";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import { canManageCustomers } from "@/lib/organization/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ImportSource = "csv_import" | "copy_paste";

function importError(message: string, path = "/dashboard/import"): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function previewCustomerCsvImportAction(formData: FormData) {
  const csv = String(formData.get("csv") ?? "");

  if (!csv.trim()) {
    importError("CSV content is required.");
  }

  redirect(`/dashboard/import?preview=${encodeURIComponent(csv)}`);
}

export async function confirmCustomerCsvImportAction(formData: FormData) {
  const csv = String(formData.get("csv") ?? "");
  const fileName = String(formData.get("fileName") ?? "pasted-csv.csv");
  const rows = mapCsvToCustomerImportRows(csv);
  const validation = validateCustomerImportRows(rows);

  await importValidatedCustomerRows({
    rows: validation.rows,
    fileName,
    source: "csv_import",
    successRedirect: "/dashboard/import?imported=1",
    errorPath: "/dashboard/import"
  });
}

export async function previewPastedCustomerImportAction(formData: FormData) {
  const pastedText = String(formData.get("pastedText") ?? "");

  if (!pastedText.trim()) {
    importError("Pasted client text is required.", "/dashboard/import/paste");
  }

  redirect(`/dashboard/import/paste?preview=${encodeURIComponent(pastedText)}`);
}

export async function confirmPastedCustomerImportAction(formData: FormData) {
  const pastedText = String(formData.get("pastedText") ?? "");
  const hasConsentProof = formData.get("hasConsentProof") === "on";
  const rows = mapPastedTextToCustomerImportRows(pastedText, {
    hasConsentProof
  });
  const validation = validateCustomerImportRows(rows);

  await importValidatedCustomerRows({
    rows: validation.rows,
    fileName: "copy-paste-import.txt",
    source: "copy_paste",
    successRedirect: "/dashboard/import/paste?imported=1",
    errorPath: "/dashboard/import/paste"
  });
}

async function importValidatedCustomerRows({
  rows,
  fileName,
  source,
  successRedirect,
  errorPath
}: {
  rows: CustomerImportValidatedRow[];
  fileName: string;
  source: ImportSource;
  successRedirect: string;
  errorPath: string;
}) {
  const validation = validateCustomerImportRows(rows.map((row) => row.input));
  const validRows = validation.rows.filter((row) => row.status === "valid");
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    importError("Supabase must be configured before importing clients.", errorPath);
  }

  if (!canManageCustomers(workspace.organization.role)) {
    importError("You do not have permission to import clients.", errorPath);
  }

  const supabase = await createSupabaseServerClient();
  const organizationId = workspace.organization.id;
  let createdCount = 0;
  let updatedCount = 0;
  let optedOutPreservedCount = 0;
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { error: batchError } = await supabase.from("import_batches").insert({
    organization_id: organizationId,
    file_name: fileName,
    total_rows: validation.summary.totalRows,
    valid_rows: validation.summary.validRows,
    invalid_rows: validation.rows.filter((row) => row.status === "invalid").length,
    duplicate_rows: validation.summary.duplicateRows,
    created_by: user?.id ?? null
  });

  if (batchError) {
    importError(batchError.message, errorPath);
  }

  for (const row of validRows) {
    const phoneE164 = row.phoneE164 ?? "";
    const { data: existingCustomer, error: existingError } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("phone_e164", phoneE164)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingError) {
      importError(existingError.message, errorPath);
    }

    const customerWrite = existingCustomer
      ? await supabase
          .from("customers")
          .update({
            full_name: row.input.fullName,
            email: row.input.email || null,
            preferred_language:
              row.input.preferredLanguage === "en" ? "en" : "fr",
            notes: row.input.notes || null,
            source
          })
          .eq("organization_id", organizationId)
          .eq("id", existingCustomer.id)
          .select("id")
          .single()
      : await supabase
          .from("customers")
          .insert({
            organization_id: organizationId,
            full_name: row.input.fullName,
            phone_e164: phoneE164,
            email: row.input.email || null,
            preferred_language:
              row.input.preferredLanguage === "en" ? "en" : "fr",
            notes: row.input.notes || null,
            source
          })
          .select("id")
          .single();

    if (customerWrite.error || !customerWrite.data) {
      importError(
        customerWrite.error?.message ?? "Customer import failed.",
        errorPath
      );
    }

    if (existingCustomer) {
      updatedCount += 1;
    } else {
      createdCount += 1;
    }

    const now = new Date().toISOString();
    const { data: existingConsent, error: existingConsentError } = await supabase
      .from("sms_consents")
      .select("status")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerWrite.data.id)
      .maybeSingle();

    if (existingConsentError) {
      importError(existingConsentError.message, errorPath);
    }

    const finalConsentStatus =
      existingConsent?.status === "opted_out" ? "opted_out" : row.consentStatus;

    if (
      existingConsent?.status === "opted_out" &&
      row.consentStatus !== "opted_out"
    ) {
      optedOutPreservedCount += 1;
    }

    const { error: consentError } = await supabase.from("sms_consents").upsert(
      {
        organization_id: organizationId,
        customer_id: customerWrite.data.id,
        phone_e164: phoneE164,
        status: finalConsentStatus,
        source: row.input.source || source,
        consent_text:
          finalConsentStatus === "opted_in"
            ? `${source} explicitly marked SMS consent.`
            : null,
        consented_at: finalConsentStatus === "opted_in" ? now : null,
        unsubscribed_at:
          finalConsentStatus === "opted_out"
            ? existingConsent?.status === "opted_out"
              ? undefined
              : now
            : null
      },
      {
        onConflict: "organization_id,customer_id"
      }
    );

    if (consentError) {
      importError(consentError.message, errorPath);
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/import");
  revalidatePath("/dashboard/import/paste");
  const separator = successRedirect.includes("?") ? "&" : "?";
  redirect(
    `${successRedirect}${separator}created=${createdCount}&updated=${updatedCount}&invalid=${
      validation.rows.filter((row) => row.status === "invalid").length
    }&duplicates=${validation.summary.duplicateRows}&optedOutPreserved=${optedOutPreservedCount}`
  );
}
