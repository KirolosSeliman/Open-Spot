import "server-only";

import twilio from "twilio";

import type { OrganizationSmsSenderRow } from "@/lib/sms/organization-sender-types";
import { validateTwilioAccountSid } from "@/lib/sms/twilio-validation";

export type TwilioEnv = Partial<Record<string, string | undefined>>;

export function requireTwilioParentCredentials(env: TwilioEnv = process.env) {
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    throw new Error("Twilio parent credentials are not configured.");
  }

  if (!validateTwilioAccountSid(accountSid)) {
    throw new Error("TWILIO_ACCOUNT_SID is invalid.");
  }

  return { accountSid, authToken };
}

export function createParentTwilioClient(env: TwilioEnv = process.env) {
  const { accountSid, authToken } = requireTwilioParentCredentials(env);

  return twilio(accountSid, authToken);
}

export function createScopedTwilioClient(
  sender: OrganizationSmsSenderRow,
  env: TwilioEnv = process.env
) {
  const { accountSid, authToken } = requireTwilioParentCredentials(env);

  if (
    sender.sender_model === "dedicated_subaccount" &&
    sender.twilio_subaccount_sid
  ) {
    return twilio(accountSid, authToken, {
      accountSid: sender.twilio_subaccount_sid
    });
  }

  return twilio(accountSid, authToken);
}

export function getOrganizationFriendlyName(organizationName: string) {
  return `Open Spot - ${organizationName}`.slice(0, 64);
}
