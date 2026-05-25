import type { SmsProviderClient } from "@/lib/sms/provider";

export function createPlivoSmsProvider(): SmsProviderClient {
  return {
    getProviderName() {
      return "plivo";
    },
    async sendSms() {
      throw new Error("Plivo sending is not enabled until credentials and webhook verification are configured.");
    },
    async verifyWebhookSignature() {
      return false;
    },
    async parseInboundRequest() {
      throw new Error("Plivo inbound parsing is not enabled yet.");
    }
  };
}
