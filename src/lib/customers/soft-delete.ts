export type CustomerListTab = "active" | "deleted";

export type CustomerDeletionState = {
  id?: string;
  phone_e164?: string | null;
  deleted_at?: string | null;
};

export type CustomerDeleteValidationResult =
  | {
      ok: true;
      value: {
        customerId: string;
        reason: string;
        returnTo: string;
      };
    }
  | {
      ok: false;
      error: string;
      returnTo: string;
    };

export function isDeletedCustomer(customer: CustomerDeletionState | null | undefined) {
  return Boolean(customer?.deleted_at);
}

export function normalizeCustomerListTab(value: string | null | undefined): CustomerListTab {
  return value === "deleted" ? "deleted" : "active";
}

export function buildSafeCustomerReturnPath(
  value: string | null | undefined,
  fallback = "/dashboard/clients"
) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return fallback;
  }

  if (!raw.startsWith("/dashboard/clients")) {
    return fallback;
  }

  if (raw.startsWith("//") || raw.includes("://")) {
    return fallback;
  }

  return raw;
}

export function appendCustomerActionMessage(
  path: string,
  key: "error" | "message" | "notice" | "warning",
  message: string
) {
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(key, message);

  return `${pathname}?${params.toString()}`;
}

export function validateCustomerDeleteForm({
  customerId,
  reason,
  confirm,
  returnTo
}: {
  customerId: FormDataEntryValue | null;
  reason: FormDataEntryValue | null;
  confirm: FormDataEntryValue | null;
  returnTo: FormDataEntryValue | null;
}): CustomerDeleteValidationResult {
  const safeReturnTo = buildSafeCustomerReturnPath(String(returnTo ?? ""));
  const normalizedCustomerId = String(customerId ?? "").trim();
  const normalizedReason = String(reason ?? "").trim().slice(0, 500);

  if (!normalizedCustomerId) {
    return {
      ok: false,
      error: "Client not found.",
      returnTo: safeReturnTo
    };
  }

  if (normalizedReason.length < 3) {
    return {
      ok: false,
      error: "Please enter a deletion reason before removing this client.",
      returnTo: safeReturnTo
    };
  }

  if (!confirm) {
    return {
      ok: false,
      error: "Please confirm that this client should be removed from active lists and future SMS.",
      returnTo: safeReturnTo
    };
  }

  return {
    ok: true,
    value: {
      customerId: normalizedCustomerId,
      reason: normalizedReason,
      returnTo: safeReturnTo
    }
  };
}

export function hasActivePhoneConflict({
  customers,
  restoringCustomerId,
  phoneE164
}: {
  customers: CustomerDeletionState[];
  restoringCustomerId: string;
  phoneE164: string;
}) {
  return customers.some(
    (customer) =>
      customer.id !== restoringCustomerId &&
      customer.phone_e164 === phoneE164 &&
      !isDeletedCustomer(customer)
  );
}
