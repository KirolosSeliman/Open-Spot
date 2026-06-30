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
      "La creation de compte public est desactivee. Utilisez le lien d'invitation recu par email ou demandez un nouveau lien."
  };
}
