import {
  type ConsentStatus,
  mapConsentStatus
} from "@/lib/customers/consent";
import { normalizePhoneToE164 } from "@/lib/customers/phone";
import type { Locale } from "@/lib/i18n/types";

export type ServiceCreateInput = {
  name: string;
  description: string | null;
  durationMinutes: number;
  normalPriceCents: number | null;
  active: boolean;
};

export type ServiceUpdateInput = ServiceCreateInput & {
  serviceId: string;
};

export type CustomerCreateInput = {
  fullName: string;
  phoneE164: string;
  email: string | null;
  preferredLanguage: Locale;
  notes: string | null;
  consentStatus: ConsentStatus;
  serviceId: string | null;
  addToWaitlist: boolean;
};

export type CustomerUpdateInput = Omit<CustomerCreateInput, "serviceId" | "addToWaitlist"> & {
  customerId: string;
};

export type WaitlistCreateInput = {
  customerId: string;
  serviceId: string | null;
  status: "active" | "paused";
  preferredDays: string[];
  preferredTimeWindows: string[];
  discountInterest: boolean;
  notes: string | null;
};

export type AppointmentCreateInput = {
  customerId: string;
  serviceId: string | null;
  startsAt: string;
  endsAt: string | null;
  timezone: string;
  notes: string | null;
  sendReminder: boolean;
  requestConfirmation: boolean;
};

export type AppointmentUpdateInput = AppointmentCreateInput & {
  appointmentId: string;
  status: "scheduled" | "cancelled" | "not_yet_confirmed";
  confirmationStatus:
    | "pending"
    | "confirmed_by_client"
    | "cancelled_by_client"
    | "no_response";
};

type FormResult<T> =
  | {
      ok: true;
      value: T;
    }
  | {
      ok: false;
      errors: string[];
    };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parsePriceToCents(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return null;
  }

  const amount = Number(trimmed.replace(",", "."));

  if (!Number.isFinite(amount) || amount < 0) {
    return Number.NaN;
  }

  return Math.round(amount * 100);
}

function cleanOptionalText(input: unknown) {
  const value = String(input ?? "").trim();
  return value || null;
}

function cleanList(input: unknown) {
  const values = Array.isArray(input) ? input : [input];

  return values
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

export function buildServiceCreateInput(input: {
  name?: unknown;
  description?: unknown;
  durationMinutes?: unknown;
  normalPrice?: unknown;
  active?: unknown;
  organizationId?: unknown;
}): FormResult<ServiceCreateInput> {
  const serviceInput = buildValidatedServiceInput(input);

  if (!serviceInput.ok) {
    return serviceInput;
  }

  return {
    ok: true,
    value: serviceInput.value
  };
}

export function buildServiceUpdateInput(input: {
  serviceId?: unknown;
  name?: unknown;
  description?: unknown;
  durationMinutes?: unknown;
  normalPrice?: unknown;
  active?: unknown;
  organizationId?: unknown;
}): FormResult<ServiceUpdateInput> {
  const errors: string[] = [];
  const serviceId = String(input.serviceId ?? "").trim();
  const serviceInput = buildValidatedServiceInput(input);

  if (!serviceId) {
    errors.push("Service id is required.");
  }

  if (!serviceInput.ok) {
    errors.push(...serviceInput.errors);
    return { ok: false, errors };
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      ...serviceInput.value,
      serviceId
    }
  };
}

function buildValidatedServiceInput(input: {
  name?: unknown;
  description?: unknown;
  durationMinutes?: unknown;
  normalPrice?: unknown;
  active?: unknown;
}): FormResult<ServiceCreateInput> {
  const errors: string[] = [];
  const name = String(input.name ?? "").trim();
  const durationMinutes = Number(String(input.durationMinutes ?? "").trim());
  const normalPriceCents = parsePriceToCents(String(input.normalPrice ?? ""));

  if (!name) {
    errors.push("Service name is required.");
  }

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <= 0
  ) {
    errors.push("Duration must be a positive whole number of minutes.");
  }

  if (Number.isNaN(normalPriceCents)) {
    errors.push("Price must be a positive amount.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      name,
      description: cleanOptionalText(input.description),
      durationMinutes,
      normalPriceCents,
      active: input.active === "on" || input.active === "true" || input.active === true
    }
  };
}

