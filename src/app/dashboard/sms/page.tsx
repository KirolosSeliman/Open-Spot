import { redirect } from "next/navigation";

export default function SmsPage() {
  redirect("/dashboard/messages");
}
