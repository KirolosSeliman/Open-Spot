import "server-only";

import { normalizePhoneToE164 } from "@/lib/customers/phone";
import {
  formatBillingAmount,
  formatBillingPeriodLabel,
  generateBillingPaymentReminderSmsMessage
} from "@/lib/sms/platform-message-generator";
import {
  getLatestBillingPaymentReminderSentAt,
  sendPlatformSms
} from "@/lib/sms/platform-sms";
import type { ManualBillingSummary } from "@/lib/billing/manual-billing-data";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export type BillingReminderContact = {
  contactName: string;
  phoneE164: string;
  phoneDisplay: string;
  language: "fr" | "en";
};

export type BillingPaymentReminderContext = {
  canSend: boolean;
  disabledReason: string | null;
  contact: BillingReminderContact | null;
  billingPeriod: string;
  amountDue: string;
  messagePreview: string;
  lastReminderSentAt: string | null;
};

function requireServiceClient() {
  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service client is not configured.");
  }

  return supabase;
}

async function resolveBillingReminderContact(
  organizationId: string,
  organizationName: string,
  defaultLanguage: "fr" | "en"
): Promise<BillingReminderContact | null> {
  const supabase = requireServiceClient();

  const [organizationResult, onboardingResult] = await Promise.all([
    supabase
      .from("organizations")
      .select("phone, source_request_id, default_language")
      .eq("id", organizationId)
      .maybeSingle(),
    supabase
      .from("organization_onboarding_submissions")
      .select("responsible_name")
      .eq("organization_id", organizationId)
      .maybeSingle()
  ]);

  const organization = organizationResult.data;
  let contactPhone = organization?.phone ?? null;
  let contactName =
    onboardingResult.data?.responsible_name?.trim() || organizationName;
  const language = organization?.default_language ?? defaultLanguage;

  if (!contactPhone && organization?.source_request_id) {
    const { data: bookCallRequest } = await supabase
      .from("book_call_requests")
      .select("phone, full_name")
      .eq("id", organization.source_request_id)
      .maybeSingle();

    if (bookCallRequest?.phone) {
      contactPhone = bookCallRequest.phone;
      contactName = bookCallRequest.full_name?.trim() || contactName;
    }
  }

  if (!contactPhone) {
    return null;
  }

  const normalized = normalizePhoneToE164(contactPhone);

  if (!normalized.ok) {
    return null;
  }

  return {
    contactName,
    phoneE164: normalized.phoneE164,
    phoneDisplay: contactPhone,
    language
  };
}

function buildReminderPreview({
  contact,
  businessName,
  billing,
  language
}: {
  contact: BillingReminderContact;
  businessName: string;
  billing: ManualBillingSummary;
  language: "fr" | "en";
}) {
  const billingPeriod = formatBillingPeriodLabel({
    periodStart: billing.currentPeriodStart,
    language
  });
  const amountDue = formatBillingAmount({
    amountCents: billing.monthlyPriceCents,
    currency: billing.currency,
    language
  });

  return generateBillingPaymentReminderSmsMessage({
    contactName: contact.contactName,
    businessName,
    billingPeriod,
    amountDue,
    paymentUrl: billing.externalPaymentUrl,
    language
  }).body;
}

export async function loadBillingPaymentReminderContext({
  organizationId,
  organizationName,
  billing
}: {
  organizationId: string;
  organizationName: string;
  billing: ManualBillingSummary;
}): Promise<BillingPaymentReminderContext> {
  if (billing.billingStatus === "paid") {
    return {
      canSend: false,
      disabledReason: "Cette facture est déjà payée.",
      contact: null,
      billingPeriod: "",
      amountDue: "",
      messagePreview: "",
      lastReminderSentAt: null
    };
  }

  if (!billing.monthlyPriceCents || billing.monthlyPriceCents <= 0) {
    return {
      canSend: false,
      disabledReason: "Aucun montant du coherent n'est disponible.",
      contact: null,
      billingPeriod: "",
      amountDue: "",
      messagePreview: "",
      lastReminderSentAt: null
    };
  }

  const contact = await resolveBillingReminderContact(
    organizationId,
    organizationName,
    "fr"
  );

  if (!contact) {
    return {
      canSend: false,
      disabledReason:
        "Aucun numéro de téléphone de facturation n'est disponible pour cette compagnie.",
      contact: null,
      billingPeriod: "",
      amountDue: "",
      messagePreview: "",
      lastReminderSentAt: null
    };
  }

  const language = contact.language;
  const billingPeriod = formatBillingPeriodLabel({
    periodStart: billing.currentPeriodStart,
    language
  });
  const amountDue = formatBillingAmount({
    amountCents: billing.monthlyPriceCents,
    currency: billing.currency,
    language
  });
  const messagePreview = buildReminderPreview({
    contact,
    businessName: organizationName,
    billing,
    language
  });
  const lastReminderSentAt = await getLatestBillingPaymentReminderSentAt(
    organizationId,
    billing.id
  );

  if (lastReminderSentAt) {
    const sentAt = new Date(lastReminderSentAt).getTime();
    const within24Hours = Date.now() - sentAt < 24 * 60 * 60 * 1000;

    if (within24Hours) {
      return {
        canSend: false,
        disabledReason:
          "Un rappel de paiement a déjà été envoyé pour cette facture dans les dernières 24 heures.",
        contact,
        billingPeriod,
        amountDue,
        messagePreview,
        lastReminderSentAt
      };
    }
  }

  return {
    canSend: true,
    disabledReason: null,
    contact,
    billingPeriod,
    amountDue,
    messagePreview,
    lastReminderSentAt
  };
}

export async function sendBillingPaymentReminderSms({
  organizationId,
  organizationName,
  billing,
  sentByPlatformAdminId
}: {
  organizationId: string;
  organizationName: string;
  billing: ManualBillingSummary;
  sentByPlatformAdminId: string;
}) {
  const context = await loadBillingPaymentReminderContext({
    organizationId,
    organizationName,
    billing
  });

  if (!context.canSend || !context.contact) {
    return {
      ok: false as const,
      error: context.disabledReason ?? "Unable to send billing payment reminder."
    };
  }

  const message = generateBillingPaymentReminderSmsMessage({
    contactName: context.contact.contactName,
    businessName: organizationName,
    billingPeriod: context.billingPeriod,
    amountDue: context.amountDue,
    paymentUrl: billing.externalPaymentUrl,
    language: context.contact.language
  });

  const result = await sendPlatformSms({
    to: context.contact.phoneE164,
    body: message.body,
    messageType: "billing_payment_reminder",
    recipientType: "business_contact",
    recipientName: context.contact.contactName,
    organizationId,
    billingId: billing.id,
    sentByPlatformAdminId,
    metadata: {
      billing_status: billing.billingStatus,
      amount_cents: billing.monthlyPriceCents,
      currency: billing.currency,
      billing_period: context.billingPeriod
    }
  });

  if (!result.ok) {
    return {
      ok: false as const,
      error: result.error
    };
  }

  return {
    ok: true as const,
    messageId: result.messageId
  };
}
