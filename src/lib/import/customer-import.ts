import { mapConsentStatus, type ConsentStatus } from "@/lib/customers/consent";
import { normalizePhoneToE164 } from "@/lib/customers/phone";

export type CustomerImportInputRow = {
  fullName: string;
  phone: string;
  email?: string;
  service?: string;
  notes?: string;
  consentStatus?: string;
  hasConsentProof: boolean;
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

function summarizeRows(rows: CustomerImportValidatedRow[]): CustomerImportSummary {
  const validRows = rows.filter((row) => row.status === "valid");

  return {
    totalRows: rows.length,
    validRows: validRows.length,
    duplicateRows: rows.filter((row) => row.status === "duplicate").length,
    invalidPhoneRows: rows.filter((row) =>
      row.errors.includes("Phone number must be a valid E.164 number.")
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
