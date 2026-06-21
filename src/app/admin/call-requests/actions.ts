"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  validateBookCallInternalNotes,
  validateBookCallRequestStatus
} from "@/lib/book-call/validation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function redirectWithCallRequestMessage(
  key: "error" | "notice",
  message: string
): never {
  redirect(`/admin/call-requests?${key}=${encodeURIComponent(message)}`);
}

async function requireCallRequestAdminWrite() {
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    redirectWithCallRequestMessage(
      "error",
      "Call requests are available to platform admins only."
    );
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    redirectWithCallRequestMessage(
      "error",
      "Supabase service access is not configured."
    );
  }

  return supabase;
}

export async function updateBookCallRequestAction(formData: FormData) {
  const requestId = String(formData.get("requestId") ?? "").trim();
  const status = validateBookCallRequestStatus(formData.get("status"));
  const notes = validateBookCallInternalNotes(formData.get("internalNotes"));
  const rawNotes = String(formData.get("internalNotes") ?? "").trim();

  if (!requestId) {
    redirectWithCallRequestMessage("error", "Request id is required.");
  }

  if (!status) {
    redirectWithCallRequestMessage("error", "Choose a valid call request status.");
  }

  if (notes === null && rawNotes.length > 2000) {
    redirectWithCallRequestMessage(
      "error",
      "Internal notes must be 2000 characters or fewer."
    );
  }

  const supabase = await requireCallRequestAdminWrite();
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
    redirectWithCallRequestMessage("error", error.message);
  }

  revalidatePath("/admin/call-requests");
  redirectWithCallRequestMessage("notice", "Call request updated.");
}
