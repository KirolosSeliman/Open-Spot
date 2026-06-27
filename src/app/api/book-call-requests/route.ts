import { NextResponse } from "next/server";

import {
  buildBookCallRequestInsert,
  validateBookCallRequestInput,
  type BookCallRequestFieldErrors
} from "@/lib/book-call/validation";
import { sendBookCallConfirmationSms } from "@/lib/sms/book-call-confirmation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

const MAX_PAYLOAD_BYTES = 12_000;

function validationError(fields: BookCallRequestFieldErrors) {
  return NextResponse.json(
    {
      ok: false,
      code: "VALIDATION_ERROR",
      fields
    },
    { status: 400 }
  );
}

function serverError() {
  return NextResponse.json(
    {
      ok: false,
      code: "SERVER_ERROR"
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (contentLength > MAX_PAYLOAD_BYTES) {
    return validationError({
      _form: "Request payload is too large."
    });
  }

  let payload: unknown;

  try {
    const body = await request.text();

    if (body.length > MAX_PAYLOAD_BYTES) {
      return validationError({
        _form: "Request payload is too large."
      });
    }

    payload = JSON.parse(body);
  } catch {
    return validationError({
      _form: "Submit the form again with valid request data."
    });
  }

  const validation = validateBookCallRequestInput(
    typeof payload === "object" && payload !== null ? payload : {}
  );

  if (!validation.ok) {
    return validationError(validation.fields);
  }

  if (validation.isSpam) {
    console.warn("Book call request honeypot submission ignored.");

    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    console.error(
      "Book call request insert failed: Supabase service access is not configured."
    );

    return serverError();
  }

  const sourceUrl = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");
  const insertPayload = buildBookCallRequestInsert({
    input: validation.value,
    sourceUrl,
    userAgent
  });
  const { data, error } = await supabase
    .from("book_call_requests")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error || !data) {
    console.error("Book call request insert failed:", {
      code: error?.code,
      message: error?.message
    });

    return serverError();
  }

  const smsOutcome = await sendBookCallConfirmationSms({
    requestId: data.id,
    input: validation.value
  });

  if (!smsOutcome.sent && smsOutcome.warning !== "sms_skipped_no_consent") {
    console.warn("Book call confirmation SMS was not sent", {
      requestId: data.id,
      warning: smsOutcome.warning
    });
  }

  return NextResponse.json(
    {
      ok: true,
      requestId: data.id,
      confirmationSmsSent: smsOutcome.sent,
      confirmationSmsWarning: smsOutcome.sent ? null : smsOutcome.warning
    },
    { status: 201 }
  );
}
