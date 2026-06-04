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
  }>;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const [{ error }, customers, services] = await Promise.all([
    searchParams,
    loadCustomersWithConsent(),
    loadServices()
  ]);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Ajoutez des clients reels avec un statut de consentement SMS conservateur."
        title="Clients"
      />
      <Panel title="Ajouter un client">
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
            label="Telephone"
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
              <option value="fr">Francais</option>
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
              <option value="">Any service</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm font-bold">
            <input name="addToWaitlist" type="checkbox" />
            Add to waitlist
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
            Add client
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
            description="Importez un CSV ou ajoutez un client manuellement pour commencer a batir votre liste avec consentement SMS."
            title="Aucun client pour le moment."
          />
        )}
      </Panel>
    </div>
  );
}
