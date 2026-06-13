import { PhoneNumberField } from "@/components/forms/phone-number-field";
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
import { createCustomerAction } from "@/lib/dashboard/actions";
import {
  loadCustomersWithConsent,
  loadServices
} from "@/lib/dashboard/operations-data";

type ClientsPageProps = {
  searchParams: Promise<{
    error?: string;
    notice?: string;
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

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const [{ error, notice, warning }, customers, services] = await Promise.all([
    searchParams,
    loadCustomersWithConsent(),
    loadServices()
  ]);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Ajoutez des clients réels avec un statut de consentement SMS conservateur."
        title="Clients"
      />
      <Panel title="Ajouter un client">
        {notice ? (
          <p className="mb-4 rounded-xl border border-[#b7ddc8] bg-[#f1fbf5] p-3 text-sm font-bold text-[#17663a]">
            {notice}
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
        <form action={createCustomerAction} className="grid gap-4 md:grid-cols-6">
          <label className="grid gap-2 text-sm font-bold md:col-span-2">
            Nom complet
            <input
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
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
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              name="email"
              type="email"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Langue
            <select
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
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
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              defaultValue="needs_consent"
              name="consentStatus"
            >
              <option value="needs_consent">Needs consent</option>
              <option value="opted_in">Opted in</option>
              <option value="opted_out">Opted out</option>
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
            Service interest
            <select
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
            name="serviceId"
          >
              <option value="">Tous les services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm font-bold">
            <input name="addToWaitlist" type="checkbox" />
            Ajouter à la liste d&apos;attente
          </label>
          <label className="grid gap-2 text-sm font-bold md:col-span-2">
            Notes
            <input
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              name="notes"
            />
          </label>
          <button
            className="min-h-11 self-end rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
            type="submit"
          >
            Ajouter le client
          </button>
        </form>
      </Panel>
      <Panel title="Gestion clients">
        {customers.length > 0 ? (
          <TableShell>
            <thead>
              <tr>
                <th className={tableHeadClass}>Name</th>
                <th className={tableHeadClass}>Phone</th>
                <th className={tableHeadClass}>Email</th>
                <th className={tableHeadClass}>Language</th>
                <th className={tableHeadClass}>Consent</th>
                <th className={tableHeadClass}>Demande</th>
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
                  <td className={tableCellClass}>{customer.email ?? "N/A"}</td>
                  <td className={tableCellClass}>
                    {customer.preferred_language.toUpperCase()}
                  </td>
                  <td className={tableCellClass}>
                    <StatusBadge>{customer.consentStatus}</StatusBadge>
                  </td>
                  <td className={tableCellClass}>
                    {formatConsentRequestStatus(customer.latestConsentRequestStatus)}
                  </td>
                  <td className={tableCellClass}>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 text-xs font-black text-[var(--foreground)] transition hover:bg-[#f1f3ef]"
                      href={`/dashboard/clients/${customer.id}/edit`}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <EmptyState
            description="Importez un CSV ou ajoutez un client manuellement pour commencer à bâtir votre liste avec consentement SMS."
            title="Aucun client pour le moment."
          />
        )}
      </Panel>
    </div>
  );
}
