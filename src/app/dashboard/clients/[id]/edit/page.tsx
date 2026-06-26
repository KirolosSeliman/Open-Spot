import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DashboardPageHeader,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import {
  PhoneNumberField,
  type PhoneCountryCode
} from "@/components/forms/phone-number-field";
import {
  deleteCustomerAction,
  restoreCustomerAction,
  updateCustomerAction
} from "@/lib/dashboard/actions";
import { loadCustomerEditData, loadServices } from "@/lib/dashboard/operations-data";
import { isDeletedCustomer } from "@/lib/customers/soft-delete";

type EditClientPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
    message?: string;
    notice?: string;
    warning?: string;
  }>;
};

const countryCodeByCallingCode: Record<string, PhoneCountryCode> = {
  "+1": "CA",
  "+20": "EG",
  "+33": "FR",
  "+44": "GB",
  "+52": "MX",
  "+90": "TR",
  "+212": "MA",
  "+961": "LB",
  "+963": "SY",
  "+966": "SA",
  "+971": "AE",
  "+974": "QA"
};

function splitPhoneForForm(phoneE164: string): {
  countryCode: PhoneCountryCode;
  nationalNumber: string;
} {
  const matchingCallingCode = Object.keys(countryCodeByCallingCode)
    .sort((a, b) => b.length - a.length)
    .find((callingCode) => phoneE164.startsWith(callingCode));

  if (!matchingCallingCode) {
    return {
      countryCode: "CA",
      nationalNumber: phoneE164
    };
  }

  return {
    countryCode: countryCodeByCallingCode[matchingCallingCode] ?? "CA",
    nationalNumber: phoneE164.slice(matchingCallingCode.length)
  };
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

function formatConsentStatus(status: string | null | undefined) {
  const labels: Record<string, string> = {
    missing: "Consentement requis",
    needs_consent: "Consentement requis",
    opted_in: "Consentement confirmé",
    opted_out: "Désinscrit"
  };

  return labels[status ?? ""] ?? status ?? "Consentement requis";
}

function Feedback({
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

export default async function EditClientPage({
  params,
  searchParams
}: EditClientPageProps) {
  const [{ id }, feedback] = await Promise.all([params, searchParams]);
  const [customer, services] = await Promise.all([
    loadCustomerEditData(id),
    loadServices()
  ]);

  if (!customer) {
    notFound();
  }

  const phone = splitPhoneForForm(customer.phone_e164);
  const deleted = isDeletedCustomer(customer);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black text-[var(--foreground)] transition hover:bg-[#f1f3ef]"
            href={deleted ? "/dashboard/clients?tab=deleted" : "/dashboard/clients"}
          >
            Back to clients
          </Link>
        }
        description={
          deleted
            ? "Ce client est supprimé. Les données historiques restent visibles en lecture seule."
            : "Modifiez explicitement un client existant. Le numéro de téléphone reste unique par organisation."
        }
        title={`${deleted ? "Client supprimé" : "Edit client"}: ${customer.full_name}`}
      />
      <Panel
        description={
          deleted
            ? "Restaurer le client ne change pas son consentement SMS et ne le remet pas automatiquement sur la liste d'attente."
            : "Les changements de téléphone synchronisent le consentement SMS du même client. Les messages historiques restent inchangés."
        }
        title="Client details"
      >
        <Feedback {...feedback} />
        {deleted ? (
          <div className="grid gap-4">
            <div className="grid gap-3 rounded-lg border border-[#f4cf8c] bg-[#fff9ed] p-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge>Deleted</StatusBadge>
                <span className="font-bold text-[#7a4a00]">
                  Supprimé le {formatDeletedAt(customer.deleted_at)}
                </span>
              </div>
              <p className="text-[#5f3b00]">
                Raison: {customer.deleted_reason ?? "Non précisée"}
              </p>
            </div>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt className="font-bold text-[var(--muted)]">Nom</dt>
                <dd className="font-black">{customer.full_name}</dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--muted)]">Téléphone</dt>
                <dd className="font-black">{customer.phone_e164}</dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--muted)]">Email</dt>
                <dd className="font-black">{customer.email ?? "N/A"}</dd>
              </div>
              <div>
                <dt className="font-bold text-[var(--muted)]">Consentement</dt>
                <dd>
                  <StatusBadge>
                    {formatConsentStatus(customer.consentStatus)}
                  </StatusBadge>
                </dd>
              </div>
            </dl>
            <form action={restoreCustomerAction} className="flex flex-wrap gap-3">
              <input name="customerId" type="hidden" value={customer.id} />
              <input
                name="returnTo"
                type="hidden"
                value={`/dashboard/clients/${customer.id}/edit`}
              />
              <button
                className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
                type="submit"
              >
                Restaurer le client
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black text-[var(--foreground)]"
                href="/dashboard/clients?tab=deleted"
              >
                Retour aux clients supprimés
              </Link>
            </form>
          </div>
        ) : (
          <form action={updateCustomerAction} className="grid gap-4 md:grid-cols-6">
            <input name="customerId" type="hidden" value={customer.id} />
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Nom complet
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={customer.full_name}
                name="fullName"
                required
              />
            </label>
            <PhoneNumberField
              className="md:col-span-2"
              defaultCountryCode={phone.countryCode}
              defaultNationalNumber={phone.nationalNumber}
              id="client-phone"
              label="Téléphone"
              required
            />
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Email
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={customer.email ?? ""}
                name="email"
                type="email"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Langue
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={customer.preferred_language}
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
                defaultValue={
                  customer.consentStatus === "missing"
                    ? "needs_consent"
                    : customer.consentStatus
                }
                name="consentStatus"
              >
                <option value="needs_consent">Consentement requis</option>
                <option value="opted_in">Consentement confirmé</option>
                <option value="opted_out">Désinscrit</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm font-bold">
              <input name="hasConsentProof" type="checkbox" />
              Preuve du consentement
            </label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Intérêt de service
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={customer.serviceId ?? ""}
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
                Met à jour les alertes de créneaux libres associées à ce client.
              </span>
            </label>
            <label className="grid gap-2 text-sm font-bold md:col-span-6">
              Notes
              <textarea
                className="min-h-28 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                defaultValue={customer.notes ?? ""}
                name="notes"
              />
            </label>
            <div className="flex flex-wrap gap-3 md:col-span-6">
              <button
                className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
                type="submit"
              >
                Save client
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black text-[var(--foreground)]"
                href="/dashboard/clients"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </Panel>

      {!deleted ? (
        <Panel
          description="Supprimer ce client le retirera des listes actives et des futurs SMS. L'historique des messages et rendez-vous restera conservé."
          title="Danger zone"
        >
          <form action={deleteCustomerAction} className="grid gap-4 md:grid-cols-3">
            <input name="customerId" type="hidden" value={customer.id} />
            <input
              name="returnTo"
              type="hidden"
              value={`/dashboard/clients/${customer.id}/edit`}
            />
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Raison
              <input
                className="min-h-11 rounded-xl border border-[#f2b8b5] bg-white px-3"
                maxLength={500}
                minLength={3}
                name="reason"
                required
              />
            </label>
            <label className="flex items-end gap-2 text-sm font-bold">
              <input name="confirm" required type="checkbox" />
              Je confirme
            </label>
            <button
              className="min-h-11 rounded-full bg-[#8a1f17] px-5 text-sm font-black text-white md:w-fit"
              type="submit"
            >
              Supprimer le client
            </button>
          </form>
        </Panel>
      ) : null}
    </div>
  );
}
