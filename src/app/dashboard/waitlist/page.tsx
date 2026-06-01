import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge,
  TableShell,
  tableCellClass,
  tableHeadClass
} from "@/components/dashboard/dashboard-ui";
import { createWaitlistEntryAction } from "@/lib/dashboard/actions";
import { loadWaitlistView } from "@/lib/dashboard/operations-data";
import {
  filterWaitlistEntries,
  type WaitlistFilterValues
} from "@/lib/waitlist/filters";

type WaitlistPageProps = {
  searchParams: Promise<{
    consent?: string;
    discountInterest?: string;
    error?: string;
    language?: string;
    search?: string;
    serviceId?: string;
    source?: string;
    status?: string;
  }>;
};

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const windows = ["morning", "afternoon", "evening"];
const consentOptions = ["opted_in", "needs_consent", "opted_out", "missing"];
const sourceOptions = [
  "manual",
  "csv_import",
  "qr_code",
  "public_link",
  "kiosk",
  "copy_paste"
];

export default async function WaitlistPage({ searchParams }: WaitlistPageProps) {
  const [params, view] = await Promise.all([
    searchParams,
    loadWaitlistView()
  ]);
  const { error, ...filters } = params;
  const activeFilters: WaitlistFilterValues = filters;
  const filteredEntries = filterWaitlistEntries(view.entries, activeFilters);
  const eligibleCustomers = view.customers.filter(
    (customer) => customer.consentStatus === "opted_in"
  );

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="La liste d'attente regroupe les clients qui ont accepte d'etre contactes et qui souhaitent recevoir des alertes lorsqu'un creneau se libere."
        title="Liste d'attente"
      />
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Panel title="Ajouter a la liste operationnelle">
          {error ? (
            <p className="mb-4 rounded-xl border border-[#f2b8b5] bg-[#fff7f6] p-3 text-sm font-bold text-[#8a1f17]">
              {error}
            </p>
          ) : null}
          <form action={createWaitlistEntryAction} className="grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Client
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                name="customerId"
                required
              >
                <option value="">Choisir un client avec consentement SMS actif</option>
                {eligibleCustomers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name} - {customer.phone_e164}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Service interest
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                name="serviceId"
              >
                <option value="">Any service</option>
                {view.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Status
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue="active"
                name="status"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </label>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-bold">Preferred days</legend>
              <div className="flex flex-wrap gap-2">
                {days.map((day) => (
                  <label
                    className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold"
                    key={day}
                  >
                    <input
                      className="mr-2"
                      name="preferredDays"
                      type="checkbox"
                      value={day}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-bold">Preferred windows</legend>
              <div className="flex flex-wrap gap-2">
                {windows.map((window) => (
                  <label
                    className="rounded-full border border-[var(--line)] bg-white px-3 py-2 text-xs font-bold"
                    key={window}
                  >
                    <input
                      className="mr-2"
                      name="preferredTimeWindows"
                      type="checkbox"
                      value={window}
                    />
                    {window}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input name="discountInterest" type="checkbox" />
              Interested in discounted last-minute spots
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Notes
              <textarea
                className="min-h-24 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
                name="notes"
              />
            </label>
            <button
              className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
              type="submit"
            >
              Add to waitlist
            </button>
          </form>
          {view.customers.length > eligibleCustomers.length ? (
            <p className="mt-4 rounded-xl border border-[#eadcc2] bg-[#fff7ed] p-3 text-xs font-bold leading-5 text-[#8a4b11]">
              Les clients en needs_consent, opted_out ou sans consentement ne peuvent
              pas etre ajoutes aux alertes SMS. Modifiez le consentement seulement
              avec une preuve explicite.
            </p>
          ) : null}
        </Panel>
        <div className="grid gap-6">
          <Panel title="Filtres">
          <form className="grid gap-3 md:grid-cols-2" method="get">
            <label className="grid gap-2 text-sm font-bold md:col-span-2">
              Search name or phone
              <input
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={filters.search}
                name="search"
                placeholder="Maya or 514"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Status
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={filters.status ?? ""}
                name="status"
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="booked">Booked</option>
                <option value="removed">Removed</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Service
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={filters.serviceId ?? ""}
                name="serviceId"
              >
                <option value="">All services</option>
                {view.services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Consent
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={filters.consent ?? ""}
                name="consent"
              >
                <option value="">All consent statuses</option>
                {consentOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Source
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={filters.source ?? ""}
                name="source"
              >
                <option value="">All sources</option>
                {sourceOptions.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Language
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={filters.language ?? ""}
                name="language"
              >
                <option value="">All languages</option>
                <option value="fr">FR</option>
                <option value="en">EN</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Discount interest
              <select
                className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
                defaultValue={filters.discountInterest ?? ""}
                name="discountInterest"
              >
                <option value="">All</option>
                <option value="yes">Wants discount</option>
                <option value="no">No discount interest</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
                type="submit"
              >
                Apply filters
              </button>
              <a
                className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black"
                href="/dashboard/waitlist"
              >
                Clear
              </a>
            </div>
          </form>
          </Panel>
          <Panel title="Membres admissibles et blocages">
          {filteredEntries.length > 0 ? (
            <TableShell>
              <thead>
                <tr>
                  <th className={tableHeadClass}>Client</th>
                  <th className={tableHeadClass}>Eligibility</th>
                  <th className={tableHeadClass}>Service</th>
                  <th className={tableHeadClass}>Status</th>
                  <th className={tableHeadClass}>Source</th>
                  <th className={tableHeadClass}>Preferences</th>
                  <th className={tableHeadClass}>Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)] bg-white">
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className={tableCellClass}>
                      <div className="font-black">{entry.customerName}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {entry.customerPhone}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {entry.customerLanguage.toUpperCase()}
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <StatusBadge>{entry.smsEligibility}</StatusBadge>
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        Consent: {entry.consentStatus}
                      </p>
                    </td>
                    <td className={tableCellClass}>
                      <div className="flex flex-wrap gap-2">
                        {entry.serviceInterestNames.length > 0 ? (
                          entry.serviceInterestNames.map((serviceName) => (
                            <span
                              className="rounded-full border border-[var(--line)] bg-[#fbfaf7] px-3 py-1 text-xs font-black"
                              key={serviceName}
                            >
                              {serviceName}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-[var(--muted)]">
                            General waitlist
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={tableCellClass}>
                      <StatusBadge>{entry.status}</StatusBadge>
                    </td>
                    <td className={tableCellClass}>{entry.source}</td>
                    <td className={tableCellClass}>
                      {[...entry.preferred_days, ...entry.preferred_time_windows].join(", ") || "No preference"}
                      {entry.discount_interest ? (
                        <p className="mt-2 text-xs font-bold text-[var(--primary)]">
                          Wants discount
                        </p>
                      ) : null}
                    </td>
                    <td className={tableCellClass}>
                      {new Date(entry.created_at).toLocaleDateString("fr-CA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </TableShell>
          ) : (
            <EmptyState
              description="Les clients inscrits avec consentement SMS apparaitront ici. Les clients sans consentement ou desinscrits restent exclus des futures alertes."
              title="Aucune personne sur la liste d'attente."
            />
          )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