export function buildCustomerCreateInput(input: {
  fullName?: unknown;
  phone?: unknown;
  phoneCountry?: unknown;
  phoneNational?: unknown;
  email?: unknown;
  preferredLanguage?: unknown;
  notes?: unknown;
  consentStatus?: unknown;
  hasConsentProof?: unknown;
  serviceId?: unknown;
  addToWaitlist?: unknown;
  organizationId?: unknown;
}): FormResult<CustomerCreateInput> {
  const errors: string[] = [];
  const fullName = String(input.fullName ?? "").trim();
  const rawPhone = String(input.phone ?? "").trim();
  const email = cleanOptionalText(input.email)?.toLowerCase() ?? null;
  const preferredLanguage = String(input.preferredLanguage ?? "fr");
  const phone = normalizePhoneToE164({
    phone: rawPhone,
    countryCallingCode: input.phoneCountry,
    nationalNumber: input.phoneNational
  });
  const hasConsentProof =
    input.hasConsentProof === "on" ||
    input.hasConsentProof === "true" ||
    input.hasConsentProof === true ||
    input.consentStatus === "opted_in";
  const consentStatus = mapConsentStatus(
    String(input.consentStatus ?? "needs_consent"),
    hasConsentProof
  );

  if (!fullName) {
    errors.push("Client name is required.");
  }

  if (!phone.ok) {
    errors.push(phone.error);
  }

  if (email && !emailPattern.test(email)) {
    errors.push("Client email must be valid if provided.");
  }

  if (preferredLanguage !== "fr" && preferredLanguage !== "en") {
    errors.push("Preferred language must be French or English.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      fullName,
      phoneE164: phone.ok ? phone.phoneE164 : "",
      email,
      preferredLanguage: preferredLanguage as Locale,
      notes: cleanOptionalText(input.notes),
      consentStatus,
      serviceId: cleanOptionalText(input.serviceId),
      addToWaitlist:
        input.addToWaitlist === "on" ||
        input.addToWaitlist === "true" ||
        input.addToWaitlist === true
    }
  };
}

export function buildCustomerUpdateInput(input: {
  customerId?: unknown;
  fullName?: unknown;
  phone?: unknown;
  phoneCountry?: unknown;
  phoneNational?: unknown;
  email?: unknown;
  preferredLanguage?: unknown;
  notes?: unknown;
  consentStatus?: unknown;
  hasConsentProof?: unknown;
  organizationId?: unknown;
}): FormResult<CustomerUpdateInput> {
  const errors: string[] = [];
  const customerId = String(input.customerId ?? "").trim();
  const customerInput = buildCustomerCreateInput({
    ...input,
    serviceId: null,
    addToWaitlist: false
  });

  if (!customerId) {
    errors.push("Client id is required.");
  }

  if (!customerInput.ok) {
    errors.push(...customerInput.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (!customerInput.ok) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      customerId,
      fullName: customerInput.value.fullName,
      phoneE164: customerInput.value.phoneE164,
      email: customerInput.value.email,
      preferredLanguage: customerInput.value.preferredLanguage,
      notes: customerInput.value.notes,
      consentStatus: customerInput.value.consentStatus
    }
  };
}

