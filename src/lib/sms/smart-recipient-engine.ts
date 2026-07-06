export type BaseDecision = "eligible" | "protected" | "locked_blocked";

export type FinalDecision = "send" | "do_not_send" | "locked_blocked";

export type DecisionType =
  | "auto"
  | "manual_include"
  | "manual_exclude"
  | "manual_locked";

export type ManualOverride = "auto" | "include" | "exclude";

export type ManualSendMode =
  | "auto"
  | "prefer_include"
  | "prefer_exclude"
  | "never_send_last_minute";

export type SmsConsentLikeStatus =
  | "active"
  | "opted_in"
  | "needs_consent"
  | "missing"
  | "opted_out";

export type ReasonCode =
  | "eligible"
  | "blocked_opted_out"
  | "blocked_no_consent"
  | "blocked_invalid_phone"
  | "blocked_duplicate_alert"
  | "blocked_archived_customer"
  | "blocked_delivery_quarantine"
  | "protected_recent_completed_appointment"
  | "protected_recent_filled_spot"
  | "protected_frequency_cap_24h"
  | "protected_frequency_cap_7d"
  | "protected_frequency_cap_30d"
  | "protected_future_appointment"
  | "protected_manual_snooze"
  | "protected_manual_prefer_exclude"
  | "protected_low_service_match"
  | "manual_include"
  | "manual_exclude"
  | "manual_never_send_last_minute"
  | "outside_allowed_sending_hours";

export type SmsRecipientDecision = {
  baseDecision: BaseDecision;
  finalDecision: FinalDecision;
  decisionType: DecisionType;
  reasonCodes: ReasonCode[];
  reasonLabel: string;
  canSend: boolean;
  manuallyOverridden: boolean;
  warningRequired: boolean;
};

export type SmartSmsSettings = {
  smartSendingEnabled?: boolean;
  cooldownAfterCompletedAppointmentDays?: number;
  cooldownAfterFilledSpotDays?: number;
  maxSmsPerDay?: number;
  maxSmsPer7Days?: number;
  maxSmsPer30Days?: number;
  blockIfFutureAppointmentExists?: boolean;
  futureAppointmentWindowDays?: number;
  allowedSendStartTime?: string;
  allowedSendEndTime?: string;
  alwaysReviewRecipientsBeforeSend?: boolean;
};

export type SmsRecipientCustomerSignals = {
  customerId: string;
  smsConsentStatus: SmsConsentLikeStatus;
  phoneE164: string;
  phoneIsValid?: boolean;
  isArchived?: boolean;
  alreadyReceivedAlert?: boolean;
  deliveryQuarantined?: boolean;
  optedOutAt?: string | null;
  manualSendMode?: ManualSendMode | null;
  manualSnoozeUntil?: string | null;
  lastCompletedAppointmentAt?: string | null;
  lastFilledSpotAt?: string | null;
  nextAppointmentAt?: string | null;
  smsSentLast24h?: number | null;
  smsSentLast7d?: number | null;
  smsSentLast30d?: number | null;
  serviceMatchScore?: number | null;
};

export type SmsRecipientEligibilityInput = {
  customer: SmsRecipientCustomerSignals;
  settings?: SmartSmsSettings | null;
  now?: Date;
  businessTimezone?: string | null;
};

const e164Pattern = /^\+[1-9][0-9]{7,14}$/;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export const defaultSmartSmsSettings = {
  smartSendingEnabled: true,
  cooldownAfterCompletedAppointmentDays: 7,
  cooldownAfterFilledSpotDays: 14,
  maxSmsPerDay: 1,
  maxSmsPer7Days: 2,
  maxSmsPer30Days: 5,
  blockIfFutureAppointmentExists: true,
  futureAppointmentWindowDays: 14,
  allowedSendStartTime: "08:00",
  allowedSendEndTime: "20:00",
  alwaysReviewRecipientsBeforeSend: true
} satisfies Required<SmartSmsSettings>;

