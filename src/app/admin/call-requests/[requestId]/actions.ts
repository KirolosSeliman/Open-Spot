"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentPlatformAdminAccess, requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  convertCallRequestToClient,
  resendCallRequestInvitation
} from "@/lib/book-call/conversion";
import type { ConversionResult, ResendInvitationResult } from "@/lib/book-call/conversion-types";
import {
  validateBookCallInternalNotes,
  validateBookCallRequestStatus
} from "@/lib/book-call/validation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function detailPath(requestId: string) {
  return `/admin/call-requests/${requestId}`;
}

function redirectWithDetailMessage(
  requestId: string,
  key: "error" | "notice",
  message: string
): never {
  redirect(`${detailPath(requestId)}?${key}=${encodeURIComponent(message)}`);
}

async function requireDetailAdminWrite() {
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    throw new Error("Platform admin access required.");
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    throw new Error("Supabase service access is not configured.");
  }

  return {
    admin: access.admin,
    supabase
  };
}

export async function updateBookCallRequestDetailAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "").trim();
  const status = validateBookCallRequestStatus(formData.get("status"));
  const notes = validateBookCallInternalNotes(formData.get("internalNotes"));
  const rawNotes = String(formData.get("internalNotes") ?? "").trim();

  if (!requestId) {
    redirectWithDetailMessage(requestId, "error", "Request id is required.");
  }

  if (!status) {
    redirectWithDetailMessage(requestId, "error", "Choose a valid call request status.");
  }

  if (notes === null && rawNotes.length > 2000) {
    redirectWithDetailMessage(
      requestId,
      "error",
      "Internal notes must be 2000 characters or fewer."
    );
  }

  const { supabase } = await requireDetailAdminWrite();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("book_call_requests")
    .update({
      status,
      internal_notes: notes,
      contacted_at: status === "contacted" ? now : undefined
    })
    .eq("id", requestId);

  if (error) {
    redirectWithDetailMessage(requestId, "error", error.message);
  }

  revalidatePath(detailPath(requestId));
  revalidatePath("/admin/call-requests");
  redirectWithDetailMessage(requestId, "notice", "Demande mise a jour.");
}

export async function convertCallRequestAction(
  requestId: string
): Promise<ConversionResult> {
  const access = await getCurrentPlatformAdminAccess();

  if (access.status === "unauthenticated") {
    return {
      status: "failed",
      errorCode: "unauthenticated",
      errorMessage: "Connexion requise."
    };
  }

  if (access.status !== "authorized") {
    return {
      status: "failed",
      errorCode: "forbidden",
      errorMessage: "Acces administrateur requis."
    };
  }

  const result = await convertCallRequestToClient({
    requestId,
    admin: access.admin
  });

  revalidatePath(detailPath(requestId));
  revalidatePath("/admin/call-requests");

  return result;
}

export async function resendCallRequestInvitationAction(
  requestId: string
): Promise<ResendInvitationResult> {
  const access = await getCurrentPlatformAdminAccess();

  if (access.status !== "authorized") {
    return {
      status: "failed",
      errorCode: "forbidden",
      errorMessage: "Acces administrateur requis."
    };
  }

  const result = await resendCallRequestInvitation({
    requestId,
    admin: access.admin
  });

  revalidatePath(detailPath(requestId));
  revalidatePath("/admin/call-requests");

  return result;
}
