"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";
import {
  validatePotentialClientNotes,
  validatePotentialClientStatus,
  type PotentialClientContactChannel
} from "@/lib/potential-clients/validation";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

function redirectWithAdminLeadMessage(key: "error" | "notice", message: string): never {
  redirect(`/admin/potential-clients?${key}=${encodeURIComponent(message)}`);
}

async function requirePotentialClientAdminWrite() {
  const access = await requireCurrentPlatformAdmin();

  if (access.status !== "authorized") {
    redirectWithAdminLeadMessage("error", "Potential clients are available to platform admins only.");
  }

  const supabase = createSupabaseServiceClient();

  if (!supabase) {
    redirectWithAdminLeadMessage("error", "Supabase service access is not configured.");
  }

  return supabase;
}

export async function updatePotentialClientAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "").trim();
  const status = validatePotentialClientStatus(formData.get("status"));
  const notes = validatePotentialClientNotes(formData.get("notes"));

  if (!leadId) {
    redirectWithAdminLeadMessage("error", "Lead id is required.");
  }

  if (!status) {
    redirectWithAdminLeadMessage("error", "Choose a valid lead status.");
  }

  if (notes === null && String(formData.get("notes") ?? "").trim().length > 2000) {
    redirectWithAdminLeadMessage("error", "Notes must be 2000 characters or fewer.");
  }

  const supabase = await requirePotentialClientAdminWrite();
  const { error } = await supabase
    .from("potential_clients")
    .update({
      status,
      notes
    })
    .eq("id", leadId);

  if (error) {
    redirectWithAdminLeadMessage("error", error.message);
  }

  revalidatePath("/admin/potential-clients");
  redirectWithAdminLeadMessage("notice", "Potential client updated.");
}

export async function markPotentialClientContactedAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim() as PotentialClientContactChannel;

  if (!leadId) {
    redirectWithAdminLeadMessage("error", "Lead id is required.");
  }

  if (!["sms", "email", "phone", "other"].includes(channel)) {
    redirectWithAdminLeadMessage("error", "Choose a valid contact channel.");
  }

  const supabase = await requirePotentialClientAdminWrite();
  const { error } = await supabase
    .from("potential_clients")
    .update({
      status: "contacted",
      last_contact_channel: channel,
      last_contacted_at: new Date().toISOString()
    })
    .eq("id", leadId);

  if (error) {
    redirectWithAdminLeadMessage("error", error.message);
  }

  revalidatePath("/admin/potential-clients");
  redirectWithAdminLeadMessage("notice", "Lead marked as contacted.");
}

export async function archivePotentialClientAction(formData: FormData) {
  const leadId = String(formData.get("leadId") ?? "").trim();

  if (!leadId) {
    redirectWithAdminLeadMessage("error", "Lead id is required.");
  }

  const supabase = await requirePotentialClientAdminWrite();
  const { error } = await supabase
    .from("potential_clients")
    .update({
      status: "archived"
    })
    .eq("id", leadId);

  if (error) {
    redirectWithAdminLeadMessage("error", error.message);
  }

  revalidatePath("/admin/potential-clients");
  redirectWithAdminLeadMessage("notice", "Lead archived.");
}
