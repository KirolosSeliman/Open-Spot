import type { SmsProviderClient } from "@/lib/sms/provider";

export function createSimulatorSmsProvider(): SmsProviderClient {
  return {
    getProviderName() {
      return "simulator";
    },
    async sendSms(input) {
      return {
        provider: "simulator",
        providerMessageId: `sim_${Buffer.from(`${input.to}:${input.body}`).toString("base64url").slice(0, 24)}`,
        status: "simulated"
      };
    },
    async verifyWebhookSignature() {
      return true;
    },
    async parseInboundRequest(request) {
      const payload = await request.json();

      return {
        from: String(payload.from ?? ""),
        to: String(payload.to ?? ""),
        body: String(payload.body ?? ""),
        providerMessageId: payload.providerMessageId
          ? String(payload.providerMessageId)
          : undefined
      };
    }
  };
}
