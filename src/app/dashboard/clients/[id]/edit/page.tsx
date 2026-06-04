import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DashboardPageHeader,
  Panel
} from "@/components/dashboard/dashboard-ui";
import {
  PhoneNumberField,
  type PhoneCountryCode
} from "@/components/forms/phone-number-field";
import { updateCustomerAction } from "@/lib/dashboard/actions";
import { loadCustomerEditData } from "@/lib/dashboard/operations-data";

type EditClientPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    error?: string;
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

export default async function EditClientPage({
  params,
  searchParams
}: EditClientPageProps) {
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const customer = await loadCustomerEditData(id);

  if (!customer) {
    notFound();
  }

  const phone = splitPhoneForForm(customer.phone_e164);

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black text-[var(--foreground)] transition hover:bg-[#f1f3ef]"
            href="/dashboard/clients"
          >
            Back to clients
          </Link>
        }
        description="Modifiez explicitement un client existant. Le numero de telephone reste unique par organisation."
        title={`Edit client: ${customer.full_name}`}
      />
      <Panel
        description="Les changements de telephone synchronisent le consentement SMS du meme client. Les messages historiques restent inchanges."
        title="Client details"
      >
        {error ? (
          <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
            {error}
          </p>
        ) : null}
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
            label="Telephone"
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
              <option value="fr">Francais</option>
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
              <option value="needs_consent">Needs consent</option>
              <option value="opted_in">Opted in</option>
              <option value="opted_out">Opted out</option>
            </select>
          </label>
          <label className="flex items-end gap-2 text-sm font-bold">
            <input name="hasConsentProof" type="checkbox" />
            Proof
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
      </Panel>
    </div>
  );
}
