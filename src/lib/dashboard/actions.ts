"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { recordManagerModeDashboardAction } from "@/lib/admin/manager-mode";
import {
  isOrganizationSmsPaused,
  requireOrganizationSmsNotPaused
} from "@/lib/admin/organization-controls";
import {
  appendCustomerActionMessage,
  buildSafeCustomerReturnPath,
  validateCustomerDeleteForm
} from "@/lib/customers/soft-delete";
import { createRecurringAppointments, createSingleAppointmentRecord } from "@/lib/appointments/create";
import { shouldQueueAppointmentReminder } from "@/lib/appointments/reminders";
import {
  buildAppointmentCreateInput,
  buildAppointmentUpdateInput,
  buildCustomerCreateInput,
  buildCustomerUpdateInput,
  buildServiceCreateInput,
  buildServiceUpdateInput
} from "@/lib/dashboard/forms";
import { getActiveOrganizationWorkspace } from "@/lib/organization/current";
import {
  canManageOrganizationSettings,
  canManageCustomers,
  canManageAppointments,
  canManageServices,
  canValidateBookings
} from "@/lib/organization/permissions";
import { calculateCommissionEstimate } from "@/lib/openings/commission";
import { buildOpeningCreateInput } from "@/lib/openings/forms";
import { sendConsentRequestSms } from "@/lib/sms/consent-request";
import { getSmsProvider } from "@/lib/env/config";
import {
  getOrganizationSmsRuntimeProviderName,
  resolveOrganizationSmsFromNumber,
  sendOrganizationSms
} from "@/lib/sms/organization-sms";
import { loadOrganizationSmsReadiness } from "@/lib/sms/organization-gate";
import {
  getOpeningSmsDateTimeLabels
} from "@/lib/sms/message-generator";
import { resolveOpeningAlertSmsBody } from "@/lib/sms/organization-templates";
import { sendOpeningConfirmationSmsAfterValidation } from "@/lib/sms/opening-confirmation";
import { checkSmsDeliveryPersistenceReadiness } from "@/lib/sms/persistence-readiness";
import { getSmsRuntimeStatus } from "@/lib/sms/runtime-status";
import { checkSmartSmsPersistenceReadiness } from "@/lib/sms/smart-sms-persistence-readiness";
import {
  applyManualRecipientOverride,
  computeSmartRecipientRecommendationRank,
  defaultSmartSmsSettings,
  evaluateSmsRecipientEligibility,
  type BaseDecision,
  type FinalDecision,
  type ManualOverride,
  type ManualSendMode,
  type RecommendationBucket,
  type ReasonCode,
  type SmsRecipientDecision,
  type SmartSmsSettings
} from "@/lib/sms/smart-recipient-engine";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

async function requireReadyOrganization({
  canPerform,
  deniedMessage = "You do not have permission to perform this action."
}: {
  canPerform?: (role: "owner" | "manager" | "staff") => boolean;
  deniedMessage?: string;
} = {}) {
  const workspace = await getActiveOrganizationWorkspace();

  if (workspace.status !== "ready") {
    throw new Error("Supabase must be configured before writing dashboard data.");
  }

  if (canPerform && !canPerform(workspace.organization.role)) {
    throw new Error(deniedMessage);
  }

  return workspace.organization;
}

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function redirectWithSendError(path: string, message: string): never {
  redirect(`${path}?sendError=${encodeURIComponent(message)}`);
}

function redirectWithValidationError(path: string, message: string): never {
  redirect(`${path}?validationError=${encodeURIComponent(message)}`);
}

function redirectWithNotice(path: string, message: string): never {
  redirect(`${path}?notice=${encodeURIComponent(message)}`);
}

function redirectWithNoticeAndConfirmationSmsWarning({
  path,
  notice,
  confirmationSmsWarning
}: {
  path: string;
  notice: string;
  confirmationSmsWarning: string | null;
}): never {
  const params = new URLSearchParams({ notice });

  if (confirmationSmsWarning) {
    params.set("confirmationSmsWarning", confirmationSmsWarning);
  }

  redirect(`${path}?${params.toString()}`);
}

function redirectWithWarning(path: string, message: string): never {
  redirect(`${path}?warning=${encodeURIComponent(message)}`);
}

const genericClientSaveError = "Unable to save client. Please try again.";
const MAX_MANUAL_RECIPIENT_EXCLUSIONS = 500;

function redirectWithCustomerActionMessage(
  path: string,
  key: "error" | "message" | "notice" | "warning",
  message: string
): never {
  redirect(appendCustomerActionMessage(path, key, message));
}

function getSafeProviderErrorMessage(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : "Provider rejected one SMS send.";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const withoutSecret = twilioToken
    ? rawMessage.replaceAll(twilioToken, "[redacted]")
    : rawMessage;

  return withoutSecret.slice(0, 180);
}

function buildManualExcludedCustomerIds(formData: FormData) {
  const rawValues = formData.getAll("manualExcludedCustomerIds");

  if (rawValues.length > MAX_MANUAL_RECIPIENT_EXCLUSIONS) {
    return {
      ok: false as const,
      error: "Too many manual recipient exclusions."
    };
  }

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const customerIds = [
    ...new Set(
      rawValues
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  ];

  if (customerIds.length > MAX_MANUAL_RECIPIENT_EXCLUSIONS) {
    return {
      ok: false as const,
      error: "Too many manual recipient exclusions."
    };
  }

  if (customerIds.some((customerId) => !uuidPattern.test(customerId))) {
    return {
      ok: false as const,
      error: "Invalid manual recipient exclusion."
    };
  }

  return {
    ok: true as const,
    customerIds
  };
}

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type AlertRecipientDecisionRow =
  Database["public"]["Tables"]["alert_recipient_decisions"]["Row"];
type OpeningOfferInsert =
  Database["public"]["Tables"]["opening_offers"]["Insert"];
type SmartSmsSettingsUpdateInput = Pick<
  Database["public"]["Tables"]["organization_settings"]["Update"],
  | "smart_sending_enabled"
  | "cooldown_after_completed_appointment_days"
  | "cooldown_after_filled_spot_days"
  | "max_sms_per_day"
  | "max_sms_per_7_days"
  | "max_sms_per_30_days"
  | "block_if_future_appointment_exists"
  | "future_appointment_window_days"
  | "allowed_send_start_time"
  | "allowed_send_end_time"
  | "always_review_recipients_before_send"
>;

const smsSentStatuses = [
  "accepted",
  "queued",
  "sending",
  "sent",
  "delivered",
  "submitted_to_provider",
  "simulated"
];
const recipientDecisionClaimedStatuses = [
  "pending_send",
  "failed",
  ...smsSentStatuses
];

function isRecipientDecisionClaimed(
  decision: Pick<
    AlertRecipientDecisionRow,
    "sent_at" | "delivery_status" | "twilio_message_sid"
  >
) {
  return Boolean(
    decision.sent_at ||
      decision.twilio_message_sid ||
      (decision.delivery_status &&
        recipientDecisionClaimedStatuses.includes(decision.delivery_status))
  );
}

function isManualSendMode(value: string | null | undefined): value is ManualSendMode {
  return (
    value === "auto" ||
    value === "prefer_include" ||
    value === "prefer_exclude" ||
    value === "never_send_last_minute"
  );
}

function isManualOverride(value: string): value is ManualOverride {
  return value === "auto" || value === "include" || value === "exclude";
}

function mapSmartSmsSettings(
  row:
    | Pick<
        Database["public"]["Tables"]["organization_settings"]["Row"],
        | "smart_sending_enabled"
        | "cooldown_after_completed_appointment_days"
        | "cooldown_after_filled_spot_days"
        | "max_sms_per_day"
        | "max_sms_per_7_days"
        | "max_sms_per_30_days"
        | "block_if_future_appointment_exists"
        | "future_appointment_window_days"
        | "allowed_send_start_time"
        | "allowed_send_end_time"
        | "always_review_recipients_before_send"
      >
    | null
): Required<SmartSmsSettings> {
  return {
    smartSendingEnabled:
      row?.smart_sending_enabled ?? defaultSmartSmsSettings.smartSendingEnabled,
    cooldownAfterCompletedAppointmentDays:
      row?.cooldown_after_completed_appointment_days ??
      defaultSmartSmsSettings.cooldownAfterCompletedAppointmentDays,
    cooldownAfterFilledSpotDays:
      row?.cooldown_after_filled_spot_days ??
      defaultSmartSmsSettings.cooldownAfterFilledSpotDays,
    maxSmsPerDay: row?.max_sms_per_day ?? defaultSmartSmsSettings.maxSmsPerDay,
    maxSmsPer7Days:
      row?.max_sms_per_7_days ?? defaultSmartSmsSettings.maxSmsPer7Days,
    maxSmsPer30Days:
      row?.max_sms_per_30_days ?? defaultSmartSmsSettings.maxSmsPer30Days,
    blockIfFutureAppointmentExists:
      row?.block_if_future_appointment_exists ??
      defaultSmartSmsSettings.blockIfFutureAppointmentExists,
    futureAppointmentWindowDays:
      row?.future_appointment_window_days ??
      defaultSmartSmsSettings.futureAppointmentWindowDays,
    allowedSendStartTime:
      row?.allowed_send_start_time ??
      defaultSmartSmsSettings.allowedSendStartTime,
    allowedSendEndTime:
      row?.allowed_send_end_time ?? defaultSmartSmsSettings.allowedSendEndTime,
    alwaysReviewRecipientsBeforeSend:
      row?.always_review_recipients_before_send ??
      defaultSmartSmsSettings.alwaysReviewRecipientsBeforeSend
  };
}

function getSmartSmsBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getSmartSmsInteger({
  formData,
  key,
  min = 0,
  max
}: {
  formData: FormData;
  key: string;
  min?: number;
  max: number;
}) {
  const value = Number(formData.get(key));

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error("Smart SMS settings contain an invalid number.");
  }

  return value;
}

function getSmartSmsTime(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
    throw new Error("Smart SMS sending hours are invalid.");
  }

  return value;
}

function buildSmartSmsSettingsUpdateInput(formData: FormData) {
  const input = {
    smart_sending_enabled: getSmartSmsBoolean(
      formData,
      "smart_sending_enabled"
    ),
    cooldown_after_completed_appointment_days: getSmartSmsInteger({
      formData,
      key: "cooldown_after_completed_appointment_days",
      max: 90
    }),
    cooldown_after_filled_spot_days: getSmartSmsInteger({
      formData,
      key: "cooldown_after_filled_spot_days",
      max: 120
    }),
    max_sms_per_day: getSmartSmsInteger({
      formData,
      key: "max_sms_per_day",
      min: 1,
      max: 20
    }),
    max_sms_per_7_days: getSmartSmsInteger({
      formData,
      key: "max_sms_per_7_days",
      min: 1,
      max: 50
    }),
    max_sms_per_30_days: getSmartSmsInteger({
      formData,
      key: "max_sms_per_30_days",
      min: 1,
      max: 200
    }),
    block_if_future_appointment_exists: getSmartSmsBoolean(
      formData,
      "block_if_future_appointment_exists"
    ),
    future_appointment_window_days: getSmartSmsInteger({
      formData,
      key: "future_appointment_window_days",
      max: 365
    }),
    allowed_send_start_time: getSmartSmsTime(
      formData,
      "allowed_send_start_time"
    ),
    allowed_send_end_time: getSmartSmsTime(formData, "allowed_send_end_time"),
    always_review_recipients_before_send: getSmartSmsBoolean(
      formData,
      "always_review_recipients_before_send"
    )
  } satisfies SmartSmsSettingsUpdateInput;

  if (
    input.max_sms_per_day > input.max_sms_per_7_days ||
    input.max_sms_per_7_days > input.max_sms_per_30_days
  ) {
    throw new Error(
      "Smart SMS limits must follow day <= 7-day <= 30-day."
    );
  }

  return input;
}

async function loadSmartSmsSettings({
  supabase,
  organizationId
}: {
  supabase: SupabaseServerClient;
  organizationId: string;
}) {
  const { data, error } = await supabase
    .from("organization_settings")
    .select(
      "smart_sending_enabled, cooldown_after_completed_appointment_days, cooldown_after_filled_spot_days, max_sms_per_day, max_sms_per_7_days, max_sms_per_30_days, block_if_future_appointment_exists, future_appointment_window_days, allowed_send_start_time, allowed_send_end_time, always_review_recipients_before_send"
    )
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return mapSmartSmsSettings(data);
}

function toRecipientDecisionWrite({
  alertId,
  organizationId,
  customerId,
  decision,
  manualOverride = "auto",
  overrideReason = null,
  overriddenBy = null,
  recommendationRank = null,
  recommendationBucket = null
}: {
  alertId: string;
  organizationId: string;
  customerId: string;
  decision: SmsRecipientDecision;
  manualOverride?: ManualOverride;
  overrideReason?: string | null;
  overriddenBy?: string | null;
  recommendationRank?: number | null;
  recommendationBucket?: RecommendationBucket | null;
}) {
  return {
    alert_id: alertId,
    organization_id: organizationId,
    customer_id: customerId,
    base_decision: decision.baseDecision,
    final_decision: decision.finalDecision,
    decision_type: decision.decisionType,
    manual_override: manualOverride,
    reason_codes: decision.reasonCodes,
    reason_label: decision.reasonLabel,
    manually_overridden: decision.manuallyOverridden,
    warning_required: decision.warningRequired,
    override_reason: overrideReason,
    overridden_by: overriddenBy,
    recommendation_rank: recommendationRank,
    recommendation_bucket: recommendationBucket
  };
}

