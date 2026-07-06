"use client";

import Link from "next/link";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";

import {
  CalendarIcon,
  ChevronDownIcon
} from "@/components/dashboard/new-cancellation/new-cancellation-icons";
import type { NewCancellationFormCopy } from "@/components/dashboard/new-cancellation/new-cancellation-copy";
import { createOpeningAction } from "@/lib/dashboard/actions";
import type { DashboardCopy } from "@/lib/i18n/dashboard-copy";
import { cn } from "@/lib/utils/cn";

type Service = {
  id: string;
  name: string;
};

type NewCancellationFormCardProps = {
  copy: NewCancellationFormCopy;
  commonCopy: Pick<DashboardCopy["common"], "service" | "start" | "end">;
  services: Service[];
  error?: string;
  canSendSmsAlerts: boolean;
  excludedCustomerIds: string[];
  smsBlockingReasons: string[];
};

const inputClasses =
  "h-[52px] w-full rounded-xl border border-[#d8e2ef] bg-white px-4 text-sm font-medium text-[#0f172a] shadow-sm outline-none transition placeholder:text-[#94a3b8] focus:border-[#0052ff] focus:ring-4 focus:ring-[#0052ff]/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

const labelClasses = "text-sm font-bold text-[#0f172a]";

export function NewCancellationFormCard({
  copy,
  commonCopy,
  services,
  error,
  canSendSmsAlerts,
  excludedCustomerIds,
  smsBlockingReasons
}: NewCancellationFormCardProps) {
  const [internalNote, setInternalNote] = useState("");
  const noteLength = internalNote.length;
  const noteMax = 500;

  return (
    <section className="rounded-[24px] border border-[#e5edf7] bg-white p-[clamp(1rem,4vw,1.75rem)] shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
      <div className="mb-7 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef5ff] text-[#0052ff]">
          <CalendarIcon />
        </span>
        <h2 className="text-lg font-bold text-[#0f172a]">{copy.detailsTitle}</h2>
      </div>

      {error ? (
        <p
          className="mb-6 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] px-4 py-3 text-sm font-semibold text-[#8a1f17]"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {!canSendSmsAlerts && smsBlockingReasons.length > 0 ? (
        <ul
          className="mb-6 grid gap-2 rounded-xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm font-semibold text-[#92400e]"
          role="alert"
        >
          {smsBlockingReasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <form action={createOpeningAction} className="grid gap-6">
        {excludedCustomerIds.map((customerId) => (
          <input
            key={customerId}
            name="manualExcludedCustomerIds"
            type="hidden"
            value={customerId}
          />
        ))}

        <div className="grid gap-2">
          <label className={labelClasses} htmlFor="title">
            {copy.titleLabel}
            <span className="text-[#dc2626]"> *</span>
          </label>
          <Input id="title" name="title" required />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className={labelClasses} htmlFor="serviceId">
              {commonCopy.service}
            </label>
            <SelectWrapper>
              <select
                className={cn(inputClasses, "appearance-none pr-10")}
                id="serviceId"
                name="serviceId"
              >
                <option value="">{copy.anyService}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </SelectWrapper>
          </div>

          <div className="grid gap-2">
            <label className={labelClasses} htmlFor="startTime">
              {commonCopy.start}
              <span className="text-[#dc2626]"> *</span>
            </label>
            <DateInput id="startTime" name="startTime" required />
          </div>
        </div>

        <div className="grid w-full gap-2 sm:w-1/2">
          <label className={labelClasses} htmlFor="endTime">
            {commonCopy.end}
            <span className="text-[#dc2626]"> *</span>
          </label>
          <DateInput id="endTime" name="endTime" required />
        </div>

        <div className="grid gap-2">
          <label className={labelClasses} htmlFor="offerLabel">
            {copy.offer}
          </label>
          <Input
            id="offerLabel"
            name="offerLabel"
            placeholder={copy.offerPlaceholder}
          />
          <p className="mt-2 text-xs leading-5 text-[#64748b]">{copy.offerHelper}</p>
        </div>

        <div className="grid gap-2">
          <label className={labelClasses} htmlFor="internalNote">
            {copy.internalNote}
          </label>
          <div className="relative">
            <textarea
              className="min-h-[104px] w-full resize-y rounded-xl border border-[#d8e2ef] bg-white px-4 py-3 text-sm font-medium text-[#0f172a] shadow-sm outline-none transition placeholder:text-[#94a3b8] focus:border-[#0052ff] focus:ring-4 focus:ring-[#0052ff]/10"
              id="internalNote"
              maxLength={noteMax}
              name="internalNote"
              onChange={(event) => setInternalNote(event.target.value)}
              value={internalNote}
            />
            <p
              aria-live="polite"
              className="pointer-events-none absolute bottom-3 right-3 text-xs font-medium text-[#94a3b8]"
            >
              {noteLength} / {noteMax}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            className="inline-flex h-12 items-center justify-center rounded-[10px] bg-[#0052ff] px-6 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,82,255,0.24)] transition hover:bg-[#0046db] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052ff] disabled:cursor-not-allowed disabled:opacity-55"
            disabled={!canSendSmsAlerts}
            type="submit"
          >
            {copy.submit}
          </button>
          <Link
            className="inline-flex h-12 items-center justify-center rounded-[10px] px-4 text-sm font-semibold text-[#64748b] transition hover:text-[#334155] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052ff]"
            href="/dashboard/cancellations"
          >
            {copy.cancel}
          </Link>
        </div>
      </form>
    </section>
  );
}

function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

function DateInput({
  id,
  name,
  required
}: {
  id: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <input
        className={cn(
          inputClasses,
          "pr-11 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
        )}
        id={id}
        name={name}
        required={required}
        type="datetime-local"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]">
        <CalendarIcon className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

function SelectWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]">
        <ChevronDownIcon className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}
