"use server";

export type RegisterApprovedClientResult =
  | { status: "success" }
  | { status: "error"; message: string };

export async function registerApprovedClientAction(
  formData?: FormData
): Promise<RegisterApprovedClientResult> {
  void formData;

  return {
    status: "error",
    message:
      "La création de compte public est désactivée. Utilisez le lien d'invitation reçu par courriel ou demandez un nouveau lien."
  };
}
