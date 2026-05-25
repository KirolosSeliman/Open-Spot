import type { SmsProvider } from "./config";

export type HealthPayload = {
  app: "2e Chance RDV";
  status: "ok";
  smsProvider: SmsProvider;
};

export function createHealthPayload(smsProvider: SmsProvider): HealthPayload {
  return {
    app: "2e Chance RDV",
    status: "ok",
    smsProvider
  };
}
