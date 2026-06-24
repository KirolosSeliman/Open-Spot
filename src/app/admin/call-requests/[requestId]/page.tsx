import { notFound } from "next/navigation";

import { CallRequestDetailView } from "@/components/admin/call-request-detail-view";
import { loadCallRequestDetail } from "@/lib/book-call/conversion";
import { requireCurrentPlatformAdmin } from "@/lib/auth/platform-admin";

type CallRequestDetailPageProps = {
  params: Promise<{ requestId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(
  value: string | string[] | undefined,
  fallback = ""
) {
  return Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;
}

export default async function CallRequestDetailPage({
  params,
  searchParams
}: CallRequestDetailPageProps) {
  await requireCurrentPlatformAdmin();

  const { requestId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const notice = firstParam(resolvedSearchParams.notice);
  const errorMessage = firstParam(resolvedSearchParams.error);

  const detail = await loadCallRequestDetail(requestId);

  if (!detail) {
    notFound();
  }

  return (
    <CallRequestDetailView
      errorMessage={errorMessage}
      notice={notice}
      request={detail.request}
    />
  );
}