function buildBaseDecisionFromRow(
  row: Pick<
    AlertRecipientDecisionRow,
    "base_decision" | "reason_codes" | "reason_label"
  >
): SmsRecipientDecision {
  const baseDecision = row.base_decision as BaseDecision;
  const finalDecision: FinalDecision =
    baseDecision === "eligible"
      ? "send"
      : baseDecision === "protected"
        ? "do_not_send"
        : "locked_blocked";

  return {
    baseDecision,
    finalDecision,
    decisionType: "auto",
    reasonCodes: row.reason_codes as ReasonCode[],
    reasonLabel: row.reason_label,
    canSend: finalDecision === "send",
    manuallyOverridden: false,
    warningRequired: false
  };
}

function countMessagesSince(messages: { created_at: string }[], since: Date) {
  const sinceTime = since.getTime();

  return messages.filter((message) => {
    const createdAt = new Date(message.created_at).getTime();
    return Number.isFinite(createdAt) && createdAt >= sinceTime;
  }).length;
}

function getLatestEventAt(
  events: Array<{ event_type: string; event_at: string }>,
  eventType: string
) {
  return events
    .filter((event) => event.event_type === eventType)
    .map((event) => event.event_at)
    .sort()
    .at(-1) ?? null;
}

function getNextFutureAppointmentAt(
  appointments: Array<{ starts_at: string; status: string }>,
  now: Date
) {
  return appointments
    .filter((appointment) => {
      const startsAt = new Date(appointment.starts_at).getTime();
      return (
        Number.isFinite(startsAt) &&
        startsAt > now.getTime() &&
        ["scheduled", "confirmed"].includes(appointment.status)
      );
    })
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .at(0)?.starts_at ?? null;
}

function getLatestCompletedAppointmentAt(
  appointments: Array<{ starts_at: string; status: string }>
) {
  return appointments
    .filter((appointment) => appointment.status === "completed")
    .map((appointment) => appointment.starts_at)
    .sort()
    .at(-1) ?? null;
}

function waitlistEntryMatchesOpeningService({
  entry,
  serviceInterestIds,
  openingServiceId
}: {
  entry: { service_id: string | null };
  serviceInterestIds: string[];
  openingServiceId: string | null;
}) {
  if (!openingServiceId) {
    return true;
  }

  if (serviceInterestIds.length > 0) {
    return serviceInterestIds.includes(openingServiceId);
  }

  return !entry.service_id || entry.service_id === openingServiceId;
}

function getWaitlistEntryServiceMatchScore({
  entry,
  serviceInterestIds,
  openingServiceId
}: {
  entry: { service_id: string | null };
  serviceInterestIds: string[];
  openingServiceId: string | null;
}) {
  return waitlistEntryMatchesOpeningService({
    entry,
    serviceInterestIds,
    openingServiceId
  })
    ? 1
    : 0;
}

function getCustomerServiceMatchScores({
  waitlistEntries,
  serviceInterestsByEntry,
  openingServiceId
}: {
  waitlistEntries: Array<{
    id: string;
    customer_id: string;
    service_id: string | null;
  }>;
  serviceInterestsByEntry: Map<string, string[]>;
  openingServiceId: string | null;
}) {
  const scores = new Map<string, number>();

  for (const entry of waitlistEntries) {
    const score = getWaitlistEntryServiceMatchScore({
      entry,
      serviceInterestIds: serviceInterestsByEntry.get(entry.id) ?? [],
      openingServiceId
    });
    scores.set(entry.customer_id, Math.max(scores.get(entry.customer_id) ?? 0, score));
  }

  return scores;
}

async function ensureOpeningOffersForSendDecisions({
  supabase,
  organizationId,
  openingId,
  customerIds
}: {
  supabase: SupabaseServerClient;
  organizationId: string;
  openingId: string;
  customerIds: string[];
}) {
  if (customerIds.length === 0) {
    return;
  }

  const rows: OpeningOfferInsert[] = customerIds.map((customerId) => ({
    organization_id: organizationId,
    opening_id: openingId,
    customer_id: customerId,
    status: "pending"
  }));
  const { error } = await supabase
    .from("opening_offers")
    .upsert(rows, {
      onConflict: "opening_id,customer_id",
      ignoreDuplicates: true
    });

  if (error) {
    throw new Error(error.message);
  }
}

async function syncOpeningOffersWithRecipientDecisions({
  supabase,
  organizationId,
  openingId
}: {
  supabase: SupabaseServerClient;
  organizationId: string;
  openingId: string;
}) {
  const { data: decisions, error: decisionsError } = await supabase
    .from("alert_recipient_decisions")
    .select("customer_id, final_decision, sent_at, delivery_status, twilio_message_sid")
    .eq("organization_id", organizationId)
    .eq("alert_id", openingId);

  if (decisionsError) {
    throw new Error(decisionsError.message);
  }

  const sendCustomerIds = new Set(
    (decisions ?? [])
      .filter((decision) => decision.final_decision === "send")
      .map((decision) => decision.customer_id)
  );
  const creatableSendCustomerIds = new Set(
    (decisions ?? [])
      .filter(
        (decision) =>
          decision.final_decision === "send" &&
          !isRecipientDecisionClaimed(decision)
      )
      .map((decision) => decision.customer_id)
  );

  await ensureOpeningOffersForSendDecisions({
    supabase,
    organizationId,
    openingId,
    customerIds: [...creatableSendCustomerIds]
  });

  const { data: pendingOffers, error: offersError } = await supabase
    .from("opening_offers")
    .select("id, customer_id")
    .eq("organization_id", organizationId)
    .eq("opening_id", openingId)
    .eq("status", "pending")
    .is("sent_at", null)
    .is("responded_at", null)
    .is("response_text", null);

  if (offersError) {
    throw new Error(offersError.message);
  }

  const phantomOfferIds = (pendingOffers ?? [])
    .filter((offer) => !sendCustomerIds.has(offer.customer_id))
    .map((offer) => offer.id);

  if (phantomOfferIds.length === 0) {
    return;
  }

  const { error: updateError } = await supabase
    .from("opening_offers")
    .update({ status: "invalid" })
    .eq("organization_id", organizationId)
    .eq("opening_id", openingId)
    .eq("status", "pending")
    .in("id", phantomOfferIds);

  if (updateError) {
    throw new Error(updateError.message);
  }
}

const finalSendBlockReasonLabels: Partial<Record<ReasonCode, string>> = {
  blocked_opted_out:
    "Impossible d'envoyer : ce client est désinscrit ou sans consentement SMS valide.",
  blocked_no_consent:
    "Impossible d'envoyer : ce client est désinscrit ou sans consentement SMS valide.",
  blocked_invalid_phone: "Impossible d'envoyer : numéro invalide.",
  blocked_archived_customer: "Impossible d'envoyer : client archivé."
};

async function markRecipientDecisionsLockedBeforeSend({
  supabase,
  organizationId,
  openingId,
  finalSendHardBlockReasonsByCustomerId
}: {
  supabase: SupabaseServerClient;
  organizationId: string;
  openingId: string;
  finalSendHardBlockReasonsByCustomerId: Map<string, ReasonCode>;
}) {
  for (const [customerId, reasonCode] of finalSendHardBlockReasonsByCustomerId) {
    const reasonLabel =
      finalSendBlockReasonLabels[reasonCode] ?? "Impossible d'envoyer.";

    const { error: decisionError } = await supabase
      .from("alert_recipient_decisions")
      .update({
        base_decision: "locked_blocked",
        final_decision: "locked_blocked",
        decision_type: "manual_locked",
        reason_codes: [reasonCode],
        reason_label: reasonLabel,
        manually_overridden: false,
        warning_required: false
      })
      .eq("organization_id", organizationId)
      .eq("alert_id", openingId)
      .eq("customer_id", customerId)
      .is("sent_at", null);

    if (decisionError) {
      throw new Error(decisionError.message);
    }
  }

  if (finalSendHardBlockReasonsByCustomerId.size > 0) {
    const { error: offerError } = await supabase
      .from("opening_offers")
      .update({ status: "invalid" })
      .eq("organization_id", organizationId)
      .eq("opening_id", openingId)
      .eq("status", "pending")
      .in("customer_id", [
        ...finalSendHardBlockReasonsByCustomerId.keys()
      ]);

    if (offerError) {
      throw new Error(offerError.message);
    }
  }
}

