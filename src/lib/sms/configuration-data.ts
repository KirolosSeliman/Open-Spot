import "server-only";

import {
  hasMissingStatusCallback,
  isDeliveredSmsStatus,
  isFailedSmsStatus
} from "@/lib/sms/status-helpers";
import type { OrganizationSmsReadiness } from "@/lib/sms/organization-gate";
import { canBillingStatusSendSms } from "@/lib/billing/manual-billing";
import type { SafeOrganizationSmsSenderView } from "@/lib/sms/organization-sender-types";
import type { SmsSenderReadinessResult } from "@/lib/sms/sms-setup-readiness";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const STOP_KEYWORDS = new Set(["STOP", "ARRET", "UNSUBSCRIBE", "CANCEL", "END"]);

export type SmsActivityMetrics = {
  outboundCount: number;
  outboundPreviousCount: number;
  outboundChangePercent: number | null;
  deliveryRate: number | null;
  deliveryRatePrevious: number | null;
  deliveryRateChangePoints: number | null;
  stopReplyCount: number;
  stopReplyPreviousCount: number;
  stopReplyChange: number | null;
  lastSyncAt: string | null;
  isSynced: boolean;
};

export type SmsTestDeliveryStep = {
  key: string;
  label: string;
  description: string;
  status: "success" | "failure" | "pending" | "missing";
  at: string | null;
};

export type SmsActivationPrerequisite = {
  key: string;
  label: string;
  description: string;
  status: "validated" | "pending" | "missing";
};

export type SmsRecentEventItem = {
  id: string;
  label: string;
  detail: string;
  at: string;
};

export type SmsRecentEvents = {
  deliveryFailures: SmsRecentEventItem[];
  stopReplies: SmsRecentEventItem[];
  missingCallbacks: SmsRecentEventItem[];
};

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

function endOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

function buildRange(days: number, end: Date) {
  const to = endOfUtcDay(end);
  const from = startOfUtcDay(end);
  from.setUTCDate(from.getUTCDate() - days + 1);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
}

function buildPreviousRange(days: number, end: Date) {
  const currentFrom = startOfUtcDay(end);
  currentFrom.setUTCDate(currentFrom.getUTCDate() - days + 1);
  const previousEnd = new Date(currentFrom.getTime() - 1);
  const previousFrom = startOfUtcDay(previousEnd);
  previousFrom.setUTCDate(previousFrom.getUTCDate() - days + 1);
  return {
    fromIso: previousFrom.toISOString(),
    toIso: endOfUtcDay(previousEnd).toISOString()
  };
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return ((current - previous) / previous) * 100;
}

function computeDeliveryRate(rows: { status: string; direction: string }[]) {
  const outbound = rows.filter((row) => row.direction === "outbound");
  const finalized = outbound.filter(
    (row) =>
      isDeliveredSmsStatus(row.status) || isFailedSmsStatus(row.status)
  );

  if (finalized.length === 0) {
    return null;
  }

  const delivered = finalized.filter((row) => isDeliveredSmsStatus(row.status)).length;
  return (delivered / finalized.length) * 100;
}

function isStopInbound(body: string | null | undefined) {
  const normalized = String(body ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "");

  return STOP_KEYWORDS.has(normalized);
}

export function deriveSmsTestDeliveryResults(
  sender: SafeOrganizationSmsSenderView | null
): SmsTestDeliveryStep[] {
  const sentAt = sender?.lastTestSmsSentAt ?? null;
  const deliveredAt = sender?.lastStatusCallbackAt ?? null;
  const stopAt = sender?.lastInboundTestAt ?? null;
  const callbackAt = sender?.lastStatusCallbackAt ?? null;

  const sentStatus = sentAt ? "success" : "missing";
  const deliveredStatus =
    sentAt && deliveredAt ? "success" : sentAt ? "pending" : "missing";
  const stopStatus =
    stopAt ? "success" : sentAt ? "pending" : "missing";
  const callbackStatus =
    callbackAt ? "success" : sentAt ? "pending" : "missing";

  return [
    {
      key: "sent",
      label: "Message envoyé",
      description: "Le message a été accepté par Twilio.",
      status: sentStatus,
      at: sentAt
    },
    {
      key: "delivered",
      label: "Livraison reçue",
      description: "Le message a été livré au destinataire.",
      status: deliveredStatus,
      at: deliveredAt
    },
    {
      key: "stop",
      label: "Réponse STOP reçue",
      description: "Le mot-clé STOP a été reçu avec succès.",
      status: stopStatus,
      at: stopAt
    },
    {
      key: "callback",
      label: "Callback validé",
      description: "Le callback de statut a été reçu et traité.",
      status: callbackStatus,
      at: callbackAt
    }
  ];
}

