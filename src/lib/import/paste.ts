import type { CustomerImportInputRow } from "@/lib/import/customer-import";

const phoneCandidatePattern =
  /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/;

export function mapPastedTextToCustomerImportRows(
  text: string,
  options: { hasConsentProof?: boolean } = {}
): CustomerImportInputRow[] {
  const hasConsentProof = Boolean(options.hasConsentProof);

  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const phoneMatch = line.match(phoneCandidatePattern);
      const phone = phoneMatch?.[0] ?? "";
      const name = extractNameFromLine(line, phone);

      return {
        fullName: name,
        phone,
        notes: line,
        consentStatus: hasConsentProof ? "opted_in" : "",
        hasConsentProof
      };
    });
}

function extractNameFromLine(line: string, phone: string) {
  const withoutPhone = phone ? line.replace(phone, " ") : line;
  const cleanedName = withoutPhone
    .replace(/[,:;|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleanedName.length >= 2 ? cleanedName : "";
}
