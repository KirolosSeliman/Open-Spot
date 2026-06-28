import "server-only";

import { loadOrganizationSmsSender } from "@/lib/sms/organization-sender";
import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import { buildTwilioWebhookUrls } from "@/lib/sms/twilio-sender-config";
import {
  createParentTwilioClient,
  createScopedTwilioClient,
  type TwilioEnv
} from "@/lib/sms/twilio-admin-client";
import { verifyStoredTwilioPhoneNumberForSender } from "@/lib/sms/twilio-phone-verification";
import { validateTwilioMessagingServiceSid } from "@/lib/sms/twilio-validation";

export type TwilioLiveVerificationResult = {
  verifiedAt: string;
  subaccountOk: boolean;
  phoneOk: boolean;
  messagingServiceOk: boolean;
  inboundWebhookOk: boolean;
  statusCallbackOk: boolean;
  phoneAttachedToService: boolean;
  issues: string[];
};

function urlsMatch(expected: string | null | undefined, actual: string | null | undefined) {
  if (!expected?.trim()) {
    return false;
  }

  return expected.trim() === String(actual ?? "").trim();
}

export async function verifyTwilioLiveConfigurationForOrganization({
  organizationId,
  sender: providedSender,
  env = process.env
}: {
  organizationId: string;
  sender?: OrganizationSmsSenderRow | null;
  env?: TwilioEnv;
}): Promise<TwilioLiveVerificationResult> {
  const sender = providedSender ?? (await loadOrganizationSmsSender(organizationId));
  const issues: string[] = [];
  const webhookUrls = buildTwilioWebhookUrls(env);
  const verifiedAt = new Date().toISOString();

  if (!sender) {
    return {
      verifiedAt,
      subaccountOk: false,
      phoneOk: false,
      messagingServiceOk: false,
      inboundWebhookOk: false,
      statusCallbackOk: false,
      phoneAttachedToService: false,
      issues: ["Configuration SMS non démarrée."]
    };
  }

  if (sender.sender_model === "dedicated_subaccount" && !sender.twilio_subaccount_sid) {
    issues.push("Sous-compte Twilio manquant.");
  }

  const client = createScopedTwilioClient(sender, env);
  let subaccountOk = true;

  if (sender.twilio_subaccount_sid) {
    try {
      const parentClient = createParentTwilioClient(env);
      await parentClient.api.accounts(sender.twilio_subaccount_sid).fetch();
    } catch {
      subaccountOk = false;
      issues.push("Sous-compte Twilio introuvable ou inaccessible.");
    }
  }

  const storedPhone = await verifyStoredTwilioPhoneNumberForSender({ client, sender });
  const phoneOk = storedPhone.ok;

  if (!phoneOk) {
    issues.push(storedPhone.reason);
  }

  let messagingServiceOk = false;
  let inboundWebhookOk = false;
  let statusCallbackOk = false;
  let phoneAttachedToService = false;

  if (
    sender.twilio_messaging_service_sid &&
    validateTwilioMessagingServiceSid(sender.twilio_messaging_service_sid)
  ) {
    try {
      const service = await client.messaging.v1
        .services(sender.twilio_messaging_service_sid)
        .fetch();

      messagingServiceOk = true;
      inboundWebhookOk = urlsMatch(webhookUrls.inboundWebhookUrl, service.inboundRequestUrl);
      statusCallbackOk = urlsMatch(webhookUrls.statusCallbackUrl, service.statusCallback);

      if (!inboundWebhookOk) {
        issues.push("Webhook entrant Twilio live différent de la configuration attendue.");
      }

      if (!statusCallbackOk) {
        issues.push("Callback de statut Twilio live différent de la configuration attendue.");
      }

      if (sender.twilio_phone_number_sid) {
        const attachedNumbers = await client.messaging.v1
          .services(sender.twilio_messaging_service_sid)
          .phoneNumbers.list({ limit: 50 });

        phoneAttachedToService = attachedNumbers.some(
          (entry) => entry.sid === sender.twilio_phone_number_sid
        );

        if (!phoneAttachedToService) {
          issues.push("Le numéro n'est pas attaché au Messaging Service Twilio.");
        }
      }
    } catch {
      messagingServiceOk = false;
      issues.push("Messaging Service Twilio introuvable.");
    }
  } else {
    issues.push("Messaging Service Twilio manquant.");
  }

  if (phoneOk && storedPhone.ok && sender.twilio_phone_number_sid) {
    inboundWebhookOk =
      inboundWebhookOk ||
      urlsMatch(webhookUrls.inboundWebhookUrl, storedPhone.phone.smsUrl);
    statusCallbackOk =
      statusCallbackOk ||
      urlsMatch(webhookUrls.statusCallbackUrl, storedPhone.phone.statusCallback);
  }

  if (sender.last_error) {
    issues.push("Dernière erreur Twilio enregistrée — resynchronisation recommandée.");
  }

  return {
    verifiedAt,
    subaccountOk,
    phoneOk,
    messagingServiceOk,
    inboundWebhookOk,
    statusCallbackOk,
    phoneAttachedToService,
    issues: [...new Set(issues)]
  };
}
