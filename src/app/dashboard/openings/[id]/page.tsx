import { redirect } from "next/navigation";

type OpeningDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OpeningDetailPage({
  params
}: OpeningDetailPageProps) {
  const { id } = await params;
  redirect(`/dashboard/cancellations/${id}`);
}
