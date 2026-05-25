import { getSmsProvider } from "@/lib/env/config";
import { createPlivoSmsProvider } from "@/lib/sms/plivo";
import type { SmsProviderClient } from "@/lib/sms/provider";
import { createSimulatorSmsProvider } from "@/lib/sms/simulator";
import { createTwilioSmsProvider } from "@/lib/sms/twilio";

export function createSmsProvider(): SmsProviderClient {
  const provider = getSmsProvider();

  if (provider === "plivo") {
    return createPlivoSmsProvider();
  }

  if (provider === "twilio") {
    return createTwilioSmsProvider();
  }

  return createSimulatorSmsProvider();
}
