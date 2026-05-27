import type { SmsProvider } from "./config";

export type HealthPayload = {
  app: "Open Spot";
  status: "ok";
  smsProvider: SmsProvider;
};

export function createHealthPayload(smsProvider: SmsProvider): HealthPayload {
  return {
    app: "Open Spot",
    status: "ok",
    smsProvider
  };
}