const reasonLabels: Record<ReasonCode, string> = {
  eligible: "Client eligible.",
  blocked_opted_out: "Impossible d'envoyer : ce client est desinscrit.",
  blocked_no_consent: "Impossible d'envoyer : consentement SMS manquant.",
  blocked_invalid_phone: "Impossible d'envoyer : numero invalide.",
  blocked_duplicate_alert:
    "Impossible d'envoyer : client deja contacte pour cette alerte.",
  blocked_archived_customer: "Impossible d'envoyer : client archive.",
  blocked_delivery_quarantine:
    "Impossible d'envoyer : numero en quarantaine de livraison.",
  protected_recent_completed_appointment:
    "Protege par le Mode intelligent : rendez-vous recent.",
  protected_recent_filled_spot:
    "Protege par le Mode intelligent : place derniere minute remplie recemment.",
  protected_frequency_cap_24h:
    "Protege par le Mode intelligent : limite quotidienne de SMS atteinte.",
  protected_frequency_cap_7d:
    "Protege par le Mode intelligent : limite hebdomadaire de SMS atteinte.",
  protected_frequency_cap_30d:
    "Protege par le Mode intelligent : limite mensuelle de SMS atteinte.",
  protected_future_appointment:
    "Protege par le Mode intelligent : rendez-vous futur proche.",
  protected_manual_snooze:
    "Protege par le Mode intelligent : client en pause temporaire.",
  protected_manual_prefer_exclude:
    "Protege par le Mode intelligent : preference manuelle d'exclusion.",
  protected_low_service_match:
    "Protege par le Mode intelligent : pertinence service faible.",
  manual_include: "Client inclus manuellement.",
  manual_exclude: "Client exclu de cet envoi.",
  manual_never_send_last_minute:
    "Envoi impossible : ce client est exclu des alertes dernière minute. Modifiez sa préférence client pour le réactiver.",
  outside_allowed_sending_hours:
    "Protege par le Mode intelligent : hors heures d'envoi autorisees."
};

function normalizeSettings(settings?: SmartSmsSettings | null) {
  return {
    ...defaultSmartSmsSettings,
    ...settings
  };
}

function isActiveConsent(status: SmsConsentLikeStatus) {
  return status === "active" || status === "opted_in";
}

function parseOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasRecentPastEvent({
  eventAt,
  cooldownDays,
  now
}: {
  eventAt: string | null | undefined;
  cooldownDays: number;
  now: Date;
}) {
  const eventDate = parseOptionalDate(eventAt);

  if (!eventDate || cooldownDays <= 0 || eventDate > now) {
    return false;
  }

  return now.getTime() - eventDate.getTime() < cooldownDays * millisecondsPerDay;
}

function hasFutureAppointmentInsideWindow({
  nextAppointmentAt,
  windowDays,
  now
}: {
  nextAppointmentAt: string | null | undefined;
  windowDays: number;
  now: Date;
}) {
  const nextAppointment = parseOptionalDate(nextAppointmentAt);

  if (!nextAppointment || windowDays <= 0 || nextAppointment <= now) {
    return false;
  }

  return nextAppointment.getTime() - now.getTime() <= windowDays * millisecondsPerDay;
}

function parseTimeToMinutes(value: string | null | undefined) {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? "").trim());

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function getMinutesInTimezone(date: Date, timezone: string) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone
    }).formatToParts(date);
    const hour = Number(parts.find((part) => part.type === "hour")?.value);
    const minute = Number(parts.find((part) => part.type === "minute")?.value);

    return Number.isFinite(hour) && Number.isFinite(minute)
      ? hour * 60 + minute
      : null;
  } catch {
    return null;
  }
}

function isInsideSendingWindow({
  now,
  timezone,
  startTime,
  endTime
}: {
  now: Date;
  timezone: string;
  startTime: string;
  endTime: string;
}) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const current = getMinutesInTimezone(now, timezone);

  if (start === null || end === null || current === null || start === end) {
    return true;
  }

  if (start < end) {
    return current >= start && current <= end;
  }

  return current >= start || current <= end;
}

function makeDecision({
  baseDecision,
  finalDecision,
  decisionType,
  reasonCodes,
  manuallyOverridden = false,
  warningRequired = false
}: {
  baseDecision: BaseDecision;
  finalDecision: FinalDecision;
  decisionType: DecisionType;
  reasonCodes: ReasonCode[];
  manuallyOverridden?: boolean;
  warningRequired?: boolean;
}): SmsRecipientDecision {
  return {
    baseDecision,
    finalDecision,
    decisionType,
    reasonCodes,
    reasonLabel: reasonLabels[reasonCodes[0] ?? "eligible"],
    canSend: finalDecision === "send",
    manuallyOverridden,
    warningRequired
  };
}

function lockedBlock(reasonCode: ReasonCode): SmsRecipientDecision {
  return makeDecision({
    baseDecision: "locked_blocked",
    finalDecision: "locked_blocked",
    decisionType: "auto",
    reasonCodes: [reasonCode]
  });
}

function protectedDecision(reasonCode: ReasonCode): SmsRecipientDecision {
  return makeDecision({
    baseDecision: "protected",
    finalDecision: "do_not_send",
    decisionType: "auto",
    reasonCodes: [reasonCode]
  });
}

