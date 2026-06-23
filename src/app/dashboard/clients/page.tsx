import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { PhoneNumberField } from "@/components/forms/phone-number-field";
import {
  createCustomerAction,
  deleteCustomerAction,
  restoreCustomerAction
} from "@/lib/dashboard/actions";
import {
  loadCustomersWithConsent,
  loadServices
} from "@/lib/dashboard/operations-data";
import { normalizeCustomerListTab } from "@/lib/customers/soft-delete";

type ClientsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    notice?: string;
    tab?: string;
    warning?: string;
  }>;
};

function formatConsentRequestStatus(status: string | null | undefined) {
  if (!status) {
    return "Aucune demande";
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

function formatConsentStatus(status: string | null | undefined) {
  const labels: Record<string, string> = {
    missing: "Consentement requis",
    needs_consent: "Consentement requis",
    opted_in: "Consentement confirmé",
    opted_out: "Désinscrit"
  };

  return labels[status ?? ""] ?? status ?? "Consentement requis";
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

function ClientNotice({
  error,
  message,
  notice,
  warning
}: {
  error?: string;
  message?: string;
  notice?: string;
  warning?: string;
}) {
  return (
    <>
      {message || notice ? (
        <p className="mb-4 rounded-xl border border-[#b7ddc8] bg-[#f1fbf5] p-3 text-sm font-bold text-[#17663a]">
          {message ?? notice}
        </p>
      ) : null}
      {warning ? (
        <p className="mb-4 rounded-xl border border-[#f4cf8c] bg-[#fff9ed] p-3 text-sm font-bold text-[#7a4a00]">
          {warning}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
          {error}
        </p>
      ) : null}
    </>
  );
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const tab = normalizeCustomerListTab(params.tab);
  const [customers, services] = await Promise.all([
    loadCustomersWithConsent({ onlyDeleted: tab === "deleted" }),
    loadServices()
  ]);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Gérez les clients actifs, leur consentement SMS, et les clients supprimés sans perdre l'historique."
        title="Clients"
      />
      <ClientNotice
        error={params.error}
        message={params.message}
        notice={params.notice}
        warning={params.warning}
      />

      <div className="flex flex-wrap gap-2">
        <Link
          className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-black ${
            tab === "active"
              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_12px_24px_rgba(79,125,243,0.22)]"
              : "border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-slate-50"
          }`}
          href="/dashboard/clients?tab=active"
        >
          Clients actifs
        </Link>
        <Link
          className={`inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-sm font-black ${
            tab === "deleted"
              ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_12px_24px_rgba(79,125,243,0.22)]"
              : "border-[var(--line)] bg-white text-[var(--foreground)] hover:bg-slate-50"
          }`}
          href="/dashboard/clients?tab=deleted"
        >
          Clients supprimés
        </Link>
      </div>

      {tab === "active" ? (
        <Panel title="Ajouter un client">
          <form action={createCustomerAction} className="grid gap-4 md:grid-cols-6">
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Nom complet
              <input
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
                name="fullName"
                required
              />
            </label>
            <PhoneNumberField
              className="md:col-span-2"
              id="client-phone"
              label="Téléphone"
              required
            />
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Email
              <input
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
                name="email"
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Langue
              <select
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
                defaultValue="fr"
                name="preferredLanguage"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Consentement SMS
              <select
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
                defaultValue="needs_consent"
                name="consentStatus"
              >
                <option value="needs_consent">Consentement requis</option>
                <option value="opted_in">Consentement confirmé</option>
                <option value="opted_out">Désinscrit</option>
              </select>
              <span className="text-xs font-semibold leading-5 text-[var(--muted)]">
                Une demande de consentement sera envoyée automatiquement par SMS.
                Le client restera en attente jusqu&apos;à une réponse OUI/YES.
              </span>
            </label>
            <label className="flex items-end gap-2 text-sm font-bold">
              <input name="hasConsentProof" type="checkbox" />
              Proof
            </label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Intérêt de service
              <select
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
                name="serviceId"
              >
                <option value="">Tous les services</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              <span className="text-xs font-semibold leading-5 text-[var(--muted)]">
                Ajout automatique aux alertes de créneaux libres. Les clients
                sans consentement ne recevront pas d&apos;alerte.
              </span>
            </label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Notes
              <input
                className="min-h-11 rounded-2xl border border-[var(--line)] bg-white px-3"
                name="notes"
              />
            </label>
            <button
              className="min-h-11 self-end rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white shadow-[0_12px_24px_rgba(79,125,243,0.2)] transition hover:bg-[var(--primary-strong)]"
              type="submit"
            >
              Ajouter le client
            </button>
          </form>
        </Panel>
      ) : null}

      <Panel title={tab === "deleted" ? "Clients supprimés" : "Gestion clients"}>
        {customers.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Name</th>
                <th className={tableHeadClass}>Phone</th>
                {tab === "active" ? (
                  <>
                    <th className={tableHeadClass}>Email</th>
                    <th className={tableHeadClass}>Language</th>
                    <th className={tableHeadClass}>Consent</th>
                    <th className={tableHeadClass}>Demande</th>
                  </>
                ) : (
                  <>
                    <th className={tableHeadClass}>Deleted at</th>
                    <th className={tableHeadClass}>Reason</th>
                    <th className={tableHeadClass}>Consent</th>
                  </>
                )}
                <th className={tableHeadClass}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)] bg-white">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className={`${tableCellClass} font-black`}>
                    {customer.full_name}
                  </td>
                  <td className={tableCellClass}>{customer.phone_e164}</td>
                  {tab === "active" ? (
                    <>
                      <td className={tableCellClass}>{customer.email ?? "N/A"}</td>
                      <td className={tableCellClass}>
                        {customer.preferred_language.toUpperCase()}
                      </td>
                      <td className={tableCellClass}>
                        <StatusBadge>
                          {formatConsentStatus(customer.consentStatus)}
                        </StatusBadge>
                      </td>
                      <td className={tableCellClass}>
                        {formatConsentRequestStatus(
                          customer.latestConsentRequestStatus
                        )}
                      </td>
                      <td className={tableCellClass}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                          <Link
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 text-xs font-black text-[var(--foreground)] transition hover:bg-[#f1f3ef]"
                            href={`/dashboard/clients/${customer.id}/edit`}
                          >
                            Edit
                          </Link>
                          <details className="group">
                            <summary className="inline-flex min-h-10 cursor-pointer list-none items-center justify-center rounded-full border border-[#f2b8b5] bg-white px-4 text-xs font-black text-[#8a1f17] transition hover:bg-[#fff7f6]">
                              Supprimer
                            </summary>
                            <form
                              action={deleteCustomerAction}
                              className="mt-3 grid min-w-64 gap-3 rounded-lg border border-[#f2b8b5] bg-[#fff7f6] p-3"
                            >
                              <input
                                name="customerId"
                                type="hidden"
                                value={customer.id}
                              />
                              <input
                                name="returnTo"
                                type="hidden"
                                value="/dashboard/clients?tab=active"
                              />
                              <p className="text-xs font-semibold leading-5 text-[#8a1f17]">
                                Cette action retire le client des listes actives et des
                                futurs SMS. L&apos;historique reste conservé.
                              </p>
                              <label className="grid gap-2 text-xs font-bold">
                                Raison
                                <input
                                  className="min-h-10 rounded-lg border border-[#f2b8b5] bg-white px-3"
                                  maxLength={500}
                                  minLength={3}
                                  name="reason"
                                  required
                                />
                              </label>
                              <label className="flex gap-2 text-xs font-bold leading-5">
                                <input name="confirm" required type="checkbox" />
                                Je comprends que ce client ne recevra plus de SMS.
                              </label>
                              <button
                                className="min-h-10 rounded-full bg-[#8a1f17] px-4 text-xs font-black text-white"
                                type="submit"
                              >
                                Confirmer la suppression
                              </button>
                            </form>
                          </details>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className={tableCellClass}>
                        {formatDeletedAt(customer.deleted_at)}
                      </td>
                      <td className={tableCellClass}>
                        {customer.deleted_reason ?? "Non précisée"}
                      </td>
                      <td className={tableCellClass}>
                        <StatusBadge>
                          {formatConsentStatus(customer.consentStatus)}
                        </StatusBadge>
                      </td>
                      <td className={tableCellClass}>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Link
                            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 text-xs font-black text-[var(--foreground)] transition hover:bg-[#f1f3ef]"
                            href={`/dashboard/clients/${customer.id}/edit`}
                          >
                            View
                          </Link>
                          <form action={restoreCustomerAction}>
                            <input
                              name="customerId"
                              type="hidden"
                              value={customer.id}
                            />
                            <input
                              name="returnTo"
                              type="hidden"
                              value="/dashboard/clients?tab=deleted"
                            />
                            <button
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-xs font-black text-white"
                              type="submit"
                            >
                              Restaurer
                            </button>
                          </form>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description={
              tab === "deleted"
                ? "Aucun client supprimé pour le moment."
                : "Importez un CSV ou ajoutez un client manuellement pour commencer à bâtir votre liste avec consentement SMS."
            }
            title={
              tab === "deleted"
                ? "Aucun client supprimé."
                : "Aucun client pour le moment."
            }
          />
        )}
      </Panel>
    </div>
  );
}

