export type OrganizationSmsSenderModel =
  | "shared_test"
  | "dedicated_parent_account"
  | "dedicated_subaccount";

export type OrganizationSmsSenderStatus =
  | "not_started"
  | "connected"
  | "number_missing"
  | "webhook_missing"
  | "compliance_pending"
  | "test_required"
  | "ready"
  | "paused"
  | "blocked"
  | "released";

export type OrganizationSmsComplianceStatus =
  | "not_started"
  | "not_required"
  | "collecting_info"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "blocked";

export type OrganizationSmsSenderRow = {
  id: string;
  organization_id: string;
  provider: string;
  sender_model: OrganizationSmsSenderModel;
  twilio_subaccount_sid: string | null;
  twilio_subaccount_friendly_name: string | null;
  twilio_subaccount_status: string | null;
  twilio_messaging_service_sid: string | null;
  twilio_phone_number_sid: string | null;
  phone_e164: string | null;
  sender_status: OrganizationSmsSenderStatus;
  compliance_status: OrganizationSmsComplianceStatus;
  consent_strategy: string;
  stop_help_status: string;
  inbound_webhook_url: string | null;
  status_callback_url: string | null;
  last_synced_at: string | null;
  last_test_sms_sent_at: string | null;
  last_inbound_test_at: string | null;
  last_status_callback_at: string | null;
  activated_at: string | null;
  paused_at: string | null;
  blocked_at: string | null;
  last_error: string | null;
  provider_payload: Record<string, unknown>;
  created_by_platform_admin_id: string | null;
  updated_by_platform_admin_id: string | null;
  created_at: string;
  updated_at: string;
};

export type SafeOrganizationSmsSenderView = {
  id: string;
  organizationId: string;
  provider: string;
  senderModel: OrganizationSmsSenderModel;
  phoneE164: string | null;
  phoneDisplay: string;
  twilioSubaccountSidMasked: string | null;
  twilioMessagingServiceSidMasked: string | null;
  twilioPhoneNumberSidMasked: string | null;
  senderStatus: OrganizationSmsSenderStatus;
  complianceStatus: OrganizationSmsComplianceStatus;
  consentStrategy: string;
  stopHelpStatus: string;
  inboundWebhookConfigured: boolean;
  statusCallbackConfigured: boolean;
  inboundWebhookUrl: string | null;
  statusCallbackUrl: string | null;
  lastSyncedAt: string | null;
  lastTestSmsSentAt: string | null;
  lastInboundTestAt: string | null;
  lastStatusCallbackAt: string | null;
  activatedAt: string | null;
  pausedAt: string | null;
  blockedAt: string | null;
  lastError: string | null;
  subaccountFriendlyName: string | null;
  subaccountStatus: string | null;
  isTrialAccount: boolean;
  livePhoneOk: boolean | null;
  liveWebhookOk: boolean | null;
  liveStatusCallbackOk: boolean | null;
  liveMessagingServiceOk: boolean | null;
  liveVerifiedAt: string | null;
};