export function deriveSmsActivationPrerequisites({
  sender,
  readiness,
  organizationReadiness
}: {
  sender: SafeOrganizationSmsSenderView | null;
  readiness: SmsSenderReadinessResult;
  organizationReadiness: OrganizationSmsReadiness;
}): SmsActivationPrerequisite[] {
  const stopHelpCheck = readiness.checks.find((check) => check.key === "stop_help");
  const testCheck = readiness.checks.find((check) => check.key === "test_message");

  const billingAllowed = canBillingStatusSendSms(organizationReadiness.billingStatus);

  const smsActive =
    sender?.senderStatus === "ready" && organizationReadiness.smsStatus === "active";

  return [
    {
      key: "stop_help",
      label: "Gestion STOP/AIDE",
      description: "Mots-clés configurés",
      status:
        stopHelpCheck?.status === "active"
          ? "validated"
          : stopHelpCheck?.status === "pending"
            ? "pending"
            : "missing"
    },
    {
      key: "test_message",
      label: "Message test validé",
      description: "Test SMS envoyé et réussi",
      status:
        testCheck?.status === "active"
          ? "validated"
          : testCheck?.status === "pending"
            ? "pending"
            : "missing"
    },
    {
      key: "compliance",
      label: "Conformité SMS approuvée",
      description: "Consentement et politique validés",
      status:
        sender?.complianceStatus === "approved" ||
        sender?.complianceStatus === "not_required"
          ? "validated"
          : sender?.complianceStatus === "in_review" ||
              sender?.complianceStatus === "submitted"
            ? "pending"
            : "missing"
    },
    {
      key: "billing",
      label: "Facturation autorisée",
      description: "Statut paid, trial ou comped",
      status: billingAllowed ? "validated" : "pending"
    },
    {
      key: "sms_active",
      label: "Statut SMS actif",
      description: "Prêt à envoyer en production",
      status: smsActive ? "validated" : "pending"
    }
  ];
}

export async function loadSmsActivityMetrics(
  organizationId: string,
  sender: SafeOrganizationSmsSenderView | null,
  days = 7
): Promise<SmsActivityMetrics> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const now = new Date();
  const currentRange = buildRange(days, now);
  const previousRange = buildPreviousRange(days, now);

  const [currentResult, previousResult] = await Promise.all([
    supabase
      .from("sms_messages")
      .select("direction, status, body, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", currentRange.fromIso)
      .lte("created_at", currentRange.toIso),
    supabase
      .from("sms_messages")
      .select("direction, status, body, created_at")
      .eq("organization_id", organizationId)
      .gte("created_at", previousRange.fromIso)
      .lte("created_at", previousRange.toIso)
  ]);

  if (currentResult.error) {
    throw new Error(currentResult.error.message);
  }

  if (previousResult.error) {
    throw new Error(previousResult.error.message);
  }

  const currentRows = currentResult.data ?? [];
  const previousRows = previousResult.data ?? [];

  const outboundCount = currentRows.filter((row) => row.direction === "outbound").length;
  const outboundPreviousCount = previousRows.filter(
    (row) => row.direction === "outbound"
  ).length;

  const stopReplyCount = currentRows.filter(
    (row) => row.direction === "inbound" && isStopInbound(row.body)
  ).length;
  const stopReplyPreviousCount = previousRows.filter(
    (row) => row.direction === "inbound" && isStopInbound(row.body)
  ).length;

  const deliveryRate = computeDeliveryRate(currentRows);
  const deliveryRatePrevious = computeDeliveryRate(previousRows);

  const lastSyncAt =
    sender?.lastStatusCallbackAt ??
    sender?.lastSyncedAt ??
    null;

  return {
    outboundCount,
    outboundPreviousCount,
    outboundChangePercent: percentChange(outboundCount, outboundPreviousCount),
    deliveryRate,
    deliveryRatePrevious,
    deliveryRateChangePoints:
      deliveryRate !== null && deliveryRatePrevious !== null
        ? deliveryRate - deliveryRatePrevious
        : null,
    stopReplyCount,
    stopReplyPreviousCount,
    stopReplyChange: stopReplyCount - stopReplyPreviousCount,
    lastSyncAt,
    isSynced: Boolean(lastSyncAt)
  };
}

export async function loadSmsRecentEvents(
  organizationId: string,
  limit = 5
): Promise<SmsRecentEvents> {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  const { data, error } = await supabase
    .from("sms_messages")
    .select(
      "id, direction, status, body, error_code, error_message, status_callback_received_at, created_at, customer_id, from_number, to_number"
    )
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];
  const customerIds = [
    ...new Set(rows.map((row) => row.customer_id).filter((id): id is string => Boolean(id)))
  ];

  const customersResult = customerIds.length
    ? await supabase.from("customers").select("id, full_name").in("id", customerIds)
    : { data: [], error: null };

  if (customersResult.error) {
    throw new Error(customersResult.error.message);
  }

  const customerById = new Map(
    (customersResult.data ?? []).map((row) => [row.id, row.full_name])
  );

  const deliveryFailures: SmsRecentEventItem[] = [];
  const stopReplies: SmsRecentEventItem[] = [];
  const missingCallbacks: SmsRecentEventItem[] = [];

  for (const row of rows) {
    if (deliveryFailures.length < limit && isFailedSmsStatus(row.status)) {
      deliveryFailures.push({
        id: row.id,
        label: row.direction === "outbound" ? row.to_number : row.from_number,
        detail: row.error_message ?? row.error_code ?? "Échec de livraison",
        at: row.created_at
      });
    }

    if (
      stopReplies.length < limit &&
      row.direction === "inbound" &&
      isStopInbound(row.body)
    ) {
      const name = row.customer_id
        ? customerById.get(row.customer_id) ?? "Client"
        : "Client";

      stopReplies.push({
        id: row.id,
        label: name,
        detail: row.from_number,
        at: row.created_at
      });
    }

    if (
      missingCallbacks.length < limit &&
      hasMissingStatusCallback({
        provider: "twilio",
        direction: row.direction,
        status: row.status,
        statusCallbackReceivedAt: row.status_callback_received_at,
        createdAt: row.created_at
      })
    ) {
      missingCallbacks.push({
        id: row.id,
        label: row.customer_id
          ? customerById.get(row.customer_id) ?? row.to_number
          : row.to_number,
        detail: "Aucun callback enregistré",
        at: row.created_at
      });
    }
  }

  return { deliveryFailures, stopReplies, missingCallbacks };
}
