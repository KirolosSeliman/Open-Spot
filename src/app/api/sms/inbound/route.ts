import { handleInboundSmsRequest } from "@/lib/sms/inbound-handler";
import { resolveTwilioAuthTokenForAccountSid } from "@/lib/sms/twilio-admin";
import {
  createTwilioSmsProvider,
  validateTwilioWebhookRequestForAccountSid
} from "@/lib/sms/twilio";

export const runtime = "nodejs";

const twilioProvider = createTwilioSmsProvider();

export async function POST(request: Request) {
  const provider = {
    ...twilioProvider,
    async verifyWebhookSignature(request: Request) {
      const body = await request.clone().text();
      const params = Object.fromEntries(new URLSearchParams(body));

      return validateTwilioWebhookRequestForAccountSid(
        request,
        params,
        resolveTwilioAuthTokenForAccountSid
      );
    }
  };

  return handleInboundSmsRequest(request, provider);
}