async function prepareSmartRecipientDecisionsForOpening({
  supabase,
  organization,
  openingId,
  manualOverridesByCustomerId = new Map()
}: {
  supabase: SupabaseServerClient;
  organization: Awaited<ReturnType<typeof requireReadyOrganization>>;
  openingId: string;
  manualOverridesByCustomerId?: Map<
    string,
    {
      manualOverride: ManualOverride;
      overrideReason: string | null;
      overriddenBy: string | null;
    }
  >;
}) {
  const now = new Date();
  const [settings, openingResult, waitlistResult, existingDecisionsResult] =
    await Promise.all([
      loadSmartSmsSettings({ supabase, organizationId: organization.id }),
      supabase
        .from("openings")
        .select("id, service_id")
        .eq("organization_id", organization.id)
        .eq("id", openingId)
        .maybeSingle(),
      supabase
        .from("waitlist_entries")
        .select("id, customer_id, service_id, status")
        .eq("organization_id", organization.id)
        .eq("status", "active"),
      supabase
        .from("alert_recipient_decisions")
        .select(
          "customer_id, base_decision, final_decision, manual_override, override_reason, overridden_by, sent_at, delivery_status, twilio_message_sid"
        )
        .eq("organization_id", organization.id)
        .eq("alert_id", openingId)
    ]);

  if (openingResult.error || !openingResult.data) {
    throw new Error(openingResult.error?.message ?? "Opening not found.");
  }

  if (waitlistResult.error) {
    throw new Error(waitlistResult.error.message);
  }

  if (existingDecisionsResult.error) {
    throw new Error(existingDecisionsResult.error.message);
  }

  const opening = openingResult.data;
  const waitlistEntries = waitlistResult.data ?? [];

  if (waitlistEntries.length === 0) {
    return {
      settings,
      selectedCount: 0,
      eligibleCount: 0,
      protectedCount: 0,
      blockedCount: 0
    };
  }

  const waitlistEntryIds = waitlistEntries.map((entry) => entry.id);
  const [serviceInterestsResult] = await Promise.all([
    supabase
      .from("waitlist_entry_services")
      .select("waitlist_entry_id, service_id")
      .eq("organization_id", organization.id)
      .in("waitlist_entry_id", waitlistEntryIds)
  ]);

  if (serviceInterestsResult.error) {
    throw new Error(serviceInterestsResult.error.message);
  }

  const serviceInterestsByEntry = new Map<string, string[]>();

  for (const interest of serviceInterestsResult.data ?? []) {
    serviceInterestsByEntry.set(interest.waitlist_entry_id, [
      ...(serviceInterestsByEntry.get(interest.waitlist_entry_id) ?? []),
      interest.service_id
    ]);
  }

  const serviceMatchScoreByCustomer = getCustomerServiceMatchScores({
    waitlistEntries,
    serviceInterestsByEntry,
    openingServiceId: opening.service_id
  });
  const customerIds = [...new Set(waitlistEntries.map((entry) => entry.customer_id))];

  if (customerIds.length === 0) {
    return {
      settings,
      selectedCount: 0,
      eligibleCount: 0,
      protectedCount: 0,
      blockedCount: 0
    };
  }

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [
    customersResult,
    consentsResult,
    preferencesResult,
    activityEventsResult,
    appointmentsResult,
    smsMessagesResult,
    sameAlertMessagesResult
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone_e164, deleted_at")
      .eq("organization_id", organization.id)
      .in("id", customerIds),
    supabase
      .from("sms_consents")
      .select("customer_id, status, unsubscribed_at")
      .eq("organization_id", organization.id)
      .in("customer_id", customerIds),
    supabase
      .from("customer_sms_preferences")
      .select("customer_id, manual_send_mode, manual_snooze_until")
      .eq("organization_id", organization.id)
      .in("customer_id", customerIds),
    supabase
      .from("customer_activity_events")
      .select("customer_id, event_type, event_at")
      .eq("organization_id", organization.id)
      .in("customer_id", customerIds)
      .in("event_type", ["appointment_completed", "spot_filled"]),
    supabase
      .from("appointments")
      .select("customer_id, starts_at, status")
      .eq("organization_id", organization.id)
      .in("customer_id", customerIds),
    supabase
      .from("sms_messages")
      .select("customer_id, created_at")
      .eq("organization_id", organization.id)
      .eq("direction", "outbound")
      .eq("message_type", "opening_alert")
      .in("status", smsSentStatuses)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .in("customer_id", customerIds),
    supabase
      .from("sms_messages")
      .select("customer_id")
      .eq("organization_id", organization.id)
      .eq("opening_id", openingId)
      .eq("direction", "outbound")
      .eq("message_type", "opening_alert")
      .in("status", smsSentStatuses)
      .in("customer_id", customerIds)
  ]);

  for (const result of [
    customersResult,
    consentsResult,
    preferencesResult,
    activityEventsResult,
    appointmentsResult,
    smsMessagesResult,
    sameAlertMessagesResult
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const customerById = new Map((customersResult.data ?? []).map((row) => [row.id, row]));
  const consentByCustomer = new Map(
    (consentsResult.data ?? []).map((row) => [row.customer_id, row])
  );
  const preferenceByCustomer = new Map(
    (preferencesResult.data ?? []).map((row) => [row.customer_id, row])
  );
  const existingDecisionByCustomer = new Map(
    (existingDecisionsResult.data ?? []).map((row) => [row.customer_id, row])
  );
  const existingClaimedDecisionByCustomer = new Map(
    (existingDecisionsResult.data ?? [])
      .filter((row) => isRecipientDecisionClaimed(row))
      .map((row) => [row.customer_id, row])
  );
  const eventsByCustomer = new Map<
    string,
    Array<{ event_type: string; event_at: string }>
  >();
  const appointmentsByCustomer = new Map<
    string,
    Array<{ starts_at: string; status: string }>
  >();
  const smsMessagesByCustomer = new Map<string, Array<{ created_at: string }>>();
  const alreadyContactedCustomerIds = new Set(
    (sameAlertMessagesResult.data ?? []).map((row) => row.customer_id)
  );

  for (const event of activityEventsResult.data ?? []) {
    eventsByCustomer.set(event.customer_id, [
      ...(eventsByCustomer.get(event.customer_id) ?? []),
      event
    ]);
  }

  for (const appointment of appointmentsResult.data ?? []) {
    appointmentsByCustomer.set(appointment.customer_id, [
      ...(appointmentsByCustomer.get(appointment.customer_id) ?? []),
      appointment
    ]);
  }

  for (const message of smsMessagesResult.data ?? []) {
    if (!message.customer_id) {
      continue;
    }

    smsMessagesByCustomer.set(message.customer_id, [
      ...(smsMessagesByCustomer.get(message.customer_id) ?? []),
      message
    ]);
  }

  const rows = customerIds.flatMap((customerId) => {
    if (existingClaimedDecisionByCustomer.has(customerId)) {
      return [];
    }

    const customer = customerById.get(customerId);

    if (!customer) {
      return [];
    }

    const consent = consentByCustomer.get(customerId);
    const preference = preferenceByCustomer.get(customerId);
    const events = eventsByCustomer.get(customerId) ?? [];
    const appointments = appointmentsByCustomer.get(customerId) ?? [];
    const messages = smsMessagesByCustomer.get(customerId) ?? [];
    const lastSmsAt = messages
      .map((message) => message.created_at)
      .sort()
      .at(-1) ?? null;
    const requestedOverride = manualOverridesByCustomerId.get(customerId);
    const manualOverride =
      requestedOverride?.manualOverride ??
      existingDecisionByCustomer.get(customerId)?.manual_override ??
      "auto";
    const decision = applyManualRecipientOverride(
      evaluateSmsRecipientEligibility({
        customer: {
          customerId,
          smsConsentStatus: consent?.status ?? "missing",
          phoneE164: customer.phone_e164,
          phoneIsValid: /^\+[1-9][0-9]{7,14}$/.test(customer.phone_e164),
          isArchived: Boolean(customer.deleted_at),
          alreadyReceivedAlert: alreadyContactedCustomerIds.has(customerId),
          deliveryQuarantined: false,
          optedOutAt: consent?.unsubscribed_at ?? null,
          manualSendMode: isManualSendMode(preference?.manual_send_mode)
            ? preference.manual_send_mode
            : "auto",
          manualSnoozeUntil: preference?.manual_snooze_until ?? null,
          lastCompletedAppointmentAt:
            getLatestEventAt(events, "appointment_completed") ??
            getLatestCompletedAppointmentAt(appointments),
          lastFilledSpotAt: getLatestEventAt(events, "spot_filled"),
          nextAppointmentAt: getNextFutureAppointmentAt(appointments, now),
          smsSentLast24h: countMessagesSince(
            messages,
            new Date(now.getTime() - 24 * 60 * 60 * 1000)
          ),
          smsSentLast7d: countMessagesSince(
            messages,
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          ),
          smsSentLast30d: messages.length,
          serviceMatchScore: serviceMatchScoreByCustomer.get(customerId) ?? 1
        },
        settings,
        now,
        businessTimezone: organization.timezone
      }),
      isManualOverride(manualOverride) ? manualOverride : "auto"
    );
    const recommendation = computeSmartRecipientRecommendationRank({
      baseDecision: decision.baseDecision,
      smsSentLast24h: countMessagesSince(
        messages,
        new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ),
      smsSentLast7d: countMessagesSince(
        messages,
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ),
      smsSentLast30d: messages.length,
      lastSmsAt,
      now
    });

    return [
      toRecipientDecisionWrite({
        alertId: openingId,
        organizationId: organization.id,
        customerId,
        decision,
        manualOverride: isManualOverride(manualOverride) ? manualOverride : "auto",
        overrideReason:
          requestedOverride?.overrideReason ??
          existingDecisionByCustomer.get(customerId)?.override_reason ??
          null,
        overriddenBy:
          requestedOverride?.overriddenBy ??
          existingDecisionByCustomer.get(customerId)?.overridden_by ??
          null,
        recommendationRank: recommendation.rank,
        recommendationBucket: recommendation.bucket
      })
    ];
  });
  const preservedDecisionRows = [...existingClaimedDecisionByCustomer.values()];
  const unclaimedRows = rows;
  const countableRows = [...rows, ...preservedDecisionRows];

  if (countableRows.length === 0) {
    return {
      settings,
      selectedCount: 0,
      eligibleCount: 0,
      protectedCount: 0,
      blockedCount: 0
    };
  }

  const { error: upsertError } =
    unclaimedRows.length > 0
      ? await supabase
          .from("alert_recipient_decisions")
          .upsert(unclaimedRows, { onConflict: "alert_id,customer_id" })
      : { error: null };

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  await syncOpeningOffersWithRecipientDecisions({
    supabase,
    organizationId: organization.id,
    openingId
  });

  return {
    settings,
    selectedCount: countableRows.filter((row) => row.final_decision === "send")
      .length,
    eligibleCount: countableRows.filter((row) => row.base_decision === "eligible")
      .length,
    protectedCount: countableRows.filter((row) => row.base_decision === "protected")
      .length,
    blockedCount: countableRows.filter(
      (row) => row.base_decision === "locked_blocked"
    ).length
  };
}

function revalidateServiceSurfaces(slug: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/services");
  revalidatePath("/dashboard/clients");
  revalidatePath(`/b/${slug}/waitlist`);
  revalidatePath(`/b/${slug}/waitlist/kiosk`);
}

function revalidateAppointmentSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/appointments");
}

function revalidateCustomerSurfaces() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/new-cancellation");
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/appointments");
}

function revalidateManualValidationSurfaces({
  openingId,
  organizationId
}: {
  openingId: string;
  organizationId: string;
}) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/cancellations");
  revalidatePath(`/dashboard/cancellations/${openingId}`);
  revalidatePath("/dashboard/openings");
  revalidatePath(`/dashboard/openings/${openingId}`);
  revalidatePath("/dashboard/responses");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/customers");
  revalidatePath("/dashboard/reports");
  revalidatePath("/dashboard/analytics");
  revalidatePath("/dashboard/messages");
  revalidatePath("/admin");
  revalidatePath("/admin/organizations");
  revalidatePath(`/admin/organizations/${organizationId}`);
  revalidatePath(`/admin/organizations/${organizationId}/replies`);
  revalidatePath("/admin/replies");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/sms");
  revalidatePath("/platform-admin");
  revalidatePath("/platform-admin/businesses");
  revalidatePath(`/platform-admin/businesses/${organizationId}`);
  revalidatePath("/platform-admin/sms");
  revalidatePath("/platform-admin/billing");
}

async function getCurrentOrganizationProfileId({
  supabase,
  organizationId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
}) {
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("organization_members")
    .select("profile_id")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return data?.profile_id ?? null;
}

async function ensureCustomerAlertListEntry({
  supabase,
  organizationId,
  customerId,
  serviceId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  customerId: string;
  serviceId: string | null;
}) {
  if (serviceId) {
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("id", serviceId)
      .eq("active", true)
      .maybeSingle();

    if (serviceError) {
      throw new Error(serviceError.message);
    }

    if (!service) {
      throw new Error("Selected service is not available.");
    }
  }

  const { data: activeEntries, error: activeLookupError } = await supabase
    .from("waitlist_entries")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1);

  if (activeLookupError) {
    throw new Error(activeLookupError.message);
  }

  const activeEntry = activeEntries?.[0] ?? null;

  if (activeEntry) {
    const { error: updateError } = await supabase
      .from("waitlist_entries")
      .update({ service_id: serviceId })
      .eq("organization_id", organizationId)
      .eq("id", activeEntry.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    return {
      id: activeEntry.id,
      created: false,
      reactivated: false
    };
  }

  const { data: inactiveEntries, error: inactiveLookupError } = await supabase
    .from("waitlist_entries")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .neq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (inactiveLookupError) {
    throw new Error(inactiveLookupError.message);
  }

  const inactiveEntry = inactiveEntries?.[0] ?? null;

  if (inactiveEntry) {
    const { error: reactivateError } = await supabase
      .from("waitlist_entries")
      .update({
        service_id: serviceId,
        status: "active"
      })
      .eq("organization_id", organizationId)
      .eq("id", inactiveEntry.id);

    if (reactivateError) {
      throw new Error(reactivateError.message);
    }

    return {
      id: inactiveEntry.id,
      created: false,
      reactivated: true
    };
  }

  const { data: newEntry, error: insertError } = await supabase
    .from("waitlist_entries")
    .insert({
      organization_id: organizationId,
      customer_id: customerId,
      service_id: serviceId,
      status: "active"
    })
    .select("id")
    .single();

  if (insertError || !newEntry) {
    throw new Error(insertError?.message ?? "Automatic alert-list setup failed.");
  }

  return {
    id: newEntry.id,
    created: true,
    reactivated: false
  };
}

async function verifyAppointmentReferences({
  supabase,
  organizationId,
  customerId,
  serviceId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  customerId: string;
  serviceId: string | null;
}) {
  const [customerResult, serviceResult, consentResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, deleted_at")
      .eq("organization_id", organizationId)
      .eq("id", customerId)
      .single(),
    serviceId
      ? supabase
          .from("services")
          .select("id")
          .eq("organization_id", organizationId)
          .eq("id", serviceId)
          .eq("active", true)
          .single()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("sms_consents")
      .select("status")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .maybeSingle()
  ]);

  if (customerResult.error || !customerResult.data) {
    throw new Error(
      customerResult.error?.message ?? "Client not found for this organization."
    );
  }

  if (customerResult.data.deleted_at) {
    throw new Error("Deleted clients cannot be scheduled for appointments.");
  }

  if (serviceResult.error) {
    throw new Error(serviceResult.error.message);
  }

  if (serviceId && !serviceResult.data) {
    throw new Error("Selected service is not available for this organization.");
  }

  if (consentResult.error) {
    throw new Error(consentResult.error.message);
  }

  return {
    consent: consentResult.data
  };
}

