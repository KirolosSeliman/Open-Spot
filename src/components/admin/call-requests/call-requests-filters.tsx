"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  CalendarIcon,
  ChevronDownIcon,
  SearchIcon
} from "@/components/admin/call-requests/call-requests-icons";
import type { BookCallRequestDateRange } from "@/lib/book-call/admin";
import { bookCallRequestStatuses } from "@/lib/book-call/validation";

const statusLabels = {
  new: "Nouveau",
  contacted: "Contactée",
  qualified: "Qualifiée",
  closed: "Fermée",
  spam: "Spam",
  converted: "Converti"
} as const;

const rangeOptions: Array<{ value: BookCallRequestDateRange; label: string }> = [
  { value: "7", label: "Derniers 7 jours" },
  { value: "30", label: "Derniers 30 jours" },
  { value: "90", label: "Derniers 90 jours" },
  { value: "all", label: "Toutes les dates" }
];

export function CallRequestsFilters({
  q,
  status,
  range
}: {
  q: string;
  status: string;
  range: BookCallRequestDateRange;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();

    const nextQ = String(formData.get("q") ?? "").trim();
    const nextStatus = String(formData.get("status") ?? "all");
    const nextRange = String(formData.get("range") ?? "30");

    if (nextQ) {
      params.set("q", nextQ);
    }

    if (nextStatus && nextStatus !== "all") {
      params.set("status", nextStatus);
    }

    if (nextRange && nextRange !== "30") {
      params.set("range", nextRange);
    }

    const query = params.toString();

    startTransition(() => {
      router.push(query ? `/admin/call-requests?${query}` : "/admin/call-requests");
    });
  }

  return (
    <form
      action={applyFilters}
      className="flex flex-col gap-3 border-b border-[#e3eaf5] pb-5 lg:flex-row lg:items-center"
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">
          Rechercher un nom, commerce, email, téléphone
        </span>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#94a3b8]" />
          <input
            className="h-11 w-full rounded-xl border border-[#e3eaf5] bg-white pl-10 pr-4 text-sm text-[#0b1328] outline-none transition placeholder:text-[#94a3b8] focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10 disabled:opacity-60"
            defaultValue={q}
            disabled={isPending}
            name="q"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Rechercher un nom, commerce, email, téléphone..."
            type="search"
          />
        </div>
      </label>

      <label className="relative min-w-[180px]">
        <span className="sr-only">Filtrer par statut</span>
        <select
          className="h-11 w-full appearance-none rounded-xl border border-[#e3eaf5] bg-white px-3.5 pr-9 text-sm font-medium text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10 disabled:opacity-60"
          defaultValue={status}
          disabled={isPending}
          name="status"
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
        >
          <option value="all">Tous les statuts</option>
          {bookCallRequestStatuses.map((requestStatus) => (
            <option key={requestStatus} value={requestStatus}>
              {statusLabels[requestStatus]}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
      </label>

      <label className="relative min-w-[190px]">
        <span className="sr-only">Filtrer par période</span>
        <CalendarIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
        <select
          className="h-11 w-full appearance-none rounded-xl border border-[#e3eaf5] bg-white pl-9 pr-9 text-sm font-medium text-[#0b1328] outline-none transition focus:border-[#2563ff] focus:ring-2 focus:ring-[#2563ff]/10 disabled:opacity-60"
          defaultValue={range}
          disabled={isPending}
          name="range"
          onChange={(event) => {
            event.currentTarget.form?.requestSubmit();
          }}
        >
          {rangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]" />
      </label>

      <button className="sr-only" type="submit">
        Filtrer
      </button>
    </form>
  );
}
