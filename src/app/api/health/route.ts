import { NextResponse } from "next/server";

import { getSmsProvider } from "@/lib/env/config";
import { createHealthPayload } from "@/lib/env/health";

export function GET() {
  return NextResponse.json(createHealthPayload(getSmsProvider()));
}