async function maybeScheduleAppointmentReminder({
  supabase,
  organizationId,
  customerId,
  appointmentId,
  startsAt,
  defaultReminderDelayHours,
  shouldScheduleReminder
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  customerId: string;
  appointmentId: string;
  startsAt: string;
  defaultReminderDelayHours: number;
  shouldScheduleReminder: boolean;
}): Promise<boolean> {
  if (!shouldScheduleReminder) {
    return false;
  }

  const scheduledFor = new Date(startsAt);
  scheduledFor.setHours(scheduledFor.getHours() - defaultReminderDelayHours);

  if (Number.isNaN(scheduledFor.getTime())) {
    throw new Error("Appointment reminder time could not be calculated.");
  }

  const { error } = await supabase.rpc("schedule_appointment_reminder", {
    target_organization_id: organizationId,
    target_appointment_id: appointmentId,
    target_customer_id: customerId,
    target_scheduled_for: scheduledFor.toISOString(),
    target_template_key: "appointment_reminder_24h"
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

async function loadAppointmentReminderSettings({
  supabase,
  organizationId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
}) {
  const { data: settings, error: settingsError } = await supabase
    .from("organization_settings")
    .select("appointment_reminders_enabled, default_reminder_delay_hours")
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  return {
    defaultReminderDelayHours: settings?.default_reminder_delay_hours ?? 24,
    organizationRemindersEnabled: Boolean(settings?.appointment_reminders_enabled)
  };
}

async function cancelPendingAppointmentReminders({
  supabase,
  organizationId,
  appointmentId
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organizationId: string;
  appointmentId: string;
}) {
  const { error } = await supabase.rpc("cancel_pending_appointment_reminders", {
    target_organization_id: organizationId,
    target_appointment_id: appointmentId
  });

  if (error) {
    throw new Error(error.message);
  }
}

function deriveAppointmentConfirmationStatus({
  status,
  requestConfirmation
}: {
  status: "scheduled" | "confirmed" | "cancelled" | "completed" | "no_show";
  requestConfirmation: boolean;
}) {
  if (status === "cancelled") {
    return "cancelled_by_client" as const;
  }

  if (requestConfirmation && status === "scheduled") {
    return "pending" as const;
  }

  if (!requestConfirmation) {
    return "no_response" as const;
  }

  return "confirmed_by_client" as const;
}

export async function createServiceAction(formData: FormData) {
  const input = buildServiceCreateInput({
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    normalPrice: formData.get("normalPrice")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/services", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageServices
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("services").insert({
    organization_id: organization.id,
    name: input.value.name,
    description: input.value.description,
    duration_minutes: input.value.durationMinutes,
    normal_price_cents: input.value.normalPriceCents,
    active: input.value.active
  });

  if (error) {
    redirectWithError("/dashboard/services", error.message);
  }

  revalidateServiceSurfaces(organization.slug);
  redirect("/dashboard/services");
}

export async function updateServiceAction(formData: FormData) {
  const input = buildServiceUpdateInput({
    serviceId: formData.get("serviceId"),
    name: formData.get("name"),
    description: formData.get("description"),
    durationMinutes: formData.get("durationMinutes"),
    normalPrice: formData.get("normalPrice"),
    active: formData.get("active")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/services", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageServices
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({
      name: input.value.name,
      description: input.value.description,
      duration_minutes: input.value.durationMinutes,
      normal_price_cents: input.value.normalPriceCents,
      active: input.value.active
    })
    .eq("organization_id", organization.id)
    .eq("id", input.value.serviceId);

  if (error) {
    redirectWithError("/dashboard/services", error.message);
  }

  revalidateServiceSurfaces(organization.slug);
  redirect("/dashboard/services");
}

export async function toggleServiceActiveAction(formData: FormData) {
  const serviceId = String(formData.get("serviceId") ?? "").trim();
  const active = formData.get("active") === "true";

  if (!serviceId) {
    redirectWithError("/dashboard/services", "Service id is required.");
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageServices
  });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("services")
    .update({ active })
    .eq("organization_id", organization.id)
    .eq("id", serviceId);

  if (error) {
    redirectWithError("/dashboard/services", error.message);
  }

  revalidateServiceSurfaces(organization.slug);
  redirect("/dashboard/services");
}

export async function createCustomerAction(formData: FormData) {
  const input = buildCustomerCreateInput({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    phoneCountry: formData.get("phoneCountry"),
    phoneNational: formData.get("phoneNational"),
    email: formData.get("email"),
    preferredLanguage: formData.get("preferredLanguage"),
    notes: formData.get("notes"),
    consentStatus: formData.get("consentStatus"),
    hasConsentProof: formData.get("hasConsentProof"),
    serviceId: formData.get("serviceId")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/clients", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();
  const { data: existingCustomer, error: existingCustomerError } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("phone_e164", input.value.phoneE164)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingCustomerError) {
    redirectWithError("/dashboard/clients", existingCustomerError.message);
  }

  if (existingCustomer) {
    redirectWithError(
      "/dashboard/clients",
      "A client with this phone number already exists. Edit the existing client instead of creating a new one."
    );
  }

  const customerWrite = await supabase
    .from("customers")
    .insert({
      organization_id: organization.id,
      full_name: input.value.fullName,
      phone_e164: input.value.phoneE164,
      email: input.value.email,
      preferred_language: input.value.preferredLanguage,
      notes: input.value.notes,
      source: "manual"
    })
    .select("id")
    .single();

  const { data: customer, error: customerError } = customerWrite;

  if (customerError || !customer) {
    redirectWithError(
      "/dashboard/clients",
      customerError?.message ?? "Client creation failed."
    );
  }

  const now = new Date().toISOString();
  const { error: consentError } = await supabase.from("sms_consents").upsert(
    {
      organization_id: organization.id,
      customer_id: customer.id,
      phone_e164: input.value.phoneE164,
      status: input.value.consentStatus,
      source: "dashboard_manual",
      consent_text:
        input.value.consentStatus === "opted_in"
          ? "Manual merchant confirmation of SMS consent."
          : null,
      consented_at: input.value.consentStatus === "opted_in" ? now : null,
      unsubscribed_at: input.value.consentStatus === "opted_out" ? now : null
    },
    {
      onConflict: "organization_id,customer_id"
    }
  );

  if (consentError) {
    redirectWithError("/dashboard/clients", consentError.message);
  }

  let alertListEntry: Awaited<ReturnType<typeof ensureCustomerAlertListEntry>>;

  try {
    alertListEntry = await ensureCustomerAlertListEntry({
      supabase,
      organizationId: organization.id,
      customerId: customer.id,
      serviceId: input.value.serviceId
    });
  } catch (error) {
    console.warn("Automatic alert-list setup failed", {
      customerId: customer.id,
      organizationId: organization.id
    });
    const safeAlertListError =
      error instanceof Error && error.message === "Selected service is not available."
        ? error.message
        : "Client saved, but automatic alert-list setup failed. Please retry or contact support.";

    redirectWithError(
      "/dashboard/clients",
      safeAlertListError
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "waitlist.auto_added_from_customer_create",
    entity_type: "waitlist_entries",
    entity_id: alertListEntry.id,
    metadata: {
      customer_id: customer.id,
      waitlist_entry_id: alertListEntry.id,
      service_interest: input.value.serviceId ?? "all_services",
      auto_added: true,
      created: alertListEntry.created,
      reactivated: alertListEntry.reactivated,
      consent_status: input.value.consentStatus
    }
  });

  let consentRequestMessage: string | null = null;
  let consentRequestWarning: string | null = null;

  if (input.value.consentStatus === "needs_consent") {
    try {
      if (await isOrganizationSmsPaused(organization.id)) {
        consentRequestWarning =
          "Client added, but consent request SMS was not sent because SMS sending is paused for this organization.";
      } else {
        const consentRequestResult = await sendConsentRequestSms({
          supabase,
          organization: {
            id: organization.id,
            name: organization.name,
            defaultLanguage: organization.defaultLanguage
          },
          customer: {
            id: customer.id,
            fullName: input.value.fullName,
            phoneE164: input.value.phoneE164,
            preferredLanguage: input.value.preferredLanguage,
            consentStatus: input.value.consentStatus,
            deletedAt: null
          }
        });

        if (consentRequestResult.status === "failed") {
          consentRequestWarning = consentRequestResult.message;
        } else if (consentRequestResult.status === "skipped") {
          consentRequestWarning = consentRequestResult.message;
        } else {
          consentRequestMessage = consentRequestResult.message;
        }
      }
    } catch (error) {
      consentRequestWarning = `Client added, but consent request SMS failed: ${getSafeProviderErrorMessage(error)}`;
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");

  if (consentRequestWarning) {
    redirectWithWarning("/dashboard/clients", consentRequestWarning);
  }

  if (consentRequestMessage) {
    redirectWithNotice("/dashboard/clients", consentRequestMessage);
  }

  redirect("/dashboard/clients");
}

export async function updateCustomerAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const redirectPath = customerId
    ? `/dashboard/clients/${customerId}/edit`
    : "/dashboard/clients";

  if (!customerId) {
    redirectWithError("/dashboard/clients", "Client not found.");
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();

  const [existingCustomerResult, existingConsentResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone_e164, email, preferred_language, notes, deleted_at")
      .eq("organization_id", organization.id)
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("sms_consents")
      .select("status, source, consent_text, consented_at, unsubscribed_at")
      .eq("organization_id", organization.id)
      .eq("customer_id", customerId)
      .maybeSingle()
  ]);

  if (existingCustomerResult.error || existingConsentResult.error) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  const existingCustomer = existingCustomerResult.data;
  const existingConsent = existingConsentResult.data;

  if (!existingCustomer) {
    redirectWithError("/dashboard/clients", "Client not found.");
  }

  if (existingCustomer.deleted_at) {
    redirectWithError(
      redirectPath,
      "Deleted clients must be restored before they can be edited."
    );
  }

  const input = buildCustomerUpdateInput({
    customerId,
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    phoneCountry: formData.get("phoneCountry"),
    phoneNational: formData.get("phoneNational"),
    email: formData.get("email"),
    preferredLanguage: formData.get("preferredLanguage"),
    notes: formData.get("notes"),
    consentStatus: formData.get("consentStatus"),
    hasConsentProof: formData.get("hasConsentProof"),
    existingConsentStatus: existingConsent?.status,
    serviceId: formData.get("serviceId")
  });

  if (!input.ok) {
    redirectWithError(redirectPath, input.errors.join(" "));
  }

  const { data: duplicateCustomer, error: duplicateError } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("phone_e164", input.value.phoneE164)
    .is("deleted_at", null)
    .neq("id", input.value.customerId)
    .maybeSingle();

  if (duplicateError) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  if (duplicateCustomer) {
    redirectWithError(
      redirectPath,
      "Another client already uses this phone number."
    );
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("customers")
    .update({
      full_name: input.value.fullName,
      phone_e164: input.value.phoneE164,
      email: input.value.email,
      preferred_language: input.value.preferredLanguage,
      notes: input.value.notes
    })
    .eq("organization_id", organization.id)
    .eq("id", input.value.customerId);

  if (updateError) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  const consentedAt =
    input.value.consentStatus === "opted_in"
      ? existingConsent?.status === "opted_in" && existingConsent.consented_at
        ? existingConsent.consented_at
        : now
      : null;
  const unsubscribedAt =
    input.value.consentStatus === "opted_out"
      ? existingConsent?.status === "opted_out" &&
        existingConsent.unsubscribed_at
        ? existingConsent.unsubscribed_at
        : now
      : existingConsent?.unsubscribed_at ?? null;

  const consentWrite = {
    organization_id: organization.id,
    customer_id: input.value.customerId,
    phone_e164: input.value.phoneE164,
    status: input.value.consentStatus,
    source: "dashboard_manual_edit",
    consent_text:
      input.value.consentStatus === "opted_in"
        ? existingConsent?.status === "opted_in" && existingConsent.consent_text
          ? existingConsent.consent_text
          : "Manual merchant confirmation of SMS consent during client edit."
        : null,
    consented_at: consentedAt,
    unsubscribed_at: unsubscribedAt
  };

  const { error: consentError } = await supabase.from("sms_consents").upsert(
    consentWrite,
    {
      onConflict: "organization_id,customer_id"
    }
  );

  if (consentError) {
    redirectWithError(redirectPath, genericClientSaveError);
  }

  try {
    await ensureCustomerAlertListEntry({
      supabase,
      organizationId: organization.id,
      customerId: input.value.customerId,
      serviceId: input.value.serviceId
    });
  } catch (error) {
    const safeAlertListError =
      error instanceof Error && error.message === "Selected service is not available."
        ? error.message
        : "Client saved, but waitlist service interest update failed. Please retry.";

    redirectWithError(redirectPath, safeAlertListError);
  }

  const { error: auditError } = await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "customer.updated",
    entity_type: "customers",
    entity_id: input.value.customerId,
    metadata: {
      phone_changed: existingCustomer.phone_e164 !== input.value.phoneE164,
      old_phone_e164: existingCustomer.phone_e164,
      new_phone_e164: input.value.phoneE164,
      changed_fields: {
        full_name: existingCustomer.full_name !== input.value.fullName,
        phone_e164: existingCustomer.phone_e164 !== input.value.phoneE164,
        email: existingCustomer.email !== input.value.email,
        preferred_language:
          existingCustomer.preferred_language !== input.value.preferredLanguage,
        notes: existingCustomer.notes !== input.value.notes,
        consent_status: true,
        service_interest: input.value.serviceId ?? "all_services"
      }
    }
  });

  if (auditError) {
    console.warn("Customer update audit failed", {
      customerId: input.value.customerId,
      organizationId: organization.id
    });
  }

  await recordManagerModeDashboardAction({
    action: "admin.manager_mode.customer.updated",
    entityType: "customers",
    entityId: input.value.customerId,
    metadata: {
      phone_changed: existingCustomer.phone_e164 !== input.value.phoneE164
    }
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/responses");
  redirect("/dashboard/clients");
}

export async function deleteCustomerAction(formData: FormData) {
  const input = validateCustomerDeleteForm({
    customerId: formData.get("customerId"),
    reason: formData.get("reason"),
    confirm: formData.get("confirm"),
    returnTo: formData.get("returnTo")
  });

  if (!input.ok) {
    redirectWithCustomerActionMessage(input.returnTo, "error", input.error);
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();
  const returnTo = input.value.returnTo;
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, phone_e164, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", input.value.customerId)
    .maybeSingle();

  if (customerError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  if (!customer) {
    redirectWithCustomerActionMessage(returnTo, "error", "Client not found.");
  }

  if (customer.deleted_at) {
    redirectWithCustomerActionMessage(
      returnTo,
      "notice",
      "Client is already deleted."
    );
  }

  const [activeWaitlistResult, pendingOffersResult, futureAppointmentsResult] =
    await Promise.all([
      supabase
        .from("waitlist_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("customer_id", customer.id)
        .eq("status", "active"),
      supabase
        .from("opening_offers")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("customer_id", customer.id)
        .in("status", ["pending", "sent", "responded"]),
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("customer_id", customer.id)
        .gt("starts_at", new Date().toISOString())
        .in("status", ["scheduled", "confirmed"])
    ]);

  if (
    activeWaitlistResult.error ||
    pendingOffersResult.error ||
    futureAppointmentsResult.error
  ) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  const now = new Date().toISOString();
  const actorProfileId = await getCurrentOrganizationProfileId({
    supabase,
    organizationId: organization.id
  });
  const activeWaitlistCount = activeWaitlistResult.count ?? 0;
  const pendingOffersCount = pendingOffersResult.count ?? 0;
  const futureAppointmentsCount = futureAppointmentsResult.count ?? 0;

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      deleted_at: now,
      deleted_by_profile_id: actorProfileId,
      deleted_reason: input.value.reason,
      restored_at: null,
      restored_by_profile_id: null,
      deletion_metadata: {
        had_active_waitlist_entries: activeWaitlistCount > 0,
        active_waitlist_entries_count: activeWaitlistCount,
        had_pending_offers: pendingOffersCount > 0,
        pending_offers_count: pendingOffersCount,
        had_future_appointments: futureAppointmentsCount > 0,
        future_appointments_count: futureAppointmentsCount
      }
    })
    .eq("organization_id", organization.id)
    .eq("id", customer.id)
    .is("deleted_at", null);

  if (updateError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  const [waitlistUpdate, offersUpdate] = await Promise.all([
    supabase
      .from("waitlist_entries")
      .update({ status: "removed" })
      .eq("organization_id", organization.id)
      .eq("customer_id", customer.id)
      .eq("status", "active"),
    supabase
      .from("opening_offers")
      .update({ status: "rejected" })
      .eq("organization_id", organization.id)
      .eq("customer_id", customer.id)
      .in("status", ["pending", "sent", "responded"])
  ]);

  if (waitlistUpdate.error || offersUpdate.error) {
    console.warn("Customer operational cleanup failed after soft delete", {
      customerId: customer.id,
      organizationId: organization.id
    });
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "customer.deleted",
    entity_type: "customers",
    entity_id: customer.id,
    metadata: {
      customer_id: customer.id,
      reason_length: input.value.reason.length,
      had_active_waitlist_entries: activeWaitlistCount > 0,
      active_waitlist_entries_count: activeWaitlistCount,
      pending_offers_count: pendingOffersCount,
      future_appointments_count: futureAppointmentsCount
    }
  });

  await recordManagerModeDashboardAction({
    action: "admin.manager_mode.customer.deleted",
    entityType: "customers",
    entityId: customer.id,
    metadata: {
      pending_offers_count: pendingOffersCount,
      active_waitlist_entries_count: activeWaitlistCount
    }
  });

  revalidateCustomerSurfaces();
  redirectWithCustomerActionMessage(
    "/dashboard/clients?tab=deleted",
    "message",
    "Client deleted."
  );
}

export async function restoreCustomerAction(formData: FormData) {
  const customerId = String(formData.get("customerId") ?? "").trim();
  const returnTo = buildSafeCustomerReturnPath(
    String(formData.get("returnTo") ?? ""),
    "/dashboard/clients?tab=deleted"
  );

  if (!customerId) {
    redirectWithCustomerActionMessage(returnTo, "error", "Client not found.");
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageCustomers
  });
  const supabase = await createSupabaseServerClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, phone_e164, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", customerId)
    .maybeSingle();

  if (customerError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  if (!customer) {
    redirectWithCustomerActionMessage(returnTo, "error", "Client not found.");
  }

  if (!customer.deleted_at) {
    redirectWithCustomerActionMessage(
      "/dashboard/clients?tab=active",
      "notice",
      "Client is already active."
    );
  }

  const { data: duplicateCustomer, error: duplicateError } = await supabase
    .from("customers")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("phone_e164", customer.phone_e164)
    .is("deleted_at", null)
    .neq("id", customer.id)
    .maybeSingle();

  if (duplicateError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  if (duplicateCustomer) {
    await supabase.from("audit_logs").insert({
      organization_id: organization.id,
      action: "customer.restore_blocked",
      entity_type: "customers",
      entity_id: customer.id,
      metadata: {
        customer_id: customer.id,
        reason: "active_phone_conflict",
        conflicting_customer_id: duplicateCustomer.id
      }
    });

    redirectWithCustomerActionMessage(
      returnTo,
      "error",
      "A current active client already uses this phone number. Merge/resolve manually."
    );
  }

  const actorProfileId = await getCurrentOrganizationProfileId({
    supabase,
    organizationId: organization.id
  });
  const { error: restoreError } = await supabase
    .from("customers")
    .update({
      deleted_at: null,
      deleted_by_profile_id: null,
      deleted_reason: null,
      restored_at: new Date().toISOString(),
      restored_by_profile_id: actorProfileId
    })
    .eq("organization_id", organization.id)
    .eq("id", customer.id);

  if (restoreError) {
    redirectWithCustomerActionMessage(returnTo, "error", genericClientSaveError);
  }

  await supabase.from("audit_logs").insert({
    organization_id: organization.id,
    action: "customer.restored",
    entity_type: "customers",
    entity_id: customer.id,
    metadata: {
      customer_id: customer.id
    }
  });

  await recordManagerModeDashboardAction({
    action: "admin.manager_mode.customer.restored",
    entityType: "customers",
    entityId: customer.id
  });

  revalidateCustomerSurfaces();
  redirectWithCustomerActionMessage(
    "/dashboard/clients?tab=active",
    "message",
    "Client restored."
  );
}

export async function createAppointmentAction(formData: FormData) {
  const returnView = String(formData.get("returnView") ?? "month");
  const returnDate = String(formData.get("returnDate") ?? "");
  const returnPath =
    returnDate && /^\d{4}-\d{2}-\d{2}$/.test(returnDate)
      ? `/dashboard/appointments?view=${encodeURIComponent(returnView)}&date=${encodeURIComponent(returnDate)}`
      : "/dashboard/appointments";

  const input = buildAppointmentCreateInput({
    customerId: formData.get("customerId"),
    serviceId: formData.get("serviceId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    timezone: formData.get("timezone"),
    notes: formData.get("notes"),
    sendReminder: formData.get("sendReminder"),
    requestConfirmation: formData.get("requestConfirmation"),
    recurrenceFrequency: formData.get("recurrenceFrequency"),
    recurrenceInterval: formData.get("recurrenceInterval"),
    recurrenceWeekdays: formData.get("recurrenceWeekdays"),
    recurrenceMonthlyPattern: formData.get("recurrenceMonthlyPattern"),
    recurrenceEndType: formData.get("recurrenceEndType"),
    recurrenceEndAfterCount: formData.get("recurrenceEndAfterCount"),
    recurrenceEndDate: formData.get("recurrenceEndDate")
  });

  if (!input.ok) {
    redirectWithError(returnPath, input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageAppointments
  });
  const supabase = await createSupabaseServerClient();

  try {
    const { consent } = await verifyAppointmentReferences({
      supabase,
      organizationId: organization.id,
      customerId: input.value.customerId,
      serviceId: input.value.serviceId
    });
    const reminderSettings = await loadAppointmentReminderSettings({
      supabase,
      organizationId: organization.id
    });
    const actorProfileId = await getCurrentOrganizationProfileId({
      supabase,
      organizationId: organization.id
    });

    if (input.value.recurrence.frequency !== "none") {
      await createRecurringAppointments({
        supabase,
        organizationId: organization.id,
        input: input.value,
        recurrence: input.value.recurrence,
        reminderSettings,
        consentStatus: consent?.status,
        actorProfileId
      });
    } else {
      const shouldScheduleReminder = shouldQueueAppointmentReminder({
        appointmentStatus: "scheduled",
        consentStatus: consent?.status,
        organizationRemindersEnabled:
          reminderSettings.organizationRemindersEnabled,
        sendReminder: input.value.sendReminder
      });

      const appointment = await createSingleAppointmentRecord({
        supabase,
        organizationId: organization.id,
        input: input.value,
        shouldScheduleReminder,
        requestConfirmation: input.value.requestConfirmation
      });

      await supabase.from("appointment_events").insert({
        organization_id: organization.id,
        appointment_id: appointment.id,
        event_type: "appointment.created",
        metadata: {
          source: "dashboard",
          reminder_requested: input.value.sendReminder,
          confirmation_requested: input.value.requestConfirmation
        }
      });

      await maybeScheduleAppointmentReminder({
        supabase,
        organizationId: organization.id,
        customerId: input.value.customerId,
        appointmentId: appointment.id,
        startsAt: input.value.startsAt,
        defaultReminderDelayHours: reminderSettings.defaultReminderDelayHours,
        shouldScheduleReminder
      });
    }
  } catch (error) {
    redirectWithError(
      returnPath,
      error instanceof Error ? error.message : "Appointment creation failed."
    );
  }

  revalidateAppointmentSurfaces();
  redirect(returnPath);
}

export async function updateAppointmentAction(formData: FormData) {
  const input = buildAppointmentUpdateInput({
    appointmentId: formData.get("appointmentId"),
    customerId: formData.get("customerId"),
    serviceId: formData.get("serviceId"),
    startsAt: formData.get("startsAt"),
    endsAt: formData.get("endsAt"),
    timezone: formData.get("timezone"),
    notes: formData.get("notes"),
    status: formData.get("status"),
    confirmationStatus: formData.get("confirmationStatus"),
    sendReminder: formData.get("sendReminder"),
    requestConfirmation: formData.get("requestConfirmation")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/appointments", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canManageAppointments
  });
  const supabase = await createSupabaseServerClient();

  try {
    const { consent } = await verifyAppointmentReferences({
      supabase,
      organizationId: organization.id,
      customerId: input.value.customerId,
      serviceId: input.value.serviceId
    });
    const reminderSettings = await loadAppointmentReminderSettings({
      supabase,
      organizationId: organization.id
    });
    const shouldScheduleReminder = shouldQueueAppointmentReminder({
      appointmentStatus: input.value.status,
      consentStatus: consent?.status,
      organizationRemindersEnabled:
        reminderSettings.organizationRemindersEnabled,
      sendReminder: input.value.sendReminder
    });
    const reminderStatus = shouldScheduleReminder ? "scheduled" : "not_scheduled";
    const confirmationStatus = deriveAppointmentConfirmationStatus({
      status: input.value.status,
      requestConfirmation: input.value.requestConfirmation
    });

    const { data: appointment, error } = await supabase
      .from("appointments")
      .update({
        customer_id: input.value.customerId,
        service_id: input.value.serviceId,
        starts_at: input.value.startsAt,
        ends_at: input.value.endsAt,
        timezone: input.value.timezone || organization.timezone,
        status: input.value.status,
        reminder_status: reminderStatus,
        confirmation_status: confirmationStatus,
        reminder_24h_enabled: input.value.sendReminder,
        confirmation_request_enabled: input.value.requestConfirmation,
        notes: input.value.notes
      })
      .eq("organization_id", organization.id)
      .eq("id", input.value.appointmentId)
      .select("id")
      .single();

    if (error || !appointment) {
      throw new Error(error?.message ?? "Appointment update failed.");
    }

    await supabase.from("appointment_events").insert({
      organization_id: organization.id,
      appointment_id: input.value.appointmentId,
      event_type: "appointment.updated",
      metadata: {
        status: input.value.status,
        reminder_requested: input.value.sendReminder,
        confirmation_status: confirmationStatus,
        confirmation_requested: input.value.requestConfirmation
      }
    });

    const reminderQueued = await maybeScheduleAppointmentReminder({
      supabase,
      organizationId: organization.id,
      customerId: input.value.customerId,
      appointmentId: input.value.appointmentId,
      startsAt: input.value.startsAt,
      defaultReminderDelayHours: reminderSettings.defaultReminderDelayHours,
      shouldScheduleReminder
    });

    if (!reminderQueued) {
      await cancelPendingAppointmentReminders({
        supabase,
        organizationId: organization.id,
        appointmentId: input.value.appointmentId
      });
    }

    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.appointment.updated",
      entityType: "appointments",
      entityId: input.value.appointmentId,
      metadata: {
        status: input.value.status,
        reminder_requested: input.value.sendReminder,
        confirmation_status: confirmationStatus
      }
    });
  } catch (error) {
    redirectWithError(
      "/dashboard/appointments",
      error instanceof Error ? error.message : "Appointment update failed."
    );
  }

  revalidateAppointmentSurfaces();
  redirect("/dashboard/appointments");
}

async function sendOpeningSmsAlerts({
  supabase,
  organization,
  openingId,
  confirmProtectedRecipients = false
}: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  organization: Awaited<ReturnType<typeof requireReadyOrganization>>;
  openingId: string;
  confirmProtectedRecipients?: boolean;
}) {
  await requireOrganizationSmsNotPaused(organization.id);

  const smsStatus = getSmsRuntimeStatus();

  if (!smsStatus.canSendOpeningAlerts) {
    throw new Error(
      smsStatus.blockingReasons.join(" ") || "SMS provider is not ready."
    );
  }

  const organizationSmsReadiness = await loadOrganizationSmsReadiness(
    supabase,
    organization.id
  );

  if (!organizationSmsReadiness.canSendSms) {
    throw new Error(organizationSmsReadiness.blockingReasons.join(" "));
  }

  const smsPersistence = await checkSmsDeliveryPersistenceReadiness();

  if (!smsPersistence.ready) {
    throw new Error(smsPersistence.blockingReasons.join(" "));
  }

  const smartSmsPersistence = await checkSmartSmsPersistenceReadiness();

  if (!smartSmsPersistence.ready) {
    throw new Error(smartSmsPersistence.blockingReasons.join(" "));
  }

  await prepareSmartRecipientDecisionsForOpening({
    supabase,
    organization,
    openingId
  });

  const [openingResult, decisionsResult] = await Promise.all([
    supabase
      .from("openings")
      .select("id, title, service_id, start_time, end_time, offer_label")
      .eq("organization_id", organization.id)
      .eq("id", openingId)
      .single(),
    supabase
      .from("alert_recipient_decisions")
      .select(
        "id, customer_id, base_decision, reason_codes, reason_label, warning_required, delivery_status"
      )
      .eq("organization_id", organization.id)
      .eq("alert_id", openingId)
      .eq("final_decision", "send")
      .is("sent_at", null)
      .is("delivery_status", null)
  ]);

  if (openingResult.error || !openingResult.data) {
    throw new Error(openingResult.error?.message ?? "Opening not found.");
  }

  if (decisionsResult.error) {
    throw new Error(decisionsResult.error.message);
  }

  const opening = openingResult.data;
  const selectedDecisions = decisionsResult.data ?? [];

  const includedProtectedCount = selectedDecisions.filter(
    (decision) =>
      decision.base_decision === "protected" && decision.warning_required
  ).length;

  if (includedProtectedCount > 0 && !confirmProtectedRecipients) {
    throw new Error(
      "You included clients protected by Smart SMS mode. Confirm that you want to send this alert despite the unsubscribe risk."
    );
  }

  if (selectedDecisions.length === 0) {
    return {
      sent: 0,
      failed: 0,
      failureMessage: null
    };
  }

  const customerIds = selectedDecisions.map((decision) => decision.customer_id);
  const [serviceResult, customersResult, consentsResult] =
    await Promise.all([
    opening.service_id
      ? supabase
          .from("services")
          .select("id, name")
          .eq("organization_id", organization.id)
          .eq("id", opening.service_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("customers")
      .select("id, full_name, phone_e164, preferred_language, deleted_at")
      .eq("organization_id", organization.id)
      .in("id", customerIds),
    supabase
      .from("sms_consents")
      .select("customer_id, status, unsubscribed_at")
      .eq("organization_id", organization.id)
      .in("customer_id", customerIds)
  ]);

  if (serviceResult.error) {
    throw new Error(serviceResult.error.message);
  }

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  if (consentsResult.error) {
    throw new Error(consentsResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((customer) => [customer.id, customer])
  );
  const consentByCustomer = new Map(
    (consentsResult.data ?? []).map((consent) => [
      consent.customer_id,
      consent
    ])
  );
  const finalSendHardBlockReasonsByCustomerId = new Map<string, ReasonCode>();

  for (const decision of selectedDecisions) {
    const customer = customerById.get(decision.customer_id);
    const consent = consentByCustomer.get(decision.customer_id);

    if (!customer || customer.deleted_at) {
      finalSendHardBlockReasonsByCustomerId.set(
        decision.customer_id,
        "blocked_archived_customer"
      );
      continue;
    }

    if (!/^\+[1-9][0-9]{7,14}$/.test(customer.phone_e164)) {
      finalSendHardBlockReasonsByCustomerId.set(
        decision.customer_id,
        "blocked_invalid_phone"
      );
      continue;
    }

    if (!consent || consent.status !== "opted_in") {
      finalSendHardBlockReasonsByCustomerId.set(
        decision.customer_id,
        "blocked_no_consent"
      );
      continue;
    }

    if (consent.unsubscribed_at) {
      finalSendHardBlockReasonsByCustomerId.set(
        decision.customer_id,
        "blocked_opted_out"
      );
    }
  }

  await markRecipientDecisionsLockedBeforeSend({
    supabase,
    organizationId: organization.id,
    openingId,
    finalSendHardBlockReasonsByCustomerId
  });

  await syncOpeningOffersWithRecipientDecisions({
    supabase,
    organizationId: organization.id,
    openingId
  });

  const sendableCandidateDecisions = selectedDecisions.filter(
    (decision) => !finalSendHardBlockReasonsByCustomerId.has(decision.customer_id)
  );

  if (sendableCandidateDecisions.length === 0) {
    return {
      sent: 0,
      failed: 0,
      failureMessage: null
    };
  }

  await syncOpeningOffersWithRecipientDecisions({
    supabase,
    organizationId: organization.id,
    openingId
  });

  const offersResult = await supabase
    .from("opening_offers")
    .select("id, customer_id")
    .eq("organization_id", organization.id)
    .eq("opening_id", openingId)
    .eq("status", "pending")
    .in(
      "customer_id",
      sendableCandidateDecisions.map((decision) => decision.customer_id)
    );

  if (offersResult.error) {
    throw new Error(offersResult.error.message);
  }

  const offerByCustomer = new Map(
    (offersResult.data ?? []).map((offer) => [offer.customer_id, offer])
  );
  const sendableDecisions = sendableCandidateDecisions.filter((decision) => {
    const customer = customerById.get(decision.customer_id);
    const consent = consentByCustomer.get(decision.customer_id);

    return Boolean(
      customer?.phone_e164 &&
        !customer.deleted_at &&
        /^\+[1-9][0-9]{7,14}$/.test(customer.phone_e164) &&
        consent?.status === "opted_in" &&
        !consent.unsubscribed_at &&
        offerByCustomer.has(decision.customer_id)
    );
  });

  if (sendableDecisions.length === 0) {
    return {
      sent: 0,
      failed: 0,
      failureMessage: null
    };
  }

  const now = new Date().toISOString();
  const successfulOfferIds: string[] = [];
  const failedReasons: string[] = [];
  const sentMessageIds: string[] = [];
  const outboundProvider = getOrganizationSmsRuntimeProviderName();
  const outboundFromNumber = await resolveOrganizationSmsFromNumber({
    organizationId: organization.id
  });

  for (const decision of sendableDecisions) {
    const offer = offerByCustomer.get(decision.customer_id);
    const customer = customerById.get(decision.customer_id);

    if (!customer?.phone_e164 || !offer) {
      continue;
    }

    const { data: claimedDecision, error: claimError } = await supabase
      .from("alert_recipient_decisions")
      .update({ delivery_status: "pending_send" })
      .eq("organization_id", organization.id)
      .eq("id", decision.id)
      .is("sent_at", null)
      .is("delivery_status", null)
      .select("id")
      .maybeSingle();

    if (claimError) {
      failedReasons.push(claimError.message);
      continue;
    }

    if (!claimedDecision) {
      continue;
    }

    const language = customer.preferred_language ?? organization.defaultLanguage;
    const { dateLabel, timeLabel } = getOpeningSmsDateTimeLabels(
      opening.start_time,
      language,
      organization.timezone
    );
    const messageBody = await resolveOpeningAlertSmsBody(supabase, {
      organizationId: organization.id,
      language,
      context: {
        businessName: organization.name,
        serviceName: serviceResult.data?.name ?? opening.title,
        appointmentDate: dateLabel,
        appointmentTime: timeLabel,
        clientName: customer.full_name?.trim().split(/\s+/)[0] ?? null,
        replyKeyword: language === "fr" ? "OUI" : "YES"
      },
      fallbackInput: {
        businessName: organization.name,
        serviceName: serviceResult.data?.name ?? opening.title,
        startsAt: opening.start_time,
        endsAt: opening.end_time,
        offerLabel: opening.offer_label,
        customerFirstName: customer.full_name?.trim().split(/\s+/)[0] ?? null,
        language,
        includeOptOut: true
      }
    });

    const { data: pendingMessage, error: pendingMessageError } = await supabase
      .from("sms_messages")
      .insert({
        organization_id: organization.id,
        customer_id: decision.customer_id,
        opening_id: openingId,
        message_type: "opening_alert",
        direction: "outbound",
        provider: outboundProvider,
        provider_message_id: null,
        from_number: outboundFromNumber,
        to_number: customer.phone_e164,
        body: messageBody,
        status: "pending_send"
      })
      .select("id")
      .single();

    if (pendingMessageError || !pendingMessage) {
      failedReasons.push(
        pendingMessageError?.message ?? "SMS outbox persistence failed."
      );
      await supabase
        .from("alert_recipient_decisions")
        .update({ delivery_status: "failed" })
        .eq("organization_id", organization.id)
        .eq("id", decision.id);
      continue;
    }

    try {
      const sendResult = await sendOrganizationSms({
        organizationId: organization.id,
        to: customer.phone_e164,
        body: messageBody,
        messageType: "opening_alert",
        openingId,
        customerId: decision.customer_id,
        consentStatus: "opted_in",
        metadata: {
          openingId,
          organizationId: organization.id,
          customerId: decision.customer_id
        }
      });

      successfulOfferIds.push(offer.id);
      sentMessageIds.push(pendingMessage.id);

      const { error: messageUpdateError } = await supabase
        .from("sms_messages")
        .update({
          provider: sendResult.provider,
          provider_message_id: sendResult.providerMessageId,
          from_number: sendResult.fromNumber,
          status: sendResult.status
        })
        .eq("organization_id", organization.id)
        .eq("id", pendingMessage.id);

      if (messageUpdateError) {
        failedReasons.push(messageUpdateError.message);
      }

      const { error: decisionUpdateError } = await supabase
        .from("alert_recipient_decisions")
        .update({
          sent_at: now,
          twilio_message_sid: sendResult.providerMessageId,
          delivery_status: sendResult.status
        })
        .eq("organization_id", organization.id)
        .eq("id", decision.id);

      if (decisionUpdateError) {
        failedReasons.push(decisionUpdateError.message);
      }

      await supabase.from("customer_activity_events").insert({
        organization_id: organization.id,
        customer_id: decision.customer_id,
        event_type: "sms_sent",
        event_at: now,
        related_alert_id: openingId,
        metadata: {
          sms_message_id: pendingMessage.id,
          provider: sendResult.provider,
          provider_message_id: sendResult.providerMessageId
        }
      });
    } catch (error) {
      const safeError = getSafeProviderErrorMessage(error);
      failedReasons.push(safeError);
      await supabase
        .from("sms_messages")
        .update({
          status: "failed",
          error_message: safeError
        })
        .eq("organization_id", organization.id)
        .eq("id", pendingMessage.id);
      await supabase
        .from("alert_recipient_decisions")
        .update({ delivery_status: "failed" })
        .eq("organization_id", organization.id)
        .eq("id", decision.id);
    }
  }

  if (sentMessageIds.length === 0) {
    const reason = failedReasons[0] ?? "No selected recipients are available to send.";
    throw new Error(reason);
  }

  const { error: updateError } = await supabase
    .from("opening_offers")
    .update({
      status: "sent",
      sent_at: now
    })
    .eq("organization_id", organization.id)
    .eq("opening_id", openingId)
    .eq("status", "pending")
    .in(
      "id",
      successfulOfferIds
    );

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: openingError } = await supabase
    .from("openings")
    .update({ status: "broadcasting" })
    .eq("organization_id", organization.id)
    .eq("id", openingId);

  if (openingError) {
    throw new Error(openingError.message);
  }

  await supabase.rpc("record_opening_broadcast_audit", {
    target_opening_id: openingId,
    provider_name: getSmsProvider(),
    sent_count: sentMessageIds.length,
    failed_count: failedReasons.length,
    failure_reasons: [...new Set(failedReasons)].slice(0, 5)
  });

  return {
    sent: sentMessageIds.length,
    failed: failedReasons.length,
    failureMessage:
      failedReasons.length > 0
        ? `${failedReasons.length} SMS send(s) failed and were logged.`
        : null
  };
}

export async function createOpeningAction(formData: FormData) {
  const manualExcludedCustomerIdsResult = buildManualExcludedCustomerIds(formData);

  if (!manualExcludedCustomerIdsResult.ok) {
    redirectWithError(
      "/dashboard/new-cancellation",
      manualExcludedCustomerIdsResult.error
    );
  }

  const manualExcludedCustomerIds = manualExcludedCustomerIdsResult.customerIds;
  const input = buildOpeningCreateInput({
    title: formData.get("title"),
    serviceId: formData.get("serviceId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    estimatedValue: formData.get("estimatedValue"),
    offerLabel: formData.get("offerLabel"),
    internalNote: formData.get("internalNote")
  });

  if (!input.ok) {
    redirectWithError("/dashboard/new-cancellation", input.errors.join(" "));
  }

  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();
  let createdOpeningId: string | null = null;
  let redirectError: string | null = null;

  try {
    await requireOrganizationSmsNotPaused(organization.id);

    const smsPersistence = await checkSmsDeliveryPersistenceReadiness();

    if (!smsPersistence.ready) {
      throw new Error(smsPersistence.blockingReasons.join(" "));
    }

    const smartSmsPersistence = await checkSmartSmsPersistenceReadiness();

    if (!smartSmsPersistence.ready) {
      throw new Error(smartSmsPersistence.blockingReasons.join(" "));
    }

    const { data: openingId, error } = await supabase.rpc(
      "create_opening_with_offers",
      {
        target_organization_id: organization.id,
        target_service_id: input.value.serviceId,
        opening_title: input.value.title,
        opening_start_time: input.value.startTime,
        opening_end_time: input.value.endTime,
        opening_offer_label: input.value.offerLabel,
        opening_normal_price_cents: input.value.estimatedValueCents
      }
    );

    if (error || !openingId) {
      throw new Error(error?.message ?? "Opening creation failed.");
    }

    createdOpeningId = openingId;

    const actorProfileId =
      manualExcludedCustomerIds.length > 0
        ? await getCurrentOrganizationProfileId({
            supabase,
            organizationId: organization.id
          })
        : null;
    const recipientPreparation = await prepareSmartRecipientDecisionsForOpening({
      supabase,
      organization,
      openingId,
      manualOverridesByCustomerId: new Map(
        manualExcludedCustomerIds.map((customerId) => [
          customerId,
          {
            manualOverride: "exclude" as const,
            overrideReason: "Manual exclude from opening creation review",
            overriddenBy: actorProfileId
          }
        ])
      )
    });

    if (manualExcludedCustomerIds.length > 0) {
      const { data: excludedDecisions, error: excludedDecisionError } =
        await supabase
          .from("alert_recipient_decisions")
          .select("id, customer_id")
          .eq("organization_id", organization.id)
          .eq("alert_id", openingId)
          .eq("manual_override", "exclude")
          .in("customer_id", manualExcludedCustomerIds);

      if (excludedDecisionError) {
        throw new Error(excludedDecisionError.message);
      }

      if ((excludedDecisions ?? []).length > 0) {
        const { error: excludedEventError } = await supabase
          .from("customer_activity_events")
          .insert(
            (excludedDecisions ?? []).map((decision) => ({
              organization_id: organization.id,
              customer_id: decision.customer_id,
              event_type: "manual_recipient_excluded",
              related_alert_id: openingId,
              metadata: {
                decision_id: decision.id,
                source: "opening_creation_review"
              }
            }))
          );

        if (excludedEventError) {
          console.warn("Smart SMS manual exclusion audit failed", {
            openingId,
            excludedCustomerCount: excludedDecisions?.length ?? 0,
            error: excludedEventError.message
          });
        }
      }
    }

    let smsResult = {
      sent: 0,
      failed: 0,
      failureMessage: null as string | null
    };

    if (!recipientPreparation.settings.alwaysReviewRecipientsBeforeSend) {
      smsResult = await sendOpeningSmsAlerts({
        supabase,
        organization,
        openingId
      });

      if (smsResult.sent === 0) {
        throw new Error(
          "Opening was created, but no SMS could be sent to selected recipients."
        );
      }

      if (smsResult.failureMessage) {
        redirectError = smsResult.failureMessage;
      }
    }

    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.opening.created",
      entityType: "openings",
      entityId: openingId,
      metadata: {
        service_id: input.value.serviceId,
        estimated_value_cents: input.value.estimatedValueCents,
        smart_sms_selected_count: recipientPreparation.selectedCount,
        smart_sms_eligible_count: recipientPreparation.eligibleCount,
        smart_sms_protected_count: recipientPreparation.protectedCount,
        smart_sms_blocked_count: recipientPreparation.blockedCount,
        smart_sms_review_required:
          recipientPreparation.settings.alwaysReviewRecipientsBeforeSend,
        sms_sent: smsResult.sent,
        sms_failed: smsResult.failed
      }
    });

    if (smsResult.sent > 0) {
      await recordManagerModeDashboardAction({
        action: "admin.manager_mode.sms_alert.sent",
        entityType: "openings",
        entityId: openingId,
        metadata: {
          sent_count: smsResult.sent,
          failed_count: smsResult.failed
        }
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cancellations");
    revalidatePath("/dashboard/responses");
  } catch (error) {
    if (createdOpeningId) {
      revalidatePath("/dashboard");
      revalidatePath("/dashboard/cancellations");
      revalidatePath(`/dashboard/cancellations/${createdOpeningId}`);
      redirectWithSendError(
        `/dashboard/cancellations/${createdOpeningId}`,
        error instanceof Error ? error.message : "Opening creation failed."
      );
    }

    redirectWithError(
      "/dashboard/new-cancellation",
      error instanceof Error ? error.message : "Opening creation failed."
    );
  }

  redirect(
    redirectError
      ? `/dashboard/cancellations/${createdOpeningId}?sendError=${encodeURIComponent(redirectError)}`
      : `/dashboard/cancellations/${createdOpeningId}`
  );
}

export async function updateSmartSmsSettingsAction(formData: FormData) {
  const organization = await requireReadyOrganization({
    canPerform: canManageOrganizationSettings
  });
  const supabase = await createSupabaseServerClient();

  try {
    const smartSmsPersistence = await checkSmartSmsPersistenceReadiness();

    if (!smartSmsPersistence.ready) {
      throw new Error(smartSmsPersistence.blockingReasons.join(" "));
    }

    const input = buildSmartSmsSettingsUpdateInput(formData);
    const { data: savedSettings, error } = await supabase
      .from("organization_settings")
      .upsert(
        {
          organization_id: organization.id,
          ...input
        },
        { onConflict: "organization_id" }
      )
      .select("organization_id")
      .single();

    if (error || !savedSettings) {
      throw new Error(
        error?.message ?? "Smart SMS settings were not persisted."
      );
    }

    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.smart_sms_settings.updated",
      entityType: "organization_settings",
      entityId: organization.id,
      metadata: {
        smart_sending_enabled: input.smart_sending_enabled,
        always_review_recipients_before_send:
          input.always_review_recipients_before_send
      }
    });
  } catch (error) {
    redirectWithError(
      "/dashboard/settings",
      error instanceof Error ? error.message : "Smart SMS settings update failed."
    );
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/new-cancellation");
  redirectWithNotice("/dashboard/settings", "Smart SMS settings saved.");
}

export async function updateOpeningRecipientDecisionAction(formData: FormData) {
  const openingId = String(formData.get("openingId") ?? "").trim();
  const decisionId = String(formData.get("decisionId") ?? "").trim();
  const rawOverride = String(formData.get("manualOverride") ?? "").trim();
  const manualOverride = isManualOverride(rawOverride) ? rawOverride : null;
  const protectedOverrideConfirmed =
    formData.get("protectedOverrideConfirmed") === "true";
  const overrideReason =
    String(formData.get("overrideReason") ?? "").trim().slice(0, 240) || null;

  if (!openingId || !decisionId || !manualOverride) {
    redirectWithSendError(
      `/dashboard/cancellations/${openingId}`,
      "Recipient decision and override are required."
    );
  }

  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();

  try {
    const smartSmsPersistence = await checkSmartSmsPersistenceReadiness();

    if (!smartSmsPersistence.ready) {
      throw new Error(smartSmsPersistence.blockingReasons.join(" "));
    }

    await prepareSmartRecipientDecisionsForOpening({
      supabase,
      organization,
      openingId
    });

    const { data: decisionRow, error: decisionError } = await supabase
      .from("alert_recipient_decisions")
      .select(
        "id, alert_id, organization_id, customer_id, base_decision, reason_codes, reason_label, sent_at, delivery_status, twilio_message_sid"
      )
      .eq("organization_id", organization.id)
      .eq("alert_id", openingId)
      .eq("id", decisionId)
      .maybeSingle();

    if (decisionError || !decisionRow) {
      throw new Error(decisionError?.message ?? "Recipient decision not found.");
    }

    if (
      decisionRow.sent_at ||
      (decisionRow.delivery_status &&
        recipientDecisionClaimedStatuses.includes(decisionRow.delivery_status))
    ) {
      throw new Error("Recipient decision was already sent or claimed.");
    }

    if (
      manualOverride === "include" &&
      decisionRow.base_decision === "locked_blocked"
    ) {
      throw new Error(
        "This recipient is blocked for consent or compliance and cannot be included."
      );
    }

    if (
      manualOverride === "include" &&
      decisionRow.base_decision === "protected" &&
      !protectedOverrideConfirmed
    ) {
      throw new Error("Protected recipient inclusion requires confirmation.");
    }

    const actorProfileId = await getCurrentOrganizationProfileId({
      supabase,
      organizationId: organization.id
    });
    const updatedDecision = applyManualRecipientOverride(
      buildBaseDecisionFromRow(decisionRow),
      manualOverride
    );

    const { error: updateError } = await supabase
      .from("alert_recipient_decisions")
      .update({
        final_decision: updatedDecision.finalDecision,
        decision_type: updatedDecision.decisionType,
        manual_override: manualOverride,
        reason_codes: updatedDecision.reasonCodes,
        reason_label: updatedDecision.reasonLabel,
        manually_overridden: updatedDecision.manuallyOverridden,
        warning_required: updatedDecision.warningRequired,
        override_reason: overrideReason,
        overridden_by: actorProfileId
      })
      .eq("organization_id", organization.id)
      .eq("id", decisionId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await syncOpeningOffersWithRecipientDecisions({
      supabase,
      organizationId: organization.id,
      openingId
    });

    if (
      manualOverride === "include" &&
      updatedDecision.finalDecision === "send"
    ) {
      await supabase.from("customer_activity_events").insert({
        organization_id: organization.id,
        customer_id: decisionRow.customer_id,
        event_type: "manual_recipient_included",
        related_alert_id: openingId,
        metadata: {
          decision_id: decisionId,
          override_reason: overrideReason,
          warning_required: updatedDecision.warningRequired
        }
      });
    } else if (manualOverride === "exclude") {
      await supabase.from("customer_activity_events").insert({
        organization_id: organization.id,
        customer_id: decisionRow.customer_id,
        event_type: "manual_recipient_excluded",
        related_alert_id: openingId,
        metadata: {
          decision_id: decisionId,
          override_reason: overrideReason
        }
      });
    }
  } catch (error) {
    redirectWithSendError(
      `/dashboard/cancellations/${openingId}`,
      error instanceof Error ? error.message : "Recipient update failed."
    );
  }

  revalidatePath(`/dashboard/cancellations/${openingId}`);
  revalidatePath("/dashboard/responses");
  redirect(`/dashboard/cancellations/${openingId}`);
}

export async function addManualRecipientToOpeningAction(formData: FormData) {
  const openingId = String(formData.get("openingId") ?? "").trim();
  const customerId = String(formData.get("customerId") ?? "").trim();
  const confirmProtectedRecipient =
    formData.get("confirmProtectedRecipient") === "true";

  if (!openingId || !customerId) {
    redirectWithSendError(
      `/dashboard/cancellations/${openingId}`,
      "Opening and client are required."
    );
  }

  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();

  try {
    const smartSmsPersistence = await checkSmartSmsPersistenceReadiness();

    if (!smartSmsPersistence.ready) {
      throw new Error(smartSmsPersistence.blockingReasons.join(" "));
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const [settings, openingResult, customerResult, existingDecisionResult] =
      await Promise.all([
        loadSmartSmsSettings({ supabase, organizationId: organization.id }),
        supabase
          .from("openings")
          .select("id, service_id")
          .eq("organization_id", organization.id)
          .eq("id", openingId)
          .maybeSingle(),
        supabase
          .from("customers")
          .select("id, phone_e164, deleted_at")
          .eq("organization_id", organization.id)
          .eq("id", customerId)
          .maybeSingle(),
        supabase
          .from("alert_recipient_decisions")
          .select("*")
          .eq("organization_id", organization.id)
          .eq("alert_id", openingId)
          .eq("customer_id", customerId)
          .maybeSingle()
      ]);

    if (openingResult.error || !openingResult.data) {
      throw new Error(openingResult.error?.message ?? "Opening not found.");
    }

    if (customerResult.error || !customerResult.data) {
      throw new Error(customerResult.error?.message ?? "Client not found.");
    }

    if (existingDecisionResult.error) {
      throw new Error(existingDecisionResult.error.message);
    }

    if (
      existingDecisionResult.data &&
      isRecipientDecisionClaimed(existingDecisionResult.data)
    ) {
      throw new Error("Recipient decision was already sent or claimed.");
    }

    const [
      consentResult,
      preferenceResult,
      activityEventsResult,
      appointmentsResult,
      smsMessagesResult,
      sameAlertMessagesResult,
      waitlistResult
    ] = await Promise.all([
      supabase
        .from("sms_consents")
        .select("customer_id, status, unsubscribed_at")
        .eq("organization_id", organization.id)
        .eq("customer_id", customerId)
        .maybeSingle(),
      supabase
        .from("customer_sms_preferences")
        .select("customer_id, manual_send_mode, manual_snooze_until")
        .eq("organization_id", organization.id)
        .eq("customer_id", customerId)
        .maybeSingle(),
      supabase
        .from("customer_activity_events")
        .select("customer_id, event_type, event_at")
        .eq("organization_id", organization.id)
        .eq("customer_id", customerId)
        .in("event_type", ["appointment_completed", "spot_filled"]),
      supabase
        .from("appointments")
        .select("customer_id, starts_at, status")
        .eq("organization_id", organization.id)
        .eq("customer_id", customerId),
      supabase
        .from("sms_messages")
        .select("customer_id, created_at")
        .eq("organization_id", organization.id)
        .eq("customer_id", customerId)
        .eq("direction", "outbound")
        .eq("message_type", "opening_alert")
        .in("status", smsSentStatuses)
        .gte("created_at", thirtyDaysAgo.toISOString()),
      supabase
        .from("sms_messages")
        .select("customer_id")
        .eq("organization_id", organization.id)
        .eq("customer_id", customerId)
        .eq("opening_id", openingId)
        .eq("direction", "outbound")
        .eq("message_type", "opening_alert")
        .in("status", smsSentStatuses),
      supabase
        .from("waitlist_entries")
        .select("id, customer_id, service_id, status")
        .eq("organization_id", organization.id)
        .eq("customer_id", customerId)
        .eq("status", "active")
    ]);

    for (const result of [
      consentResult,
      preferenceResult,
      activityEventsResult,
      appointmentsResult,
      smsMessagesResult,
      sameAlertMessagesResult,
      waitlistResult
    ]) {
      if (result.error) {
        throw new Error(result.error.message);
      }
    }

    const waitlistEntries = waitlistResult.data ?? [];
    const serviceInterestsResult =
      waitlistEntries.length > 0
        ? await supabase
            .from("waitlist_entry_services")
            .select("waitlist_entry_id, service_id")
            .eq("organization_id", organization.id)
            .in(
              "waitlist_entry_id",
              waitlistEntries.map((entry) => entry.id)
            )
        : { data: [], error: null };

    if (serviceInterestsResult.error) {
      throw new Error(serviceInterestsResult.error.message);
    }

    const serviceInterestsByEntry = new Map<string, string[]>();
    for (const interest of serviceInterestsResult.data ?? []) {
      serviceInterestsByEntry.set(interest.waitlist_entry_id, [
        ...(serviceInterestsByEntry.get(interest.waitlist_entry_id) ?? []),
        interest.service_id
      ]);
    }

    const serviceMatchScoreByCustomer =
      waitlistEntries.length > 0
        ? getCustomerServiceMatchScores({
            waitlistEntries,
            serviceInterestsByEntry,
            openingServiceId: openingResult.data.service_id
          })
        : new Map([[customerId, 0]]);
    const messages = smsMessagesResult.data ?? [];
    const lastSmsAt =
      messages.map((message) => message.created_at).sort().at(-1) ?? null;
    const baseDecision = evaluateSmsRecipientEligibility({
      customer: {
        customerId,
        smsConsentStatus: consentResult.data?.status ?? "missing",
        phoneE164: customerResult.data.phone_e164,
        phoneIsValid: /^\+[1-9][0-9]{7,14}$/.test(
          customerResult.data.phone_e164
        ),
        isArchived: Boolean(customerResult.data.deleted_at),
        alreadyReceivedAlert: (sameAlertMessagesResult.data ?? []).length > 0,
        deliveryQuarantined: false,
        optedOutAt: consentResult.data?.unsubscribed_at ?? null,
        manualSendMode: isManualSendMode(preferenceResult.data?.manual_send_mode)
          ? preferenceResult.data.manual_send_mode
          : "auto",
        manualSnoozeUntil: preferenceResult.data?.manual_snooze_until ?? null,
        lastCompletedAppointmentAt:
          getLatestEventAt(
            activityEventsResult.data ?? [],
            "appointment_completed"
          ) ?? getLatestCompletedAppointmentAt(appointmentsResult.data ?? []),
        lastFilledSpotAt: getLatestEventAt(
          activityEventsResult.data ?? [],
          "spot_filled"
        ),
        nextAppointmentAt: getNextFutureAppointmentAt(
          appointmentsResult.data ?? [],
          now
        ),
        smsSentLast24h: countMessagesSince(
          messages,
          new Date(now.getTime() - 24 * 60 * 60 * 1000)
        ),
        smsSentLast7d: countMessagesSince(
          messages,
          new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        ),
        smsSentLast30d: messages.length,
        serviceMatchScore: serviceMatchScoreByCustomer.get(customerId) ?? 0
      },
      settings,
      now,
      businessTimezone: organization.timezone
    });

    if (baseDecision.baseDecision === "locked_blocked") {
      throw new Error(baseDecision.reasonLabel);
    }

    if (baseDecision.baseDecision === "protected" && !confirmProtectedRecipient) {
      throw new Error("Protected recipient inclusion requires confirmation.");
    }

    const updatedDecision = applyManualRecipientOverride(baseDecision, "include");
    const recommendation = computeSmartRecipientRecommendationRank({
      baseDecision: updatedDecision.baseDecision,
      smsSentLast24h: countMessagesSince(
        messages,
        new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ),
      smsSentLast7d: countMessagesSince(
        messages,
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ),
      smsSentLast30d: messages.length,
      lastSmsAt,
      now
    });
    const actorProfileId = await getCurrentOrganizationProfileId({
      supabase,
      organizationId: organization.id
    });

    const { data: savedDecision, error: decisionError } = await supabase
      .from("alert_recipient_decisions")
      .upsert(
        toRecipientDecisionWrite({
          alertId: openingId,
          organizationId: organization.id,
          customerId,
          decision: updatedDecision,
          manualOverride: "include",
          overrideReason: "Manual include specific client from Smart SMS review",
          overriddenBy: actorProfileId,
          recommendationRank: recommendation.rank,
          recommendationBucket: recommendation.bucket
        }),
        { onConflict: "alert_id,customer_id" }
      )
      .select("id")
      .single();

    if (decisionError || !savedDecision) {
      throw new Error(decisionError?.message ?? "Recipient decision not saved.");
    }

    await syncOpeningOffersWithRecipientDecisions({
      supabase,
      organizationId: organization.id,
      openingId
    });

    await supabase.from("customer_activity_events").insert({
      organization_id: organization.id,
      customer_id: customerId,
      event_type: "manual_recipient_included",
      related_alert_id: openingId,
      metadata: {
        decision_id: savedDecision.id,
        source: "specific_client_review",
        warning_required: updatedDecision.warningRequired
      }
    });
  } catch (error) {
    redirectWithSendError(
      `/dashboard/cancellations/${openingId}`,
      error instanceof Error ? error.message : "Recipient add failed."
    );
  }

  revalidatePath(`/dashboard/cancellations/${openingId}`);
  revalidatePath("/dashboard/responses");
  redirect(`/dashboard/cancellations/${openingId}`);
}

export async function sendOpeningAlertsAction(formData: FormData) {
  const openingId = String(formData.get("openingId") ?? "");
  const confirmProtectedRecipients =
    formData.get("confirmProtectedRecipients") === "true";
  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();
  try {
    const smartSmsPersistence = await checkSmartSmsPersistenceReadiness();

    if (!smartSmsPersistence.ready) {
      throw new Error(smartSmsPersistence.blockingReasons.join(" "));
    }

    const result = await sendOpeningSmsAlerts({
      supabase,
      organization,
      openingId,
      confirmProtectedRecipients
    });

    if (result.sent === 0) {
      throw new Error("No opted-in pending offers are available to send.");
    }

    if (result.failureMessage) {
      redirectWithSendError(
        `/dashboard/cancellations/${openingId}`,
        result.failureMessage
      );
    }

    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.sms_alert.sent",
      entityType: "openings",
      entityId: openingId,
      metadata: {
        sent_count: result.sent,
        failed_count: result.failed
      }
    });
  } catch (error) {
    redirectWithSendError(
      `/dashboard/cancellations/${openingId}`,
      error instanceof Error ? error.message : "Opening SMS send failed."
    );
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/cancellations/${openingId}`);
  revalidatePath("/dashboard/responses");
  redirect(`/dashboard/cancellations/${openingId}`);
}

export async function validateOpeningOfferAction(formData: FormData) {
  const openingId = String(formData.get("openingId") ?? "");
  const offerId = String(formData.get("offerId") ?? "");
  const recoveredValueCents = Number(formData.get("recoveredValueCents") ?? 0);
  const commissionCents = calculateCommissionEstimate({ recoveredValueCents });

  if (!openingId || !offerId || !Number.isFinite(recoveredValueCents)) {
    redirectWithValidationError(
      `/dashboard/cancellations/${openingId}`,
      "Opening, offer, and recovered value are required."
    );
  }

  const organization = await requireReadyOrganization({
    canPerform: canValidateBookings
  });
  const supabase = await createSupabaseServerClient();
  const { data: offer, error: offerLookupError } = await supabase
    .from("opening_offers")
    .select("id, customer_id, status")
    .eq("organization_id", organization.id)
    .eq("opening_id", openingId)
    .eq("id", offerId)
    .maybeSingle();

  if (offerLookupError || !offer) {
    redirectWithValidationError(
      `/dashboard/cancellations/${openingId}`,
      offerLookupError?.message ?? "Opening offer not found."
    );
  }

  if (offer.status !== "responded") {
    redirectWithValidationError(
      `/dashboard/cancellations/${openingId}`,
      "Only responded offers can be validated."
    );
  }

  const { data: customer, error: customerLookupError } = await supabase
    .from("customers")
    .select("id, deleted_at")
    .eq("organization_id", organization.id)
    .eq("id", offer.customer_id)
    .maybeSingle();

  if (customerLookupError) {
    redirectWithValidationError(
      `/dashboard/cancellations/${openingId}`,
      genericClientSaveError
    );
  }

  if (customer?.deleted_at) {
    redirectWithValidationError(
      `/dashboard/cancellations/${openingId}`,
      "This client was deleted and cannot be selected for a recovered spot."
    );
  }

  const { data: bookingRequestId, error } = await supabase.rpc("validate_opening_offer", {
    target_opening_id: openingId,
    target_offer_id: offerId,
    recovered_value_cents: recoveredValueCents,
    commission_cents: commissionCents
  });

  if (error) {
    redirectWithValidationError(`/dashboard/cancellations/${openingId}`, error.message);
  }

  if (!bookingRequestId) {
    redirectWithValidationError(
      `/dashboard/cancellations/${openingId}`,
      "Opening validation did not return a booking request."
    );
  }

  const { error: spotFilledEventError } = await supabase
    .from("customer_activity_events")
    .insert({
      organization_id: organization.id,
      customer_id: offer.customer_id,
      event_type: "spot_filled",
      related_alert_id: openingId,
      metadata: {
        offer_id: offerId,
        booking_request_id: bookingRequestId,
        recovered_value_cents: recoveredValueCents
      }
    });

  if (spotFilledEventError) {
    console.warn("Smart SMS spot_filled event failed", {
      openingId,
      offerId,
      customerId: offer.customer_id,
      error: spotFilledEventError.message
    });
  }

  const confirmationSmsWarning =
    await sendOpeningConfirmationSmsAfterValidation({
      supabase,
      organization,
      openingId,
      offerId,
      bookingRequestId
    });

  try {
    await recordManagerModeDashboardAction({
      action: "admin.manager_mode.opening_offer.validated",
      entityType: "opening_offers",
      entityId: offerId,
      metadata: {
        opening_id: openingId,
        recovered_value_cents: recoveredValueCents,
        commission_cents: commissionCents
      }
    });
  } catch (managerModeAuditError) {
    console.warn("Manager mode validation audit failed", {
      openingId,
      offerId,
      error:
        managerModeAuditError instanceof Error
          ? managerModeAuditError.message
          : "Unknown manager mode audit error"
    });
  }

  revalidateManualValidationSurfaces({
    openingId,
    organizationId: organization.id
  });
  redirectWithNoticeAndConfirmationSmsWarning({
    path: `/dashboard/cancellations/${openingId}`,
    notice: confirmationSmsWarning
      ? "Client confirmé."
      : "Client confirmé. SMS de confirmation envoyé.",
    confirmationSmsWarning
  });
}
