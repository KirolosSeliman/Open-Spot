import { handleInboundSmsRequest } from "@/lib/sms/inbound-handler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleInboundSmsRequest(request);
}
