import Link from "next/link";

import type { BookCallRequestRow } from "@/lib/admin/call-requests";
import { isConversionComplete } from "@/lib/book-call/conversion-types";

export function BusinessNameLink({ request }: { request: BookCallRequestRow }) {
  const converted = isConversionComplete(request);

  return (
    <div className="grid gap-1">
      <Link
        aria-label={`Ouvrir la demande de ${request.business_name}`}
        className="inline-flex items-center gap-1 font-black text-[var(--primary)] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
        href={`/admin/call-requests/${request.id}`}
      >
        {request.business_name}
        <span aria-hidden="true">→</span>
      </Link>
      {converted && request.organization_id ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-700">
            Client
          </span>
          <Link
            className="text-xs font-black text-[var(--primary)] underline-offset-4 hover:underline"
            href={`/admin/organizations/${request.organization_id}`}
          >
            Voir le client
          </Link>
        </div>
      ) : null}
    </div>
  );
}
