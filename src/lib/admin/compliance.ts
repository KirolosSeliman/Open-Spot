import type { AuthorizedPlatformAdmin } from "@/lib/auth/platform-admin";
import { assertAdminCanAccessOrganization, getAdminVisibleOrganizationIds } from "@/lib/admin/access";
import { recordPlatformAdminAuditLog } from "@/lib/admin/audit";
import { parseAdminDateRange } from "@/lib/admin/date-range";
import { maskPhoneNumber } from "@/lib/admin/metrics";
import { adminSearchMatches } from "@/lib/admin/search";
import {
  hasMissingStatusCallback,
  isFailedSmsStatus
} from "@/lib/sms/status-helpers";
import { createSupabaseServiceClient } from "@/lib/supabase/service";
import type { Database } from "@/types/database";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

type ComplianceReviewStatus =
  Database["public"]["Tables"]["platform_compliance_reviews"]["Row"]["status"];
type ComplianceReviewSeverity =
  Database["public"]["Tables"]["platform_compliance_reviews"]["Row"]["severity"];

export type ComplianceIssue = {
  key: string;
  type: string;
  severity: ComplianceReviewSeverity;
  status: ComplianceReviewStatus;
  title: string;
  description: string;
  organizationId: string | null;
  organizationName: string;
  evidence: string;
  reviewId: string | null;
  note: string | null;
};

export type ComplianceFilters = {
  organizationId: string;
  q: string;
  status: string;
  severity: string;
  range: ReturnType<typeof parseAdminDateRange>;
};

export function calculateFailureRate({
  failed,
  outbound
}: {
  failed: number;
  outbound: number;
}) {
  return outbound <= 0 ? 0 : failed / outbound;
}

export function isHighFailureRate({
  failed,
  outbound,
  threshold = 0.2
}: {
  failed: number;
  outbound: number;
  threshold?: number;
}) {
  return outbound >= 5 && calculateFailureRate({ failed, outbound }) >= threshold;
}

export function normalizeComplianceFilters(
  searchParams: Record<string, string | string[] | undefined>
): ComplianceFilters {
  return {
    organizationId: one(searchParams.organizationId) ?? "all",
    q: String(one(searchParams.q) ?? "").trim().slice(0, 80),
    status: one(searchParams.status) ?? "all",
    severity: one(searchParams.severity) ?? "all",
    range: parseAdminDateRange({
      range: one(searchParams.range),
      from: one(searchParams.from),
      to: one(searchParams.to)
    })
  };
}

function reviewStatusForIssue(
  reviews: Array<
    Pick<
      Database["public"]["Tables"]["platform_compliance_reviews"]["Row"],
      "id" | "issue_key" | "status" | "note"
    >
  >,
  issueKey: string
) {
  const review = reviews.find((row) => row.issue_key === issueKey);

  return {
    status: review?.status ?? "open",
    reviewId: review?.id ?? null,
    note: review?.note ?? null
  };
}

