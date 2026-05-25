import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { createWaitlistSubmissionPayload } from "@/lib/waitlist/submission";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = createWaitlistSubmissionPayload({
    organizationSlug: String(formData.get("organizationSlug") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    preferredLanguage: String(formData.get("preferredLanguage") ?? "en"),
    serviceInterest: String(formData.get("serviceInterest") ?? ""),
    preferredDays: String(formData.get("preferredDays") ?? ""),
    preferredTimeWindows: String(formData.get("preferredTimeWindows") ?? ""),
    discountInterest: formData.get("discountInterest") === "on",
    consentAccepted: formData.get("consentAccepted") === "on"
  });

  if (!parsed.ok) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      {
        errors: ["Waitlist storage is not configured for this environment."]
      },
      { status: 503 }
    );
  }

  const { data, error } = await supabase.rpc("register_waitlist_signup", {
    organization_slug: parsed.payload.organizationSlug,
    customer_full_name: parsed.payload.fullName,
    customer_phone_e164: parsed.payload.phoneE164,
    customer_preferred_language: parsed.payload.preferredLanguage,
    service_interest: parsed.payload.serviceInterest,
    preferred_days: parsed.payload.preferredDays,
    preferred_time_windows: parsed.payload.preferredTimeWindows,
    wants_discount: parsed.payload.discountInterest,
    consent_copy: parsed.payload.consentText
  });

  if (error) {
    return NextResponse.json({ errors: [error.message] }, { status: 400 });
  }

  return NextResponse.json({
    waitlistEntryId: data,
    status: "created"
  });
}
