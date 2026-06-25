"use server";

import { createApprovedClientAccount } from "@/lib/auth/approved-client-account";

export type RegisterApprovedClientResult =
  | { status: "success" }
  | { status: "error"; message: string };

export async function registerApprovedClientAction(
  formData: FormData
): Promise<RegisterApprovedClientResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  return createApprovedClientAccount({
    email,
    password,
    confirmPassword
  });
}
