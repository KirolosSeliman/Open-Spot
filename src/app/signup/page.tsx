"use server";

import { redirect } from "next/navigation";

import { getRequestLocale } from "@/lib/i18n/locale";
import { redirectAuthenticatedUserByWorkspace } from "@/lib/organization/current";

const inviteOnlyCopy = {
  fr: "Les comptes sont crees sur invitation.",
  en: "Accounts are created by invitation only."
} as const;

export default async function SignupPage() {
  await redirectAuthenticatedUserByWorkspace();
  const locale = await getRequestLocale();
  redirect(`/sign-in?notice=${encodeURIComponent(inviteOnlyCopy[locale])}`);
}
