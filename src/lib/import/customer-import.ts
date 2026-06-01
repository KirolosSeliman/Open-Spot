import { mapConsentStatus, type ConsentStatus } from "@/lib/customers/consent";
import {
  invalidNorthAmericanPhoneMessage,
  normalizePhoneToE164
} from "@/lib/customers/phone";
import { parseCsv } from "@/lib/import/csv";

export type CustomerImportInputRow = {
  fullName: string;
  phone: string;
  email?: string;
  service?: string;
  notes?: string;
  consentStatus?: string;
  consentSource?: string;
  consentDate?: string;
  source?: string;
  hasConsentProof: boolean;
  preferredLanguage?: string;
};

export type CustomerImportValidatedRow = {
  input: CustomerImportInputRow;
  status: "valid" | "duplicate" | "invalid";
  phoneE164?: string;
  consentStatus: ConsentStatus;
  errors: string[];
};

export type CustomerImportSummary = {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidPhoneRows: number;
  needsConsentRows: number;
  optedInRows: number;
  optedOutRows: number;
};

const dangerousFormulaPattern = /^[=+\-@]/;

function hasDangerousSpreadsheetValue(row: CustomerImportInputRow) {
  return [
    row.fullName,
    row.email,
    row.service,
    row.notes,
    row.consentStatus,
    row.consentSource,
    row.consentDate,
    row.source,
    row.preferredLanguage
  ].some((value) => dangerousFormulaPattern.test((value ?? "").trim()));
}

function normalizePreferredLanguage(language?: string) {
  const normalized = language?.trim().toLowerCase();

  if (!normalized) {
    return "fr";
  }

  if (["fr", "french", "francais", "français"].includes(normalized)) {
    return "fr";
  }

  if (["en", "english", "anglais"].includes(normalized)) {
    return "en";
  }

  return null;
}

export function validateCustomerImportRows(rows: CustomerImportInputRow[]) {
  const seenPhones = new Set<string>();
  const validatedRows: CustomerImportValidatedRow[] = rows.map((row) => {
    const errors: string[] = [];
    const normalizedPhone = normalizePhoneToE164(row.phone);
    const consentStatus = mapConsentStatus(
      row.consentStatus,
      row.hasConsentProof
    );

    if (!row.fullName.trim()) {
      errors.push("Customer name is required.");
    }

    if (!normalizePreferredLanguage(row.preferredLanguage)) {
      errors.push("Preferred language must be fr, en, or blank.");
    }

    if (hasDangerousSpreadsheetValue(row)) {
      errors.push("Spreadsheet formulas are not allowed in imported text fields.");
    }

    if (!normalizedPhone.ok) {
      errors.push(normalizedPhone.error);
      return {
        input: row,
        status: "invalid",
        consentStatus,
        errors
      };
    }

    if (seenPhones.has(normalizedPhone.phoneE164)) {
      return {
        input: row,
        status: "duplicate",
        phoneE164: normalizedPhone.phoneE164,
        consentStatus,
        errors: ["Duplicate phone number in uploaded file."]
      };
    }

    seenPhones.add(normalizedPhone.phoneE164);

    if (errors.length > 0) {
      return {
        input: row,
        status: "invalid",
        phoneE164: normalizedPhone.phoneE164,
        consentStatus,
        errors
      };
    }

    return {
      input: row,
      status: "valid",
      phoneE164: normalizedPhone.phoneE164,
      consentStatus,
      errors: []
    };
  });

  return {
    rows: validatedRows,
    summary: summarizeRows(validatedRows)
  };
}

const headerAliases = {
  fullName: new Set([
    "name",
    "full_name",
    "nom",
    "nom client",
    "full name",
    "client name",
    "customer name"
  ]),
  phone: new Set([
    "phone",
    "phone number",
    "telephone",
    "téléphone",
    "tel",
    "cell",
    "mobile"
  ]),
  email: new Set(["email", "courriel"]),
  preferredLanguage: new Set(["language", "langue"]),
  service: new Set([
    "service",
    "service interest",
    "service_interest",
    "service demandé",
    "service demande"
  ]),
  notes: new Set(["notes", "note"]),
  consentStatus: new Set([
    "consent",
    "consent status",
    "sms consent",
    "sms_consent",
    "permission sms",
    "consentement"
  ]),
  consentSource: new Set(["consent_source", "consent source", "source consentement"]),
  consentDate: new Set(["consent_date", "consent date", "date consentement", "date"]),
  source: new Set(["source", "origine"])
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase();
}

function findColumn(headers: string[], aliases: Set<string>) {
  return headers.findIndex((header) => aliases.has(normalizeHeader(header)));
}

function valueAt(values: string[], index: number) {
  return index >= 0 ? values[index] ?? "" : "";
}

export function mapCsvToCustomerImportRows(csv: string): CustomerImportInputRow[] {
  const parsed = parseCsv(csv);
  const nameIndex = findColumn(parsed.headers, headerAliases.fullName);
  const phoneIndex = findColumn(parsed.headers, headerAliases.phone);
  const emailIndex = findColumn(parsed.headers, headerAliases.email);
  const languageIndex = findColumn(
    parsed.headers,
    headerAliases.preferredLanguage
  );
  const serviceIndex = findColumn(parsed.headers, headerAliases.service);
  const notesIndex = findColumn(parsed.headers, headerAliases.notes);
  const consentIndex = findColumn(parsed.headers, headerAliases.consentStatus);
  const consentSourceIndex = findColumn(
    parsed.headers,
    headerAliases.consentSource
  );
  const consentDateIndex = findColumn(parsed.headers, headerAliases.consentDate);
  const sourceIndex = findColumn(parsed.headers, headerAliases.source);

  return parsed.rows.map((row) => {
    const consentStatus = valueAt(row.values, consentIndex);
    const consentSource = valueAt(row.values, consentSourceIndex);
    const consentDate = valueAt(row.values, consentDateIndex);
    const explicitYes = /^(yes|oui|true|1)$/i.test(consentStatus.trim());
    const explicitOptedIn = /^opted_in$/i.test(consentStatus.trim());

    return {
      fullName: valueAt(row.values, nameIndex),
      phone: valueAt(row.values, phoneIndex),
      email: valueAt(row.values, emailIndex) || undefined,
      preferredLanguage: valueAt(row.values, languageIndex) || undefined,
      service: valueAt(row.values, serviceIndex) || undefined,
      notes: valueAt(row.values, notesIndex) || undefined,
      consentStatus,
      consentSource: consentSource || undefined,
      consentDate: consentDate || undefined,
      source: valueAt(row.values, sourceIndex) || undefined,
      hasConsentProof:
        explicitYes ||
        (explicitOptedIn && Boolean(consentSource.trim() || consentDate.trim()))
    };
  });
}

function summarizeRows(rows: CustomerImportValidatedRow[]): CustomerImportSummary {
  const validRows = rows.filter((row) => row.status === "valid");

  return {
    totalRows: rows.length,
    validRows: validRows.length,
    duplicateRows: rows.filter((row) => row.status === "duplicate").length,
    invalidPhoneRows: rows.filter((row) =>
      row.errors.includes(invalidNorthAmericanPhoneMessage)
    ).length,
    needsConsentRows: validRows.filter(
      (row) => row.consentStatus === "needs_consent"
    ).length,
    optedInRows: validRows.filter((row) => row.consentStatus === "opted_in")
      .length,
    optedOutRows: validRows.filter((row) => row.consentStatus === "opted_out")
      .length
  };
}
