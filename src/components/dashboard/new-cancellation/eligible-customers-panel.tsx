"use client";

import { useMemo, useState } from "react";

import {
  CheckCircleIcon,
  ChevronRightIcon,
  SearchIcon,
  UsersIcon
} from "@/components/dashboard/new-cancellation/new-cancellation-icons";
import {
  formatEligibleClientCount,
  formatEligibleCountFooter,
  type EligibleCustomersCopy
} from "@/components/dashboard/new-cancellation/new-cancellation-copy";
import type { Locale } from "@/lib/i18n/types";

type EligibleCustomer = {
  id: string;
  full_name: string;
  phone_e164: string;
};

type EligibleCustomersPanelProps = {
  copy: EligibleCustomersCopy;
  customers: EligibleCustomer[];
  excludedCustomerIds: string[];
  locale: Locale;
  onToggleExcludedCustomer: (customerId: string) => void;
};

export function EligibleCustomersPanel({
  copy,
  customers,
  excludedCustomerIds,
  locale,
  onToggleExcludedCustomer
}: EligibleCustomersPanelProps) {
  const [query, setQuery] = useState("");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredCustomers = useMemo(() => {
    if (!normalizedQuery) {
      return customers;
    }

    return customers.filter((customer) => {
      const haystack = `${customer.full_name} ${customer.phone_e164}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [customers, normalizedQuery]);

  const totalCount = customers.length;
  const excludedCustomerIdSet = new Set(excludedCustomerIds);
  const excludedCount = customers.filter((customer) =>
    excludedCustomerIdSet.has(customer.id)
  ).length;
  const selectedCount = Math.max(totalCount - excludedCount, 0);

  return (
    <section className="flex h-full flex-col rounded-[24px] border border-[#e5edf7] bg-white p-[clamp(1rem,4vw,1.75rem)] shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5ff] text-[#0052ff]">
            <UsersIcon />
          </span>
          <h2 className="text-lg font-bold text-[#0f172a]">
            {copy.eligibleCustomers}
          </h2>
        </div>
        <span className="inline-flex shrink-0 rounded-full bg-[#f1f5f9] px-3 py-1 text-xs font-bold text-[#64748b]">
          {formatEligibleClientCount(selectedCount, locale)}
        </span>
      </div>

      {totalCount > 0 ? (
        <p className="-mt-2 mb-5 text-xs leading-5 text-[#64748b]">
          {locale === "fr"
            ? "Présélection SMS : consentement actif, numéro utilisable et liste d'attente active. Les protections avancées seront recalculées après la création du créneau."
            : "SMS preselection: active consent, usable phone, and active waitlist. Smart SMS advanced protections will be recalculated after the opening is created."}
        </p>
      ) : null}

      <div className="relative mb-5">
        <label className="sr-only" htmlFor="eligible-customer-search">
          {copy.searchPlaceholder}
        </label>
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8]">
          <SearchIcon />
        </span>
        <input
          className="h-[52px] w-full rounded-xl border border-[#d8e2ef] bg-white py-2.5 pl-11 pr-4 text-sm font-medium text-[#0f172a] shadow-sm outline-none transition placeholder:text-[#94a3b8] focus:border-[#0052ff] focus:ring-4 focus:ring-[#0052ff]/10"
          id="eligible-customer-search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.searchPlaceholder}
          type="search"
          value={query}
        />
      </div>

      {totalCount === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center rounded-2xl border border-dashed border-[#e5edf7] bg-[#f8fafc] px-5 py-10">
          <p className="text-base font-bold text-[#0f172a]">
            {copy.emptyEligibleTitle}
          </p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#64748b]">
            {copy.emptyEligibleDescription}
          </p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="flex flex-1 flex-col items-start justify-center rounded-2xl border border-[#e5edf7] bg-[#f8fafc] px-5 py-10">
          <p className="text-sm font-semibold text-[#64748b]">
            {copy.searchPlaceholder}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[#e5edf7]">
          <ul className="divide-y divide-[#e5edf7]">
            {filteredCustomers.map((customer) => {
              const isExpanded = expandedCustomerId === customer.id;
              const isExcluded = excludedCustomerIdSet.has(customer.id);

              return (
                <li key={customer.id}>
                  <button
                    aria-expanded={isExpanded}
                    className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0052ff] sm:px-5"
                    onClick={() =>
                      setExpandedCustomerId(isExpanded ? null : customer.id)
                    }
                    type="button"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#0f172a]">
                        {customer.full_name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-[#64748b]">
                        {customer.phone_e164}
                      </p>
                    </div>
                    <span
                      className={
                        isExcluded
                          ? "inline-flex shrink-0 rounded-full bg-[#fff7ed] px-2.5 py-1 text-xs font-bold text-[#9a3412]"
                          : "inline-flex shrink-0 rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-bold text-[#027a48]"
                      }
                    >
                      {isExcluded
                        ? locale === "fr"
                          ? "Retiré"
                          : "Removed"
                        : copy.smsAuthorized}
                    </span>
                    <ChevronRightIcon
                      className={`h-[18px] w-[18px] shrink-0 text-[#94a3b8] transition ${isExpanded ? "rotate-90" : ""}`}
                    />
                  </button>
                  {isExpanded ? (
                    <div className="grid gap-3 border-t border-[#e5edf7] bg-[#f8fafc] px-4 py-4 sm:px-5">
                      <div>
                        <p className="text-sm font-bold text-[#0f172a]">
                          {locale === "fr"
                            ? "Pourquoi admissible"
                            : "Why eligible"}
                        </p>
                        <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-[#64748b]">
                          <li>
                            {locale === "fr"
                              ? "Consentement SMS actif."
                              : "Active SMS consent."}
                          </li>
                          <li>
                            {locale === "fr"
                              ? "Numéro de téléphone utilisable."
                              : "Usable phone number."}
                          </li>
                          <li>
                            {locale === "fr"
                              ? "Client présent dans la liste d'attente active."
                              : "Customer is on the active waitlist."}
                          </li>
                        </ul>
                        <p className="mt-2 text-xs leading-5 text-[#64748b]">
                          {locale === "fr"
                            ? "Le Mode intelligent SMS recalculera aussi les protections avancées après la création du créneau."
                            : "Smart SMS mode will also recalculate advanced protections after the opening is created."}
                        </p>
                      </div>
                      <button
                        className={
                          isExcluded
                            ? "inline-flex w-fit items-center justify-center rounded-[10px] border border-[#0052ff] bg-white px-3 py-2 text-xs font-bold text-[#0052ff] transition hover:bg-[#eef5ff]"
                            : "inline-flex w-fit items-center justify-center rounded-[10px] border border-[#fed7aa] bg-white px-3 py-2 text-xs font-bold text-[#9a3412] transition hover:bg-[#fff7ed]"
                        }
                        onClick={() => onToggleExcludedCustomer(customer.id)}
                        type="button"
                      >
                        {isExcluded
                          ? locale === "fr"
                            ? "Remettre dans l'envoi"
                            : "Add back to this send"
                          : locale === "fr"
                            ? "Retirer de cet envoi"
                            : "Remove from this send"}
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 rounded-[14px] border border-[#e5edf7] bg-[#f8fafc] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5 text-sm text-[#64748b]">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#eef5ff] text-[#0052ff]">
            <CheckCircleIcon className="h-4 w-4" />
          </span>
          <span className="font-medium">{copy.criterion}</span>
        </div>
        <span className="text-sm font-bold text-[#334155]">
          {formatEligibleCountFooter(selectedCount, locale)}
          {excludedCount > 0
            ? locale === "fr"
              ? ` (${excludedCount} retiré${excludedCount === 1 ? "" : "s"})`
              : ` (${excludedCount} removed)`
            : ""}
        </span>
      </div>
    </section>
  );
}
