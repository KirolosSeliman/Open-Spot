"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { OpeningStatusBadge } from "@/components/dashboard/opening-status-badge";
import {
  formatOpeningCurrency,
  formatOpeningDateTime
} from "@/lib/dashboard/format-opening-datetime";
import type { OpeningView } from "@/lib/dashboard/operations-data";
import { getOpeningStatusBadgePresentation } from "@/lib/dashboard/opening-status-badge";
import type { Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils/cn";

type HistoryCopy = {
  tableTitle: string;
  columns: {
    title: string;
    start: string;
    end: string;
    status: string;
    estimatedValue: string;
    actions: string;
  };
  pagination: {
    showing: string;
    resultsPerPage: string;
    range: (start: number, end: number, total: number) => string;
    previousPage: string;
    nextPage: string;
    pageSizeLabel: string;
  };
  empty: {
    title: string;
    description: string;
  };
  rowActions: {
    viewDetails: string;
    menuLabel: string;
  };
};

type CancellationsHistoryTableProps = {
  openings: OpeningView[];
  locale: Locale;
  copy: HistoryCopy;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

function HistoryRowActionsMenu({
  openingId,
  copy
}: {
  openingId: string;
  copy: HistoryCopy["rowActions"];
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        buttonRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const menuWidth = 196;

    setMenuStyle({
      top: rect.bottom + 8,
      left: Math.max(12, rect.right - menuWidth)
    });
  }, [open]);

  const actionMenu =
    mounted && open
      ? createPortal(
          <div
            className="fixed z-[120] min-w-[12.25rem] overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-[0_18px_45px_rgba(15,23,42,0.12)]"
            ref={menuRef}
            style={{ top: menuStyle.top, left: menuStyle.left }}
          >
            <Link
              className="flex min-h-10 items-center px-4 text-sm font-semibold text-[#07142f] transition hover:bg-[#f8fafc]"
              href={`/dashboard/cancellations/${openingId}`}
              onClick={() => setOpen(false)}
            >
              {copy.viewDetails}
            </Link>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={copy.menuLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#07142f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
      </button>
      {actionMenu}
    </>
  );
}

function HistoryPagination({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  copy
}: {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  copy: HistoryCopy["pagination"];
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col gap-4 border-t border-[#e2e8f0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex flex-wrap items-center gap-2 text-sm text-[#64748b]">
        <span>{copy.showing}</span>
        <label className="inline-flex items-center">
          <span className="sr-only">{copy.pageSizeLabel}</span>
          <select
            className="h-8 min-w-[3.25rem] appearance-none rounded-full border border-[#e2e8f0] bg-white px-3 pr-7 text-sm font-semibold text-[#07142f] shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-visible:border-[#2563ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff]/20"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <span>{copy.resultsPerPage}</span>
      </div>

      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
        <span className="text-sm font-medium text-[#64748b]">
          {copy.range(start, end, totalCount)}
        </span>
        <button
          aria-label={copy.previousPage}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition hover:bg-[#f8fafc] disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          ‹
        </button>
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-2.5 text-sm font-bold text-[#2563eb]">
          {currentPage}
        </span>
        <button
          aria-label={copy.nextPage}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition hover:bg-[#f8fafc] disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function CancellationsHistoryTable({
  openings,
  locale,
  copy
}: CancellationsHistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const totalPages = Math.max(1, Math.ceil(openings.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedOpenings = useMemo(
    () =>
      openings.slice((safePage - 1) * pageSize, safePage * pageSize),
    [openings, pageSize, safePage]
  );

  if (openings.length === 0) {
    return (
      <section className="rounded-[2rem] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
        <h2 className="text-lg font-black text-[#071026]">{copy.tableTitle}</h2>
        <div className="mt-5 rounded-[1.25rem] border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-6 py-10 text-center">
          <h3 className="text-base font-black text-[#071026]">{copy.empty.title}</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748b]">
            {copy.empty.description}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
      <h2 className="text-lg font-black text-[#071026]">{copy.tableTitle}</h2>

      <div className="mt-5 overflow-hidden rounded-[1.25rem] border border-[#e2e8f0] bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#e2e8f0] bg-white">
                {[
                  copy.columns.title,
                  copy.columns.start,
                  copy.columns.end,
                  copy.columns.status,
                  copy.columns.estimatedValue,
                  copy.columns.actions
                ].map((label, index) => (
                  <th
                    className={cn(
                      "px-5 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#94a3b8]",
                      index === 5 ? "w-14 text-right" : ""
                    )}
                    key={label}
                    scope="col"
                  >
                    {index === 5 ? (
                      <span className="sr-only">{label}</span>
                    ) : (
                      label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedOpenings.map((opening) => {
                const statusPresentation = getOpeningStatusBadgePresentation(
                  opening.status,
                  locale
                );

                return (
                  <tr
                    className="border-b border-[#e2e8f0] last:border-b-0"
                    key={opening.id}
                  >
                    <td className="px-5 py-5 align-middle">
                      <Link
                        className="font-bold text-[#071026] underline-offset-4 transition hover:text-[#2563ff] hover:underline"
                        href={`/dashboard/cancellations/${opening.id}`}
                      >
                        {opening.title}
                      </Link>
                    </td>
                    <td className="px-5 py-5 align-middle text-[#475569]">
                      {formatOpeningDateTime(opening.start_time)}
                    </td>
                    <td className="px-5 py-5 align-middle text-[#475569]">
                      {formatOpeningDateTime(opening.end_time)}
                    </td>
                    <td className="px-5 py-5 align-middle">
                      <OpeningStatusBadge presentation={statusPresentation} />
                    </td>
                    <td className="px-5 py-5 align-middle font-medium text-[#071026]">
                      {formatOpeningCurrency(opening.displayValueCents, locale)}
                    </td>
                    <td className="px-5 py-5 align-middle text-right">
                      <HistoryRowActionsMenu
                        copy={copy.rowActions}
                        openingId={opening.id}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <HistoryPagination
          copy={copy.pagination}
          currentPage={safePage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSize={pageSize}
          totalCount={openings.length}
        />
      </div>
    </section>
  );
}
