import type { OrganizationSmsReadiness } from "@/lib/sms/organization-gate";
import type {
  OrganizationSmsSenderRow,
  OrganizationSmsSenderStatus
} from "@/lib/sms/organization-sender-types";
import { validateE164 } from "@/lib/sms/twilio-validation";

type EnvSource = Partial<Record<string, string | undefined>>;

export type SmsSenderReadinessCheck = {
  key: string;
  label: string;
  description: string;
  status: "active" | "missing" | "error" | "pending";
  blocking: boolean;
};

export type SmsSenderReadinessResult = {
  isReady: boolean;
  senderStatus: OrganizationSmsSenderStatus;
  blockingReasons: string[];
  checks: SmsSenderReadinessCheck[];
  canActivate: boolean;
  canSendTest: boolean;
};

function isProductionSenderModel(senderModel: string) {
  return senderModel === "dedicated_subaccount" || senderModel === "dedicated_parent_account";
}

function isWebhookConfigured(url: string | null | undefined) {
  return Boolean(url?.trim());
}

export function computeSmsSenderReadiness({
  sender,
  organizationReadiness,
  env = process.env
}: {
  sender: OrganizationSmsSenderRow | null;
  organizationReadiness?: OrganizationSmsReadiness;
  env?: EnvSource;
}): SmsSenderReadinessResult {
  const blockingReasons: string[] = [];
  const checks: SmsSenderReadinessCheck[] = [];

  const pushCheck = (check: SmsSenderReadinessCheck) => {
    checks.push(check);

    if (check.blocking && check.status !== "active") {
      blockingReasons.push(check.label);
    }
  };

  pushCheck({
    key: "dedicated_number",
    label: "Numéro dédié lié",
    description: "Un numéro SMS dédié est connecté et actif.",
    status: sender?.phone_e164 && validateE164(sender.phone_e164) ? "active" : "missing",
    blocking: true
  });

  pushCheck({
    key: "inbound_webhook",
    label: "Webhook configuré",
    description: "Webhook entrant configuré et répondant.",
    status: isWebhookConfigured(sender?.inbound_webhook_url) ? "active" : "missing",
    blocking: true
  });

  pushCheck({
    key: "status_callback",
    label: "Callback de statut",
    description: "Callback de statut configuré pour la livraison.",
    status: isWebhookConfigured(sender?.status_callback_url) ? "active" : "missing",
    blocking: true
  });

  pushCheck({
    key: "consent",
    label: "Consentement requis",
    description: "Opt-in explicite collecté et enregistré.",
    status:
      sender?.consent_strategy === "explicit_opt_in" ||
      sender?.consent_strategy === "manual_import_with_proof" ||
      sender?.consent_strategy === "sms_opt_in"
        ? "active"
        : "pending",
    blocking: false
  });

  pushCheck({
    key: "stop_help",
    label: "Gestion STOP/AIDE",
    description: "Réponses STOP et AIDE fonctionnelles.",
    status: sender?.stop_help_status === "active" ? "active" : "pending",
    blocking: true
  });

  const testValidated =
    Boolean(sender?.last_test_sms_sent_at) &&
    Boolean(sender?.last_status_callback_at || sender?.last_inbound_test_at);

  pushCheck({
    key: "test_message",
    label: "Message test validé",
    description: "Test de livraison et de callback réussi.",
    status: testValidated ? "active" : "missing",
    blocking: true
  });

  if (!sender) {
    blockingReasons.push("Configuration SMS non démarrée.");
  } else {
    if (sender.provider !== "twilio") {
      blockingReasons.push("Fournisseur SMS non supporté.");
    }

    if (!isProductionSenderModel(sender.sender_model)) {
      blockingReasons.push("Modèle d'envoi non compatible production.");
    }

    if (
      sender.sender_model === "dedicated_subaccount" &&
      !sender.twilio_subaccount_sid
    ) {
      blockingReasons.push("Sous-compte Twilio manquant.");
    }

    if (!sender.twilio_messaging_service_sid) {
      blockingReasons.push("Service d'envoi Twilio manquant.");
    }

    if (
      sender.compliance_status !== "approved" &&
      sender.compliance_status !== "not_required"
    ) {
      blockingReasons.push("Conformité SMS non approuvée.");
    }

    if (sender.sender_status === "paused" || sender.sender_status === "blocked") {
      blockingReasons.push("Sender SMS en pause ou bloqué.");
    }
  }

  if (organizationReadiness && !organizationReadiness.canSendSms) {
    blockingReasons.push(...organizationReadiness.blockingReasons);
  }

  if (env.ALLOW_REAL_SMS_SENDS !== "true") {
    blockingReasons.push("Envoi SMS réel désactivé (ALLOW_REAL_SMS_SENDS).");
  }

  const uniqueBlockingReasons = [...new Set(blockingReasons)];
  const isReady =
    Boolean(sender) &&
    sender!.sender_status === "ready" &&
    uniqueBlockingReasons.length === 0;

  return {
    isReady,
    senderStatus: sender?.sender_status ?? "not_started",
    blockingReasons: uniqueBlockingReasons,
    checks,
    canActivate: Boolean(sender) && uniqueBlockingReasons.length === 0,
    canSendTest:
      Boolean(sender?.phone_e164) &&
      isWebhookConfigured(sender?.inbound_webhook_url) &&
      env.ALLOW_REAL_SMS_SENDS === "true"
  };
}

export function assertOrganizationSmsSenderReady(
  sender: OrganizationSmsSenderRow | null,
  organizationReadiness?: OrganizationSmsReadiness
) {
  const readiness = computeSmsSenderReadiness({ sender, organizationReadiness });

  if (!readiness.isReady) {
    throw new Error(
      readiness.blockingReasons[0] ?? "Organization SMS sender is not ready."
    );
  }
}

export function deriveSenderStatusFromConfig(
  sender: OrganizationSmsSenderRow
): OrganizationSmsSenderStatus {
  if (sender.sender_status === "paused" || sender.sender_status === "blocked") {
    return sender.sender_status;
  }

  if (sender.sender_status === "ready" && sender.activated_at) {
    return "ready";
  }

  if (!sender.twilio_subaccount_sid && sender.sender_model === "dedicated_subaccount") {
    return "not_started";
  }

  if (!sender.phone_e164) {
    return "number_missing";
  }

  if (!sender.inbound_webhook_url || !sender.status_callback_url) {
    return "webhook_missing";
  }

  if (
    sender.compliance_status !== "approved" &&
    sender.compliance_status !== "not_required"
  ) {
    return "compliance_pending";
  }

  if (!sender.last_test_sms_sent_at) {
    return "test_required";
  }

  if (sender.activated_at) {
    return "ready";
  }

  return "connected";
}
