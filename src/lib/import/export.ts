import type { CustomerWithConsent } from "@/lib/dashboard/operations-data";

export const importTemplateHeaders = [
  "full_name",
  "phone",
  "preferred_language",
  "service_interest",
  "consent_status",
  "consent_source",
  "consent_date",
  "source"
];

export function escapeCsvValue(value: string | number | boolean | null | undefined) {
  const text = String(value ?? "");

  if (/[",\r\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

export function buildCsv(rows: Array<Array<string | number | boolean | null | undefined>>) {
  return rows
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\r\n");
}

export function buildCustomerExportCsv(customers: CustomerWithConsent[]) {
  return buildCsv([
    [
      "full_name",
      "phone",
      "preferred_language",
      "consent_status",
      "source",
      "created_at",
      "updated_at"
    ],
    ...customers.map((customer) => [
      customer.full_name,
      customer.phone_e164,
      customer.preferred_language,
      customer.consentStatus,
      customer.source,
      customer.created_at,
      customer.updated_at
    ])
  ]);
}

export function buildImportTemplateCsv() {
  return buildCsv([
    importTemplateHeaders,
    [
      "Maya Example",
      "+15145550123",
      "fr",
      "Coupe femme",
      "opted_in",
      "qr_waitlist",
      "2026-05-29",
      "manual_template"
    ]
  ]);
}
