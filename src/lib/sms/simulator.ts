import type { SmsProviderClient } from "@/lib/sms/provider";

export const SIMULATOR_WEBHOOK_SECRET_HEADER = "x-open-spot-simulator-secret";

export function isSimulatorWebhookAllowed({
  providerName,
  requestSecret,
  configuredSecret = process.env.SIMULATOR_WEBHOOK_SECRET,
  nodeEnv = process.env.NODE_ENV,
  vercelEnv = process.env.VERCEL_ENV
}: {
  providerName: string;
  requestSecret?: string | null;
  configuredSecret?: string;
  nodeEnv?: string;
  vercelEnv?: string;
}) {
  if (providerName !== "simulator") {
    return true;
  }

  const deployedEnvironment =
    nodeEnv === "production" ||
    vercelEnv === "preview" ||
    vercelEnv === "production";

  if (!deployedEnvironment) {
    return true;
  }

  return Boolean(configuredSecret) && requestSecret === configuredSecret;
}

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
