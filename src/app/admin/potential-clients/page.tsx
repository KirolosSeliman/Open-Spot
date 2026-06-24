import { redirect } from "next/navigation";

export default function LegacyPotentialClientsPage() {
  redirect("/admin/call-requests");
}