export function evaluateSmsRecipientEligibility({
  customer,
  settings,
  now = new Date(),
  businessTimezone
}: SmsRecipientEligibilityInput): SmsRecipientDecision {
  const resolvedSettings = normalizeSettings(settings);
  const timezone = businessTimezone?.trim() || "America/Toronto";
  const phoneIsValid =
    customer.phoneIsValid ?? e164Pattern.test(customer.phoneE164);

  if (customer.optedOutAt || customer.smsConsentStatus === "opted_out") {
    return lockedBlock("blocked_opted_out");
  }

  if (!isActiveConsent(customer.smsConsentStatus)) {
    return lockedBlock("blocked_no_consent");
  }

  if (!phoneIsValid) {
    return lockedBlock("blocked_invalid_phone");
  }

  if (customer.isArchived) {
    return lockedBlock("blocked_archived_customer");
  }

  if (customer.alreadyReceivedAlert) {
    return lockedBlock("blocked_duplicate_alert");
  }

  if (customer.deliveryQuarantined) {
    return lockedBlock("blocked_delivery_quarantine");
  }

  if (customer.manualSendMode === "never_send_last_minute") {
    return lockedBlock("manual_never_send_last_minute");
  }

  if (customer.manualSendMode === "prefer_exclude") {
    return protectedDecision("protected_manual_prefer_exclude");
  }

  const snoozeUntil = parseOptionalDate(customer.manualSnoozeUntil);

  if (snoozeUntil && snoozeUntil > now) {
    return protectedDecision("protected_manual_snooze");
  }

  if (resolvedSettings.smartSendingEnabled) {
    if (
      !isInsideSendingWindow({
        now,
        timezone,
        startTime: resolvedSettings.allowedSendStartTime,
        endTime: resolvedSettings.allowedSendEndTime
      })
    ) {
      return protectedDecision("outside_allowed_sending_hours");
    }

    if (
      hasRecentPastEvent({
        eventAt: customer.lastCompletedAppointmentAt,
        cooldownDays: resolvedSettings.cooldownAfterCompletedAppointmentDays,
        now
      })
    ) {
      return protectedDecision("protected_recent_completed_appointment");
    }

    if (
      hasRecentPastEvent({
        eventAt: customer.lastFilledSpotAt,
        cooldownDays: resolvedSettings.cooldownAfterFilledSpotDays,
        now
      })
    ) {
      return protectedDecision("protected_recent_filled_spot");
    }

    if ((customer.smsSentLast24h ?? 0) >= resolvedSettings.maxSmsPerDay) {
      return protectedDecision("protected_frequency_cap_24h");
    }

    if ((customer.smsSentLast7d ?? 0) >= resolvedSettings.maxSmsPer7Days) {
      return protectedDecision("protected_frequency_cap_7d");
    }

    if ((customer.smsSentLast30d ?? 0) >= resolvedSettings.maxSmsPer30Days) {
      return protectedDecision("protected_frequency_cap_30d");
    }

    if (
      resolvedSettings.blockIfFutureAppointmentExists &&
      hasFutureAppointmentInsideWindow({
        nextAppointmentAt: customer.nextAppointmentAt,
        windowDays: resolvedSettings.futureAppointmentWindowDays,
        now
      })
    ) {
      return protectedDecision("protected_future_appointment");
    }
  }

  return makeDecision({
    baseDecision: "eligible",
    finalDecision: "send",
    decisionType: "auto",
    reasonCodes: ["eligible"]
  });
}

export function applyManualRecipientOverride(
  baseDecision: SmsRecipientDecision,
  manualOverride: ManualOverride
): SmsRecipientDecision {
  if (manualOverride === "auto") {
    return baseDecision;
  }

  if (baseDecision.baseDecision === "locked_blocked") {
    return {
      ...baseDecision,
      finalDecision: "locked_blocked",
      decisionType: "manual_locked",
      canSend: false,
      manuallyOverridden: false,
      warningRequired: false
    };
  }

  if (manualOverride === "exclude") {
    return makeDecision({
      ...baseDecision,
      finalDecision: "do_not_send",
      decisionType: "manual_exclude",
      reasonCodes: addReason(baseDecision.reasonCodes, "manual_exclude"),
      manuallyOverridden: true,
      warningRequired: false
    });
  }

  return makeDecision({
    ...baseDecision,
    finalDecision: "send",
    decisionType: "manual_include",
    reasonCodes: addReason(baseDecision.reasonCodes, "manual_include"),
    manuallyOverridden: true,
    warningRequired: baseDecision.baseDecision === "protected"
  });
}

function addReason(reasonCodes: ReasonCode[], reasonCode: ReasonCode) {
  return reasonCodes.includes(reasonCode)
    ? reasonCodes
    : [...reasonCodes, reasonCode];
}
