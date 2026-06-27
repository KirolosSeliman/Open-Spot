"use client";

import { useMemo, useState } from "react";

import {
  CheckCircleIcon,
  ChevronRightIcon,
  SearchIcon,
  UsersIcon
} from "@/components/dashboard/new-cancellation/new-cancellation-icons";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";

type EligibleCustomer = {
  id: string;
  full_name: string;
  phone_e164: string;
};

type EligibleCustomersPanelProps = {
  copy: DashboardCopy["newCancellation"];
  customers: EligibleCustomer[];
};

export function EligibleCustomersPanel({
  copy,
  customers
}: EligibleCustomersPanelProps) {
  const [query, setQuery] = useState("");
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

  return (
    <section className="flex h-full flex-col rounded-[24px] border border-[#e5edf7] bg-white p-7 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
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
          {copy.clientCount(totalCount)}
        </span>
      </div>

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
            {filteredCustomers.map((customer) => (
              <li key={customer.id}>
                <div className="flex items-center gap-3 px-4 py-4 sm:px-5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#0f172a]">
                      {customer.full_name}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-[#64748b]">
                      {customer.phone_e164}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 rounded-full bg-[#ecfdf3] px-2.5 py-1 text-xs font-bold text-[#027a48]">
                    {copy.smsAuthorized}
                  </span>
                  <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-[#94a3b8]" />
                </div>
              </li>
            ))}
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
          {copy.eligibleCountFooter(totalCount)}
        </span>
      </div>
    </section>
  );
}
