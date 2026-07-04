import { redirect } from "next/navigation";

import { privatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata = privatePageMetadata;

export default function DashboardPreviewPage() {
  redirect("/dashboard");
}
