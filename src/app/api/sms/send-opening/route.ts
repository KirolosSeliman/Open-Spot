import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createSmsProvider } from "@/lib/sms/factory";
import { loadOrganizationSmsReadiness } from "@/lib/sms/organization-gate";

async function readOrganizationId(request: Request) {
  try {
    const body = (await request.json()) as { organizationId?: unknown };

    return typeof body.organizationId === "string"
      ? body.organizationId.trim()
      : "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const supabase = createSupabaseServiceClient();
  const provider = createSmsProvider();

  if (!supabase) {
    return NextResponse.json(
      {
        provider: provider.getProviderName(),
        error: "Opening send requires configured Supabase service role and organization context."
      },
      { status: 503 }
    );
  }

  const organizationId = await readOrganizationId(request);

  if (!organizationId) {
    return NextResponse.json(
      {
        provider: provider.getProviderName(),
        error: "Opening send requires an organizationId."
      },
      { status: 400 }
    );
  }

  const readiness = await loadOrganizationSmsReadiness(supabase, organizationId);

  if (!readiness.canSendSms) {
    return NextResponse.json(
      {
        provider: provider.getProviderName(),
        error:
          "Opening send is blocked until billing is authorized and SMS status is active.",
        blockingReasons: readiness.blockingReasons,
        billingStatus: readiness.billingStatus,
        smsStatus: readiness.smsStatus
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      provider: provider.getProviderName(),
      error: "Opening send persistence is not enabled until organization-scoped recipient queries are connected."
    },
    { status: 501 }
  );
}