export async function loadAdminCompliance({
  admin,
  searchParams = {},
  organizationId,
  auditAction = "admin.compliance.viewed"
}: {
  admin: AuthorizedPlatformAdmin;
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId?: string;
  auditAction?: string;
}) {
  const filters = normalizeComplianceFilters({
    ...searchParams,
    ...(organizationId ? { organizationId } : {})
  });
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Admin service client is not configured.");
  }

  if (organizationId) {
    await assertAdminCanAccessOrganization({ admin, organizationId });
  }

  const accessibleOrganizationIds = organizationId
    ? [organizationId]
    : await getAdminVisibleOrganizationIds(admin);
  const visibleOrganizationIds =
    !organizationId && filters.organizationId !== "all"
      ? accessibleOrganizationIds.filter((id) => id === filters.organizationId)
      : accessibleOrganizationIds;

  if (visibleOrganizationIds.length === 0) {
    return {
      filters,
      metrics: {
        optedOutCustomers: 0,
        recentOptOuts: 0,
        potentialRiskySends: 0,
        missingConsentRecords: 0,
        unlinkedInboundReplies: 0,
        unknownReplies: 0,
        failedSmsRate: 0,
        missingStatusCallbacks: 0,
        organizationsWithSmsPaused: 0,
        organizationsDisabled: 0
      },
      issues: [] as ComplianceIssue[],
      recentOptOuts: []
    };
  }

  const [
    organizationsResult,
    customersResult,
    consentsResult,
    smsResult,
    webhookResult,
    controlsResult,
    reviewsResult
  ] = await Promise.all([
    supabase.from("organizations").select("id, name").in("id", visibleOrganizationIds),
    supabase
      .from("customers")
      .select("id, organization_id, full_name, phone_e164, created_at")
      .in("organization_id", visibleOrganizationIds),
    supabase
      .from("sms_consents")
      .select("organization_id, customer_id, phone_e164, status, unsubscribed_at, created_at")
      .in("organization_id", visibleOrganizationIds),
    supabase
      .from("sms_messages")
      .select(
        "id, organization_id, customer_id, opening_id, appointment_id, direction, provider, provider_message_id, from_number, to_number, body, status, status_callback_received_at, created_at"
      )
      .in("organization_id", visibleOrganizationIds)
      .gte("created_at", filters.range.fromIso)
      .lte("created_at", filters.range.toIso)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("platform_sms_webhook_events")
      .select("id, organization_id, from_number, classification, processing_status, body_preview, created_at")
      .or(
        `organization_id.in.(${visibleOrganizationIds.join(",")}),organization_id.is.null`
      )
      .gte("created_at", filters.range.fromIso)
      .lte("created_at", filters.range.toIso)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("platform_organization_admin_controls")
      .select("organization_id, sms_sending_paused, disabled_at, support_status")
      .in("organization_id", visibleOrganizationIds),
    supabase
      .from("platform_compliance_reviews")
      .select("id, issue_key, status, note")
      .or(
        `organization_id.in.(${visibleOrganizationIds.join(",")}),organization_id.is.null`
      )
  ]);

  for (const result of [
    organizationsResult,
    customersResult,
    consentsResult,
    smsResult,
    webhookResult,
    controlsResult,
    reviewsResult
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  const organizations = organizationsResult.data ?? [];
  const customers = customersResult.data ?? [];
  const consents = consentsResult.data ?? [];
  const smsMessages = smsResult.data ?? [];
  const webhookEvents = webhookResult.data ?? [];
  const controls = controlsResult.data ?? [];
  const reviews = reviewsResult.data ?? [];
  const organizationById = new Map(organizations.map((row) => [row.id, row.name]));
  const customerById = new Map(customers.map((row) => [row.id, row]));
  const consentByCustomerId = new Map(consents.map((row) => [row.customer_id, row]));
  const outboundSms = smsMessages.filter((message) => message.direction === "outbound");
  const failedOutboundSms = outboundSms.filter((message) => isFailedSmsStatus(message.status));
  const missingCallbacks = outboundSms.filter((message) =>
    hasMissingStatusCallback({
      provider: message.provider,
      direction: message.direction,
      status: message.status,
      statusCallbackReceivedAt: message.status_callback_received_at,
      createdAt: message.created_at
    })
  );
  const riskySends = outboundSms.filter((message) => {
    if (!message.customer_id || !message.organization_id) {
      return true;
    }

    const consent = consentByCustomerId.get(message.customer_id);
    return !consent || consent.status !== "opted_in";
  });
  const missingConsentCustomers = customers.filter(
    (customer) => !consentByCustomerId.has(customer.id)
  );
  const optedOutConsents = consents.filter((consent) => consent.status === "opted_out");
  const recentOptOuts = [
    ...optedOutConsents.map((consent) => {
      const customer = customerById.get(consent.customer_id);

      return {
        id: consent.customer_id,
        createdAt: consent.unsubscribed_at ?? consent.created_at,
        organizationName: organizationById.get(consent.organization_id) ?? "Unknown",
        customerName: customer?.full_name ?? "Unknown",
        phoneMasked: maskPhoneNumber(customer?.phone_e164 ?? consent.phone_e164),
        source: "Consent status",
        bodyPreview: ""
      };
    }),
    ...webhookEvents
      .filter((event) => event.classification === "opt_out")
      .map((event) => ({
        id: event.id,
        createdAt: event.created_at,
        organizationName: event.organization_id
          ? organizationById.get(event.organization_id) ?? "Unknown"
          : "Unknown",
        customerName: "Unknown",
        phoneMasked: maskPhoneNumber(event.from_number),
        source: "Inbound reply",
        bodyPreview: event.body_preview ?? ""
      }))
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 10);
  const unlinkedInboundReplies = webhookEvents.filter(
    (event) => event.processing_status === "received_unlinked"
  );
  const unknownReplies = webhookEvents.filter(
    (event) => event.classification === "unknown"
  );
  const pausedControls = controls.filter((control) => control.sms_sending_paused);
  const disabledControls = controls.filter((control) => control.disabled_at);
  const failureRate = calculateFailureRate({
    failed: failedOutboundSms.length,
    outbound: outboundSms.length
  });
  const issues: ComplianceIssue[] = [];

  function addIssue(issue: Omit<ComplianceIssue, "status" | "reviewId" | "note">) {
    const review = reviewStatusForIssue(reviews, issue.key);
    issues.push({ ...issue, ...review });
  }

  if (riskySends.length > 0) {
    addIssue({
      key: `${organizationId ?? "global"}:potential_risky_sends:${filters.range.fromIso}`,
      type: "potential_risky_sends",
      severity: "high",
      title: "Potential risky sends",
      description:
        "Outbound SMS were sent to customers whose current consent is missing or not opted in. Consent-at-send is not stored yet, so this may over-report.",
      organizationId: organizationId ?? null,
      organizationName: organizationId ? organizationById.get(organizationId) ?? "Unknown" : "All companies",
      evidence: `${riskySends.length} messages`
    });
  }

  if (missingConsentCustomers.length > 0) {
    addIssue({
      key: `${organizationId ?? "global"}:missing_consent:${filters.range.fromIso}`,
      type: "missing_consent",
      severity: "medium",
      title: "Missing consent records",
      description: "Customers exist without a matching sms_consents row. No opt-in was created automatically.",
      organizationId: organizationId ?? null,
      organizationName: organizationId ? organizationById.get(organizationId) ?? "Unknown" : "All companies",
      evidence: `${missingConsentCustomers.length} customers`
    });
  }

  if (unlinkedInboundReplies.length > 0) {
    addIssue({
      key: `${organizationId ?? "global"}:unlinked_replies:${filters.range.fromIso}`,
      type: "unlinked_replies",
      severity: "medium",
      title: "Unlinked inbound replies",
      description: "Inbound webhook events did not match a prior outbound context.",
      organizationId: organizationId ?? null,
      organizationName: organizationId ? organizationById.get(organizationId) ?? "Unknown" : "All companies",
      evidence: `${unlinkedInboundReplies.length} replies`
    });
  }

  if (missingCallbacks.length > 0) {
    addIssue({
      key: `${organizationId ?? "global"}:missing_callbacks:${filters.range.fromIso}`,
      type: "missing_callbacks",
      severity: "low",
      title: "Missing status callbacks",
      description: "Some Twilio outbound SMS are older than 10 minutes without callback.",
      organizationId: organizationId ?? null,
      organizationName: organizationId ? organizationById.get(organizationId) ?? "Unknown" : "All companies",
      evidence: `${missingCallbacks.length} messages`
    });
  }

  if (isHighFailureRate({ failed: failedOutboundSms.length, outbound: outboundSms.length })) {
    addIssue({
      key: `${organizationId ?? "global"}:high_failure_rate:${filters.range.fromIso}`,
      type: "high_failure_rate",
      severity: "high",
      title: "High SMS failure rate",
      description: "The outbound SMS failure rate is above the operational threshold.",
      organizationId: organizationId ?? null,
      organizationName: organizationId ? organizationById.get(organizationId) ?? "Unknown" : "All companies",
      evidence: `${Math.round(failureRate * 100)}% failed`
    });
  }

  const filteredIssues = issues
    .filter((issue) => filters.status === "all" || issue.status === filters.status)
    .filter((issue) => filters.severity === "all" || issue.severity === filters.severity)
    .filter((issue) =>
      adminSearchMatches(
        [
          issue.title,
          issue.description,
          issue.type,
          issue.organizationName,
          issue.evidence,
          issue.status,
          issue.severity
        ],
        filters.q
      )
    );

  await recordPlatformAdminAuditLog({
    admin,
    organizationId: organizationId ?? null,
    action: auditAction,
    entityType: organizationId ? "organizations" : "platform_compliance_reviews",
    entityId: organizationId ?? null,
    metadata: {
      range: filters.range.rangeKey,
      issue_count: filteredIssues.length
    }
  });

  return {
    filters,
    metrics: {
      optedOutCustomers: optedOutConsents.length,
      recentOptOuts: recentOptOuts.length,
      potentialRiskySends: riskySends.length,
      missingConsentRecords: missingConsentCustomers.length,
      unlinkedInboundReplies: unlinkedInboundReplies.length,
      unknownReplies: unknownReplies.length,
      failedSmsRate: failureRate,
      missingStatusCallbacks: missingCallbacks.length,
      organizationsWithSmsPaused: pausedControls.length,
      organizationsDisabled: disabledControls.length
    },
    issues: filteredIssues,
    recentOptOuts
  };
}
