import type { SmsProviderClient } from "@/lib/sms/provider";

export function createTwilioSmsProvider(): SmsProviderClient {
  return {
    getProviderName() {
      return "twilio";
    },
    async sendSms() {
      throw new Error("Twilio sending is not enabled until credentials and webhook verification are configured.");
    },
    async verifyWebhookSignature() {
      return false;
    },
    async parseInboundRequest() {
      throw new Error("Twilio inbound parsing is not enabled yet.");
    }
  };
}
