import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { buildWaitlistSignupRpcArgs } from "@/lib/waitlist/rpc";
import { createWaitlistSubmissionPayload } from "@/lib/waitlist/submission";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = createWaitlistSubmissionPayload({
    organizationSlug: String(formData.get("organizationSlug") ?? ""),
    fullName: String(formData.get("fullName") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    phoneCountry: String(formData.get("phoneCountry") ?? ""),
    phoneNational: String(formData.get("phoneNational") ?? ""),
    preferredLanguage: String(formData.get("preferredLanguage") ?? "en"),
    serviceInterest: String(formData.get("serviceInterest") ?? ""),
    serviceIds: formData.getAll("serviceIds").map(String),
    preferredDays: String(formData.get("preferredDays") ?? ""),
    preferredTimeWindows: String(formData.get("preferredTimeWindows") ?? ""),
    discountInterest: formData.get("discountInterest") === "on",
    consentAccepted: formData.get("consentAccepted") === "on",
    signupSource: String(formData.get("signupSource") ?? "public_link")
  });

  if (!parsed.ok) {
    return NextResponse.json({ errors: parsed.errors }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    return NextResponse.json(
      {
        errors: ["Public waitlist storage is not configured for this environment."]
      },
      { status: 503 }
    );
  }

  const { data, error } = await supabase.rpc(
    "register_waitlist_signup",
    buildWaitlistSignupRpcArgs(parsed.payload)
  );

  if (error) {
    return NextResponse.json({ errors: [formatWaitlistError(error.message)] }, { status: 400 });
  }

  return NextResponse.json({
    waitlistEntryId: data,
    status: "created_or_updated"
  });
}

function formatWaitlistError(message: string) {
  if (message.includes("Organization not found")) {
    return "This waitlist link is no longer available.";
  }

  if (message.includes("One or more selected services are unavailable")) {
    return "One or more selected services are unavailable. Please refresh and try again.";
  }

  if (message.includes("SMS consent is required")) {
    return "SMS consent is required to join the waitlist.";
  }

  if (message.includes("valid phone")) {
    return "Enter a valid 10-digit Canadian or US phone number.";
  }

  return "Unable to join the waitlist right now. Please try again.";
}
