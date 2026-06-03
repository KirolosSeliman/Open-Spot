import { handleInboundSmsRequest } from "@/lib/sms/inbound-handler";
import { createTwilioSmsProvider } from "@/lib/sms/twilio";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleInboundSmsRequest(request, createTwilioSmsProvider());
}
