import "server-only";

import { loadOrganizationSmsSenderByPhoneE164 } from "@/lib/sms/organization-sender";
import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import { getSafeTwilioUiError } from "@/lib/sms/twilio-ui-errors";
import { validateTwilioPhoneNumberSid } from "@/lib/sms/twilio-validation";
import type twilio from "twilio";

export type VerifiedTwilioPhoneNumber = {
  sid: string;
  phoneE164: string;
  smsCapable: boolean;
  smsUrl: string | null;
  statusCallback: string | null;
};

export async function fetchVerifiedTwilioPhoneNumber({
  client,
  phoneNumberSid,
  accountSid,
  organizationId
}: {
  client: ReturnType<typeof twilio>;
  phoneNumberSid: string;
  accountSid?: string | null;
  organizationId: string;
}): Promise<VerifiedTwilioPhoneNumber> {
  if (!validateTwilioPhoneNumberSid(phoneNumberSid)) {
    throw new Error("Twilio phone number SID is invalid.");
  }

  try {
    const number = await client.incomingPhoneNumbers(phoneNumberSid).fetch();

    if (!number.capabilities?.sms) {
      throw new Error("Selected Twilio number is not SMS capable.");
    }

    const assignedElsewhere = await loadOrganizationSmsSenderByPhoneE164(number.phoneNumber);

    if (assignedElsewhere && assignedElsewhere.organization_id !== organizationId) {
      throw new Error("This Twilio number is already assigned to another organization.");
    }

    return {
      sid: number.sid,
      phoneE164: number.phoneNumber,
      smsCapable: Boolean(number.capabilities?.sms),
      smsUrl: number.smsUrl ?? null,
      statusCallback: number.statusCallback ?? null
    };
  } catch (error) {
    const safe = getSafeTwilioUiError(error, {
      accountSid,
      phoneNumberSid
    });

    throw new Error(safe.message);
  }
}

export async function assertTwilioPhoneNumberBelongsToSender({
  client,
  sender,
  phoneNumberSid
}: {
  client: ReturnType<typeof twilio>;
  sender: OrganizationSmsSenderRow;
  phoneNumberSid: string;
}) {
  return fetchVerifiedTwilioPhoneNumber({
    client,
    phoneNumberSid,
    accountSid: sender.twilio_subaccount_sid,
    organizationId: sender.organization_id
  });
}

export async function verifyStoredTwilioPhoneNumberForSender({
  client,
  sender
}: {
  client: ReturnType<typeof twilio>;
  sender: OrganizationSmsSenderRow;
}) {
  if (!sender.twilio_phone_number_sid) {
    return {
      ok: false as const,
      reason: "Aucun numéro Twilio enregistré."
    };
  }

  try {
    const verified = await fetchVerifiedTwilioPhoneNumber({
      client,
      phoneNumberSid: sender.twilio_phone_number_sid,
      accountSid: sender.twilio_subaccount_sid,
      organizationId: sender.organization_id
    });

    return {
      ok: true as const,
      phone: verified
    };
  } catch (error) {
    return {
      ok: false as const,
      reason: error instanceof Error ? error.message : "Numéro Twilio invalide."
    };
  }
}