export function buildWaitlistCreateInput(input: {
  customerId?: unknown;
  serviceId?: unknown;
  status?: unknown;
  preferredDays?: unknown;
  preferredTimeWindows?: unknown;
  discountInterest?: unknown;
  notes?: unknown;
  organizationId?: unknown;
}): FormResult<WaitlistCreateInput> {
  const errors: string[] = [];
  const customerId = String(input.customerId ?? "").trim();
  const serviceId = cleanOptionalText(input.serviceId);
  const status = String(input.status ?? "active");

  if (!customerId) {
    errors.push("Client is required.");
  }

  if (status !== "active" && status !== "paused") {
    errors.push("Waitlist status must be active or paused.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      customerId,
      serviceId,
      status: status as "active" | "paused",
      preferredDays: cleanList(input.preferredDays),
      preferredTimeWindows: cleanList(input.preferredTimeWindows),
      discountInterest:
        input.discountInterest === "on" ||
        input.discountInterest === "true" ||
        input.discountInterest === true,
      notes: cleanOptionalText(input.notes)
    }
  };
}

export function buildAppointmentCreateInput(input: {
  customerId?: unknown;
  serviceId?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  timezone?: unknown;
  notes?: unknown;
  sendReminder?: unknown;
  requestConfirmation?: unknown;
  organizationId?: unknown;
}): FormResult<AppointmentCreateInput> {
  const errors: string[] = [];
  const customerId = String(input.customerId ?? "").trim();
  const startsAt = String(input.startsAt ?? "").trim();
  const endsAt = cleanOptionalText(input.endsAt);
  const timezone = String(input.timezone ?? "America/Toronto").trim();

  if (!customerId) {
    errors.push("Client is required.");
  }

  if (!startsAt) {
    errors.push("Appointment start time is required.");
  }

  if (!timezone) {
    errors.push("Timezone is required.");
  }

  const startDate = startsAt ? new Date(startsAt) : null;
  const endDate = endsAt ? new Date(endsAt) : null;

  if (startDate && Number.isNaN(startDate.getTime())) {
    errors.push("Appointment start time must be valid.");
  }

  if (endDate && Number.isNaN(endDate.getTime())) {
    errors.push("Appointment end time must be valid.");
  }

  if (
    startDate &&
    endDate &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate <= startDate
  ) {
    errors.push("Appointment end time must be after the start time.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      customerId,
      serviceId: cleanOptionalText(input.serviceId),
      startsAt,
      endsAt,
      timezone,
      notes: cleanOptionalText(input.notes),
      sendReminder:
        input.sendReminder === "on" ||
        input.sendReminder === "true" ||
        input.sendReminder === true,
      requestConfirmation:
        input.requestConfirmation === "on" ||
        input.requestConfirmation === "true" ||
        input.requestConfirmation === true
    }
  };
}

export function buildAppointmentUpdateInput(input: {
  appointmentId?: unknown;
  customerId?: unknown;
  serviceId?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  timezone?: unknown;
  notes?: unknown;
  status?: unknown;
  confirmationStatus?: unknown;
  sendReminder?: unknown;
  requestConfirmation?: unknown;
  organizationId?: unknown;
}): FormResult<AppointmentUpdateInput> {
  const appointmentId = String(input.appointmentId ?? "").trim();
  const status = String(input.status ?? "scheduled");
  const confirmationStatus = String(input.confirmationStatus ?? "pending");
  const appointmentInput = buildAppointmentCreateInput(input);
  const errors: string[] = [];

  if (!appointmentId) {
    errors.push("Appointment id is required.");
  }

  if (
    status !== "scheduled" &&
    status !== "cancelled" &&
    status !== "not_yet_confirmed"
  ) {
    errors.push("Appointment status is invalid.");
  }

  if (
    confirmationStatus !== "pending" &&
    confirmationStatus !== "confirmed_by_client" &&
    confirmationStatus !== "cancelled_by_client" &&
    confirmationStatus !== "no_response"
  ) {
    errors.push("Appointment confirmation status is invalid.");
  }

  if (!appointmentInput.ok) {
    errors.push(...appointmentInput.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  if (!appointmentInput.ok) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      ...appointmentInput.value,
      appointmentId,
      status: status as AppointmentUpdateInput["status"],
      confirmationStatus:
        confirmationStatus as AppointmentUpdateInput["confirmationStatus"]
    }
  };
}
