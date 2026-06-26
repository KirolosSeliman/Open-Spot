"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PhoneNumberField } from "@/components/forms/phone-number-field";
import {
  createCustomerAction,
  deleteCustomerAction,
  restoreCustomerAction
} from "@/lib/dashboard/actions";
import type { CustomerWithConsent } from "@/lib/dashboard/operations-data";
import type { ServiceRow } from "@/lib/dashboard/operations-data";
import {
  formatInternationalPhoneForDisplay,
  formatNorthAmericanPhoneForDisplay
} from "@/lib/customers/phone-format";
import { cn } from "@/lib/utils/cn";

export type ClientRow = CustomerWithConsent & {
  serviceInterestNames: string[];
};

type ClientsTab = "active" | "deleted";

type ClientFilters = {
  search: string;
  language: string;
  consent: string;
  serviceId: string;
  status: string;
};

type ClientsPageContentProps = {
  customers: ClientRow[];
  services: ServiceRow[];
  tab: ClientsTab;
  notices: {
    error?: string;
    message?: string;
    notice?: string;
    warning?: string;
  };
};

const PAGE_SIZE_OPTIONS = [7, 10, 25, 50] as const;

function formatPhoneForDisplay(phoneE164: string) {
  if (phoneE164.startsWith("+1") && phoneE164.length >= 12) {
    const national = phoneE164.slice(2);
    const formatted = formatNorthAmericanPhoneForDisplay(national);
    const area = formatted.slice(0, 3);
    const rest = formatted.slice(4);
    return `+1 (${area}) ${rest}`;
  }

  return phoneE164.startsWith("+")
    ? phoneE164.replace(
        /^(\+\d{1,3})(\d+)/,
        (_, code, digits) =>
          `${code} ${formatInternationalPhoneForDisplay(digits)}`
      )
    : phoneE164;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function formatConsentStatus(status: string | null | undefined) {
  const labels: Record<string, string> = {
    missing: "Consentement requis",
    needs_consent: "Consentement requis",
    opted_in: "Consentement",
    opted_out: "Désinscrit"
  };

  return labels[status ?? ""] ?? "Consentement requis";
}

function formatConsentRequestStatus(status: string | null | undefined) {
  if (!status) {
    return null;
  }

  const labels: Record<string, string> = {
    pending: "En préparation",
    sent: "Envoyée",
    accepted: "Acceptée",
    declined: "Refusée",
    failed: "Échec",
    expired: "Expirée"
  };

  return labels[status] ?? status;
}

function formatDeletedAt(value: string | null) {
  if (!value) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatLastActivity(value: string) {
  const date = new Date(value);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const time = new Intl.DateTimeFormat("fr-CA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  if (date >= startOfToday) {
    return `Aujourd’hui, ${time}`;
  }

  if (date >= startOfYesterday) {
    return `Hier, ${time}`;
  }

  return new Intl.DateTimeFormat("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function getClientStatus(customer: ClientRow) {
  if (customer.consentStatus === "opted_out") {
    return "inactif" as const;
  }

  if (
    customer.consentStatus === "needs_consent" ||
    customer.consentStatus === "missing" ||
    customer.latestConsentRequestStatus === "sent" ||
    customer.latestConsentRequestStatus === "pending"
  ) {
    return "en_attente" as const;
  }

  return "actif" as const;
}

function getStatusLabel(status: ReturnType<typeof getClientStatus>) {
  const labels = {
    actif: "Actif",
    en_attente: "En attente",
    inactif: "Inactif"
  };

  return labels[status];
}

function getStatusDotClass(status: ReturnType<typeof getClientStatus>) {
  const classes = {
    actif: "bg-[#22c55e]",
    en_attente: "bg-[#f59e0b]",
    inactif: "bg-[#94a3b8]"
  };

  return classes[status];
}

function getConsentBadgeClass(status: string) {
  if (status === "opted_in") {
    return "border-[#bbf7d0] bg-[#ecfdf3] text-[#15803d]";
  }

  if (status === "opted_out") {
    return "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]";
  }

  return "border-[#fde68a] bg-[#fffbeb] text-[#b45309]";
}

function getConsentIcon(status: string) {
  if (status === "opted_in") {
    return "✓";
  }

  if (status === "opted_out") {
    return "✕";
  }

  return "◷";
}

function FilterSelect({
  label,
  onChange,
  options,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="truncate text-xs font-semibold text-[#64748b]">{label}</span>
      <select
        className="h-11 w-full min-w-0 truncate rounded-full border border-[#e2e8f0] bg-white px-3 text-sm text-[#07142f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ClientNotice({
  error,
  message,
  notice,
  warning
}: ClientsPageContentProps["notices"]) {
  return (
    <>
      {message || notice ? (
        <p className="rounded-2xl border border-[#bbf7d0] bg-[#ecfdf3] px-4 py-3 text-sm font-semibold text-[#15803d]">
          {message ?? notice}
        </p>
      ) : null}
      {warning ? (
        <p className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm font-semibold text-[#b45309]">
          {warning}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-semibold text-[#b91c1c]">
          {error}
        </p>
      ) : null}
    </>
  );
}

function ServiceInterestIcons({ names }: { names: string[] }) {
  if (names.length === 0) {
    return (
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] text-xs font-bold text-[#64748b]">
        •
      </span>
    );
  }

  const visible = names.slice(0, 2);
  const overflow = names.length - visible.length;

  return (
    <div className="flex items-center gap-1">
      {visible.map((name) => (
        <span
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f8fafc] text-[10px] font-bold uppercase text-[#64748b]"
          key={name}
          title={name}
        >
          {name.slice(0, 1)}
        </span>
      ))}
      {overflow > 0 ? (
        <span className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] px-1.5 text-[10px] font-bold text-[#2563ff]">
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}

function ClientActionsMenu({
  customer,
  tab
}: {
  customer: ClientRow;
  tab: ClientsTab;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Actions pour ${customer.full_name}`}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#07142f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 4a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
      </button>
      {open ? (
        <>
          <button
            aria-label="Fermer le menu"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white py-1 shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
            role="menu"
          >
            <Link
              className="block px-4 py-2.5 text-sm font-semibold text-[#07142f] hover:bg-[#f8fafc]"
              href={`/dashboard/clients/${customer.id}/edit`}
              onClick={() => setOpen(false)}
              role="menuitem"
            >
              {tab === "deleted" ? "Voir le client" : "Modifier"}
            </Link>
            {tab === "active" ? (
              <details className="group">
                <summary className="cursor-pointer px-4 py-2.5 text-sm font-semibold text-[#b91c1c] hover:bg-[#fef2f2]">
                  Supprimer
                </summary>
                <form
                  action={deleteCustomerAction}
                  className="border-t border-[#fecaca] bg-[#fef2f2] p-3"
                >
                  <input name="customerId" type="hidden" value={customer.id} />
                  <input
                    name="returnTo"
                    type="hidden"
                    value="/dashboard/clients?tab=active"
                  />
                  <p className="mb-3 text-xs leading-5 text-[#991b1b]">
                    Cette action retire le client des listes actives et des futurs
                    SMS. L&apos;historique reste conservé.
                  </p>
                  <label className="mb-3 grid gap-1 text-xs font-semibold text-[#991b1b]">
                    Raison
                    <input
                      className="min-h-9 rounded-lg border border-[#fecaca] bg-white px-3 text-[#07142f]"
                      maxLength={500}
                      minLength={3}
                      name="reason"
                      required
                    />
                  </label>
                  <label className="mb-3 flex gap-2 text-xs font-semibold leading-5 text-[#991b1b]">
                    <input name="confirm" required type="checkbox" />
                    Je comprends que ce client ne recevra plus de SMS.
                  </label>
                  <button
                    className="w-full rounded-lg bg-[#b91c1c] px-3 py-2 text-xs font-bold text-white"
                    type="submit"
                  >
                    Confirmer la suppression
                  </button>
                </form>
              </details>
            ) : (
              <form action={restoreCustomerAction} className="px-1 pb-1">
                <input name="customerId" type="hidden" value={customer.id} />
                <input
                  name="returnTo"
                  type="hidden"
                  value="/dashboard/clients?tab=deleted"
                />
                <button
                  className="block w-full rounded-lg px-4 py-2.5 text-left text-sm font-semibold text-[#2563ff] hover:bg-[#eef4ff]"
                  type="submit"
                >
                  Restaurer
                </button>
              </form>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

function PaginationControls({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange
}: {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);

  const pageNumbers = useMemo(() => {
    const pages: Array<number | "ellipsis"> = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push("ellipsis");
    }

    const rangeStart = Math.max(2, currentPage - 1);
    const rangeEnd = Math.min(totalPages - 1, currentPage + 1);

    for (let page = rangeStart; page <= rangeEnd; page += 1) {
      pages.push(page);
    }

    if (currentPage < totalPages - 2) {
      pages.push("ellipsis");
    }

    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col gap-3 border-t border-[#e2e8f0] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="shrink-0 text-sm text-[#64748b]">
        Affichage de {start} à {end} sur {totalCount} client
        {totalCount > 1 ? "s" : ""}
      </p>
      <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:justify-end">
        <button
          aria-label="Page précédente"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition hover:bg-[#f8fafc] disabled:opacity-40"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          type="button"
        >
          ‹
        </button>
        {pageNumbers.map((page, index) =>
          page === "ellipsis" ? (
            <span className="px-1 text-sm text-[#94a3b8]" key={`ellipsis-${index}`}>
              …
            </span>
          ) : (
            <button
              aria-current={page === currentPage ? "page" : undefined}
              className={cn(
                "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition",
                page === currentPage
                  ? "border-[#2563ff] bg-[#2563ff] text-white"
                  : "border-[#e2e8f0] bg-white text-[#64748b] hover:bg-[#f8fafc]"
              )}
              key={page}
              onClick={() => onPageChange(page)}
              type="button"
            >
              {page}
            </button>
          )
        )}
        <button
          aria-label="Page suivante"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b] transition hover:bg-[#f8fafc] disabled:opacity-40"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          type="button"
        >
          ›
        </button>
        <label className="ml-1 flex shrink-0 items-center gap-2 text-sm text-[#64748b]">
          <span className="sr-only">Nombre de lignes par page</span>
          <select
            className="h-9 max-w-[7.5rem] rounded-full border border-[#e2e8f0] bg-white px-2 text-sm font-semibold text-[#07142f]"
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} / page
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function ClientsPageContent({
  customers,
  services,
  tab,
  notices
}: ClientsPageContentProps) {
  const [filters, setFilters] = useState<ClientFilters>({
    search: "",
    language: "",
    consent: "",
    serviceId: "",
    status: ""
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const serviceFilterOptions = useMemo(() => {
    const names = new Set<string>();

    for (const customer of customers) {
      for (const name of customer.serviceInterestNames) {
        names.add(name);
      }
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const query = filters.search.trim().toLowerCase();

      if (query) {
        const haystack = [
          customer.full_name,
          customer.phone_e164,
          customer.email ?? ""
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      if (filters.language && customer.preferred_language !== filters.language) {
        return false;
      }

      if (filters.consent) {
        const consentValue =
          customer.consentStatus === "missing"
            ? "needs_consent"
            : customer.consentStatus;

        if (consentValue !== filters.consent) {
          return false;
        }
      }

      if (filters.serviceId) {
        if (filters.serviceId === "__general__") {
          if (customer.serviceInterestNames.length > 0) {
            return false;
          }
        } else if (!customer.serviceInterestNames.includes(filters.serviceId)) {
          return false;
        }
      }

      if (filters.status && getClientStatus(customer) !== filters.status) {
        return false;
      }

      return true;
    });
  }, [customers, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCustomers = filteredCustomers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  function updateFilter<K extends keyof ClientFilters>(key: K, value: ClientFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
    setCurrentPage(1);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-black tracking-tight text-[#07142f]">
            Gestion des clients
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#64748b] sm:text-base">
            Consultez, filtrez et gérez vos clients et leurs préférences de
            communication.
          </p>
        </div>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#2563ff] px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,255,0.24)] transition hover:bg-[#1d4ed8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
          href="/dashboard/import"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M12 3v12M7 8l5-5 5 5M5 21h14" />
          </svg>
          Importer des clients
        </Link>
      </div>

      <ClientNotice {...notices} />

      <div className="flex flex-wrap gap-2">
        <Link
          className={cn(
            "inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-bold transition",
            tab === "active"
              ? "border-[#2563ff] bg-[#eef4ff] text-[#2563ff]"
              : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
          )}
          href="/dashboard/clients?tab=active"
        >
          Clients actifs
        </Link>
        <Link
          className={cn(
            "inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-bold transition",
            tab === "deleted"
              ? "border-[#2563ff] bg-[#eef4ff] text-[#2563ff]"
              : "border-[#e2e8f0] bg-white text-[#475569] hover:bg-[#f8fafc]"
          )}
          href="/dashboard/clients?tab=deleted"
        >
          Clients supprimés
        </Link>
      </div>

      <section className="rounded-[16px] border border-[#e2e8f0] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="grid gap-3">
          <label className="grid min-w-0 gap-1.5">
            <span className="sr-only">Rechercher un client</span>
            <div className="relative min-w-0">
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a3b8]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                className="h-11 w-full min-w-0 rounded-full border border-[#e2e8f0] bg-white py-2 pl-11 pr-10 text-sm text-[#07142f] placeholder:text-[#94a3b8] focus-visible:border-[#2563ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563ff]/20"
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Rechercher un client (nom, téléphone, email...)"
                type="search"
                value={filters.search}
              />
              {filters.search ? (
                <button
                  aria-label="Effacer la recherche"
                  className="absolute right-3 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#07142f]"
                  onClick={() => updateFilter("search", "")}
                  type="button"
                >
                  ×
                </button>
              ) : null}
            </div>
          </label>

          <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              label="Langue"
              onChange={(value) => updateFilter("language", value)}
              options={[
                { label: "FR", value: "fr" },
                { label: "EN", value: "en" }
              ]}
              placeholder="Toutes"
              value={filters.language}
            />
            <FilterSelect
              label="Consentement SMS"
              onChange={(value) => updateFilter("consent", value)}
              options={[
                { label: "Consentement", value: "opted_in" },
                { label: "En attente", value: "needs_consent" },
                { label: "Désinscrit", value: "opted_out" }
              ]}
              placeholder="Tous"
              value={filters.consent}
            />
            <FilterSelect
              label="Intérêt de service"
              onChange={(value) => updateFilter("serviceId", value)}
              options={[
                { label: "Tous les services", value: "__general__" },
                ...serviceFilterOptions.map((name) => ({
                  label: name,
                  value: name
                }))
              ]}
              placeholder="Tous"
              value={filters.serviceId}
            />
            <FilterSelect
              label="Statut"
              onChange={(value) => updateFilter("status", value)}
              options={[
                { label: "Actif", value: "actif" },
                { label: "En attente", value: "en_attente" },
                { label: "Inactif", value: "inactif" }
              ]}
              placeholder="Tous"
              value={filters.status}
            />
          </div>

          <div className="flex justify-end">
            <button
              aria-expanded={showAdvancedFilters}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-4 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563ff]"
              onClick={() => setShowAdvancedFilters((current) => !current)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M2 14h4M10 6h4M18 16h4" />
              </svg>
              Filtres
            </button>
          </div>
        </div>

        {showAdvancedFilters ? (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e2e8f0] pt-4">
            <button
              className="rounded-full border border-[#e2e8f0] bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc]"
              onClick={() => {
                setFilters({
                  search: "",
                  language: "",
                  consent: "",
                  serviceId: "",
                  status: ""
                });
                setCurrentPage(1);
              }}
              type="button"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-[16px] border border-[#e2e8f0] bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3 border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-lg font-black text-[#07142f]">
            {tab === "deleted" ? "Clients supprimés" : "Clients"}
          </h2>
          <span className="inline-flex rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-bold text-[#2563ff]">
            {filteredCustomers.length} client
            {filteredCustomers.length > 1 ? "s" : ""}
          </span>
        </div>

        {paginatedCustomers.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] table-fixed text-left text-sm">
                <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
                  <tr>
                    <th className="w-[18%] px-4 py-3">Nom</th>
                    <th className="w-[12%] px-4 py-3">Téléphone</th>
                    {tab === "active" ? (
                      <>
                        <th className="w-[14%] px-4 py-3">Email</th>
                        <th className="w-[7%] px-4 py-3">Langue</th>
                        <th className="w-[14%] px-4 py-3">Consentement SMS</th>
                        <th className="w-[8%] px-4 py-3">Services</th>
                        <th className="w-[9%] px-4 py-3">Statut</th>
                        <th className="w-[12%] px-4 py-3">Dernière activité</th>
                      </>
                    ) : (
                      <>
                        <th className="w-[14%] px-4 py-3">Supprimé le</th>
                        <th className="w-[18%] px-4 py-3">Raison</th>
                        <th className="w-[14%] px-4 py-3">Consentement SMS</th>
                      </>
                    )}
                    <th className="w-[6%] px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {paginatedCustomers.map((customer) => {
                    const clientStatus = getClientStatus(customer);
                    const consentRequest = formatConsentRequestStatus(
                      customer.latestConsentRequestStatus
                    );
                    const consentTitle =
                      consentRequest &&
                      (customer.consentStatus === "needs_consent" ||
                        customer.consentStatus === "missing")
                        ? `Demande : ${consentRequest}`
                        : undefined;

                    return (
                      <tr className="align-middle hover:bg-[#fcfdff]" key={customer.id}>
                        <td className="px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-[11px] font-black text-[#2563ff]">
                              {getInitials(customer.full_name)}
                            </span>
                            <span
                              className="truncate font-bold text-[#07142f]"
                              title={customer.full_name}
                            >
                              {customer.full_name}
                            </span>
                          </div>
                        </td>
                        <td className="truncate px-4 py-3 text-xs text-[#64748b]">
                          {formatPhoneForDisplay(customer.phone_e164)}
                        </td>
                        {tab === "active" ? (
                          <>
                            <td
                              className="truncate px-4 py-3 text-xs text-[#64748b]"
                              title={customer.email ?? undefined}
                            >
                              {customer.email ?? "—"}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-bold uppercase text-[#2563ff]">
                                {customer.preferred_language}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
                                  getConsentBadgeClass(customer.consentStatus)
                                )}
                                title={consentTitle}
                              >
                                <span aria-hidden="true">
                                  {getConsentIcon(customer.consentStatus)}
                                </span>
                                <span className="truncate">
                                  {formatConsentStatus(customer.consentStatus)}
                                </span>
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <ServiceInterestIcons
                                names={customer.serviceInterestNames}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold whitespace-nowrap text-[#07142f]">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "h-2 w-2 shrink-0 rounded-full",
                                    getStatusDotClass(clientStatus)
                                  )}
                                />
                                {getStatusLabel(clientStatus)}
                              </span>
                            </td>
                            <td className="truncate px-4 py-3 text-xs whitespace-nowrap text-[#64748b]">
                              {formatLastActivity(customer.updated_at)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="truncate px-4 py-3 text-xs text-[#64748b]">
                              {formatDeletedAt(customer.deleted_at)}
                            </td>
                            <td
                              className="truncate px-4 py-3 text-xs text-[#64748b]"
                              title={customer.deleted_reason ?? undefined}
                            >
                              {customer.deleted_reason ?? "Non précisée"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "inline-flex max-w-full items-center rounded-full border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap",
                                  getConsentBadgeClass(customer.consentStatus)
                                )}
                              >
                                {formatConsentStatus(customer.consentStatus)}
                              </span>
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-right">
                          <ClientActionsMenu customer={customer} tab={tab} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={safePage}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSize={pageSize}
              totalCount={filteredCustomers.length}
            />
          </>
        ) : (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2563ff]">
              <svg
                aria-hidden="true"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-[#07142f]">
              {tab === "deleted"
                ? "Aucun client supprimé."
                : "Aucun client pour le moment."}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#64748b]">
              {tab === "deleted"
                ? "Aucun client supprimé pour le moment."
                : "Importez un CSV ou ajoutez un client manuellement pour commencer à bâtir votre liste avec consentement SMS."}
            </p>
          </div>
        )}
      </section>

      {tab === "active" ? (
        <section className="rounded-[16px] border border-[#e2e8f0] bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563ff] text-white">
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#07142f]">
                Ajouter un client manuellement
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#64748b]">
                Utilisez ce formulaire pour ajouter un client manuellement lorsque
                nécessaire.
              </p>
            </div>
          </div>

          <form action={createCustomerAction} className="grid gap-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#07142f]">
                Nom complet *
                <input
                  className="h-11 w-full min-w-0 rounded-full border border-[#e2e8f0] bg-white px-4 text-sm"
                  name="fullName"
                  placeholder="Ex. : Alex Martin"
                  required
                />
              </label>
              <div className="min-w-0 lg:col-span-1">
                <PhoneNumberField
                  className="min-w-0 text-[#07142f]"
                  id="manual-client-phone"
                  inputClassName="rounded-full border-[#e2e8f0]"
                  label="Téléphone *"
                  required
                  selectClassName="rounded-full border-[#e2e8f0] text-sm"
                />
              </div>
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#07142f]">
                Email
                <input
                  className="h-11 w-full min-w-0 rounded-full border border-[#e2e8f0] bg-white px-4 text-sm"
                  name="email"
                  placeholder="exemple@email.com"
                  type="email"
                />
              </label>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#07142f]">
                Langue
                <select
                  className="h-11 w-full rounded-full border border-[#e2e8f0] bg-white px-4 text-sm"
                  defaultValue="fr"
                  name="preferredLanguage"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#07142f]">
                Consentement SMS *
                <select
                  className="h-11 w-full rounded-full border border-[#e2e8f0] bg-white px-4 text-sm"
                  defaultValue="needs_consent"
                  name="consentStatus"
                >
                  <option value="needs_consent">Consentement requis</option>
                  <option value="opted_in">Consentement obtenu</option>
                  <option value="opted_out">Désinscrit</option>
                </select>
                <span className="text-xs font-normal leading-5 text-[#64748b]">
                  Une demande de consentement sera envoyée automatiquement par SMS
                  si le statut est « Consentement requis ».
                </span>
              </label>
              <div className="grid min-w-0 gap-2 text-sm font-semibold text-[#07142f]">
                <span>Preuve du consentement</span>
                <label className="flex min-h-[88px] items-start gap-3 rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-sm font-normal text-[#475569]">
                  <input className="mt-1 shrink-0" name="hasConsentProof" type="checkbox" />
                  <span className="min-w-0">
                    J&apos;ai obtenu une preuve du consentement
                    <span className="mt-1 block text-xs leading-5 text-[#64748b]">
                      Cochez cette case si vous avez une preuve explicite du
                      consentement (capture, enregistrement, etc.).
                    </span>
                  </span>
                </label>
              </div>
              <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#07142f]">
                Intérêt de service *
                <select
                  className="h-11 w-full rounded-full border border-[#e2e8f0] bg-white px-4 text-sm"
                  name="serviceId"
                >
                  <option value="">Tous les services</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs font-normal leading-5 text-[#64748b]">
                  Ajout automatique aux alertes de créneaux libres. Les clients sans
                  consentement ne recevront pas d&apos;alerte.
                </span>
              </label>
            </div>

            <label className="grid min-w-0 gap-2 text-sm font-semibold text-[#07142f]">
              Notes
              <textarea
                className="min-h-24 w-full rounded-2xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm"
                name="notes"
                placeholder="Notes internes (facultatif)"
              />
            </label>

            <div className="flex justify-end">
              <button
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2563ff] px-6 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,255,0.24)] transition hover:bg-[#1d4ed8] sm:w-auto"
                type="submit"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Ajouter le client
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
