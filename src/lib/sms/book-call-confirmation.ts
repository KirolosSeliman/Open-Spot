import "server-only";

import type { BookCallRequestValidatedInput } from "@/lib/book-call/validation";
import { normalizePhoneToE164 } from "@/lib/customers/phone";
import {
  generateBookCallConfirmationSmsMessage,
  getFirstNameForBookCall
} from "@/lib/sms/platform-message-generator";
import { sendPlatformSms } from "@/lib/sms/platform-sms";

export type BookCallConfirmationSmsOutcome =
  | { sent: true }
  | { sent: false; warning: string };

export async function sendBookCallConfirmationSms({
  requestId,
  input
}: {
  requestId: string;
  input: BookCallRequestValidatedInput;
}): Promise<BookCallConfirmationSmsOutcome> {
  if (!input.consentSmsEmail) {
    return {
      sent: false,
      warning: "sms_skipped_no_consent"
    };
  }

  const normalizedPhone = normalizePhoneToE164(input.phone);

  if (!normalizedPhone.ok) {
    return {
      sent: false,
      warning: "sms_skipped_invalid_phone"
    };
  }

  const message = generateBookCallConfirmationSmsMessage({
    firstName: getFirstNameForBookCall(input.fullName),
    language: input.locale
  });

  const result = await sendPlatformSms({
    to: normalizedPhone.phoneE164,
    body: message.body,
    messageType: "book_call_confirmation",
    recipientType: "prospect",
    recipientName: input.fullName,
    bookCallRequestId: requestId,
    metadata: {
      locale: input.locale,
      business_name: input.businessName
    }
  });

  if (!result.ok) {
    return {
      sent: false,
      warning: result.error
    };
  }

  return { sent: true };
}
