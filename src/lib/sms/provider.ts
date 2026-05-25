import type { SmsProvider } from "@/lib/env/config";

export type SmsProviderDescriptor = {
  name: SmsProvider;
  sendsRealMessages: boolean;
};

export type SendSmsInput = {
  to: string;
  body: string;
  metadata?: Record<string, string>;
};

export type SendSmsResult = {
  provider: SmsProvider;
  providerMessageId: string;
  status: "sent" | "simulated";
};

export type SmsProviderClient = {
  getProviderName(): SmsProvider;
  sendSms(input: SendSmsInput): Promise<SendSmsResult>;
  verifyWebhookSignature(request: Request): Promise<boolean>;
  parseInboundRequest(request: Request): Promise<{
    from: string;
    to: string;
    body: string;
    providerMessageId?: string;
  }>;
};

export function createSmsProviderDescriptor(
  provider: SmsProvider
): SmsProviderDescriptor {
  return {
    name: provider,
    sendsRealMessages: provider !== "simulator"
  };
}
