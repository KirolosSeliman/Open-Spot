import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import {
  buildOpeningResponsesResetHref,
  filterOpeningResponseGroups,
  loadAppointmentResponseCalendar,
  loadServices,
  loadOpeningResponseGroups,
  normalizeOpeningResponsesFilters,
  type AppointmentResponseCalendarItem,
  type OpeningResponsesFilters,
  type OpeningResponseCustomer
} from "@/lib/dashboard/operations-data";
import type { InboundSmsClassification } from "@/lib/sms/inbound";

type ResponsesPageProps = {
  searchParams: Promise<{
    tab?: string;
    range?: string;
    serviceId?: string;
    q?: string;
  }>;
};

const tabs = [
  {
    label: "Alertes créneaux libres",
    value: "openings"
  },
  {
    label: "Confirmations rendez-vous",
    value: "appointments"
  }
];

const openingRangeOptions: Array<{
  label: string;
  value: OpeningResponsesFilters["range"];
}> = [
  { label: "Cette semaine", value: "this_week" },
  { label: "2 semaines", value: "two_weeks" },
  { label: "1 mois", value: "one_month" },
  { label: "3 mois", value: "three_months" },
  { label: "Tout", value: "all" }
];

function formatDateTime(value: string | null) {
  if (!value) {
    return "Date inconnue";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) {
    return "Heure inconnue";
  }

  return new Intl.DateTimeFormat("fr-CA", {
    timeStyle: "short"
  }).format(new Date(value));
}

function formatClassification(classification: InboundSmsClassification) {
  switch (classification) {
    case "appointment_confirm":
      return "Confirme par client";
    case "appointment_cancel":
      return "Annule par client";
    case "opt_out":
      return "Desabonnement";
    case "waitlist_positive":
      return "Réponse positive";
    default:
      return "Inconnu / autre";
  }
}

function formatAppointmentStatus(status: string | null) {
  switch (status) {
    case "scheduled":
      return "Planifie";
    case "not_yet_confirmed":
      return "Pas encore confirme";
    case "cancelled":
      return "Annule";
    default:
      return status ?? "Statut inconnu";
  }
}

function formatConfirmationStatus(status: string | null) {
  switch (status) {
    case "confirmed_by_client":
      return "Confirme par client";
    case "cancelled_by_client":
      return "Annule par client";
    case "pending":
      return "En attente";
    case "not_requested":
      return "Non demande";
    default:
      return status ?? "Confirmation inconnue";
  }
}

function formatOpeningReplyStatus(customer: OpeningResponseCustomer) {
  if (customer.offerStatus === "selected") {
    return "Selectionne manuellement";
  }

  if (customer.offerStatus === "rejected") {
    return "Rejete";
  }

  if (customer.replyClassification === "opt_out") {
    return "Desabonne";
  }

  if (customer.replyClassification === "waitlist_positive") {
    return "Réponse positive";
  }

  if (customer.replyClassification === "unknown") {
    return "Réponse inconnue/autre";
  }

  return "SMS envoyé, pas encore répondu";
}

function TabLink({
  active,
  href,
  label
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={`rounded-full border px-4 py-2 text-sm font-black ${
        active
          ? "border-[var(--primary)] bg-[var(--primary)] text-white"
          : "border-[var(--line)] bg-white text-[var(--foreground)]"
      }`}
      href={href}
    >
      {label}
    </Link>
  );
}

function buildOpeningsHref(filters: OpeningResponsesFilters) {
  const params = new URLSearchParams({
    tab: "openings",
    range: filters.range,
    serviceId: filters.serviceId
  });

  if (filters.q) {
    params.set("q", filters.q);
  }

  return `/dashboard/responses?${params.toString()}`;
}

function OpeningResponsesFiltersForm({
  filters,
  services,
  totalCount,
  filteredCount
}: {
  filters: OpeningResponsesFilters;
  services: Array<{
    id: string;
    name: string;
  }>;
  totalCount: number;
  filteredCount: number;
}) {
  return (
    <form
      className="mb-5 grid gap-3 rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4 lg:grid-cols-[1fr_1fr_1.4fr_auto]"
      method="get"
    >
      <input name="tab" type="hidden" value="openings" />
      <label className="grid gap-2 text-sm font-bold">
        Période du créneau
        <select
          className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3"
          defaultValue={filters.range}
          name="range"
        >
          {openingRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Service
        <select
          className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3"
          defaultValue={filters.serviceId}
          name="serviceId"
        >
          <option value="all">Tous les services</option>
          <option value="none">Service non précisé</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Recherche
        <input
          className="min-h-11 w-full rounded-xl border border-[var(--line)] bg-white px-3"
          defaultValue={filters.q}
          aria-label="Rechercher dans les alertes de créneaux libres"
          autoComplete="off"
          inputMode="search"
          maxLength={80}
          name="q"
          placeholder="Titre, client, téléphone, SMS..."
          type="search"
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 lg:content-end">
        <button
          className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-black text-white"
          type="submit"
        >
          Filtrer
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line)] bg-white px-5 text-sm font-black text-[var(--foreground)]"
          href={buildOpeningResponsesResetHref()}
        >
          Réinitialiser
        </Link>
      </div>
      <div className="grid gap-1 text-xs font-bold text-[var(--muted)] lg:col-span-4">
        <p>
          {filteredCount} annulation{filteredCount > 1 ? "s" : ""} affichée
          {filteredCount > 1 ? "s" : ""} sur {totalCount}.
        </p>
        {filters.q ? <p>Recherche : “{filters.q}”</p> : null}
      </div>
    </form>
  );
}

function AppointmentResponseCard({
  item
}: {
  item: AppointmentResponseCalendarItem;
}) {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-black">{item.customerName}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {item.customerPhone || "Telephone inconnu"}
          </p>
        </div>
        <StatusBadge>{formatClassification(item.classification)}</StatusBadge>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-black uppercase text-[var(--muted)]">
            Rendez-vous
          </dt>
          <dd className="mt-1 font-bold">
            {item.appointmentStartsAt
              ? formatTime(item.appointmentStartsAt)
              : "Date du rendez-vous inconnue"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase text-[var(--muted)]">
            Service
          </dt>
          <dd className="mt-1 font-bold">
            {item.serviceName ?? "Service non précisé"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-black uppercase text-[var(--muted)]">
            Recu
          </dt>
          <dd className="mt-1 font-bold">
            {formatDateTime(item.inboundReceivedAt)}
          </dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <StatusBadge>{formatAppointmentStatus(item.appointmentStatus)}</StatusBadge>
        <StatusBadge>
          {formatConfirmationStatus(item.confirmationStatus)}
        </StatusBadge>
      </div>
      <p className="mt-3 rounded-xl border border-[var(--line)] bg-white p-3 text-sm leading-6">
        {item.inboundBody}
      </p>
    </article>
  );
}

export default async function ResponsesPage({
  searchParams
}: ResponsesPageProps) {
  const params = await searchParams;
  const activeTab = params.tab === "appointments" ? "appointments" : "openings";
  const openingFilters = normalizeOpeningResponsesFilters(params);
  const [appointmentGroups, openingGroups, services] = await Promise.all([
    loadAppointmentResponseCalendar(),
    loadOpeningResponseGroups(),
    loadServices()
  ]);
  const filteredOpeningGroups = filterOpeningResponseGroups(
    openingGroups,
    openingFilters
  );

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        description="Suivez les réponses SMS par contexte exact: rendez-vous existants ou alertes de créneaux libres."
        title="Réponses"
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <TabLink
            active={activeTab === tab.value}
            href={
              tab.value === "openings"
                ? buildOpeningsHref(openingFilters)
                : "/dashboard/responses?tab=appointments"
            }
            key={tab.value}
            label={tab.label}
          />
        ))}
      </div>

      {activeTab === "appointments" ? (
        <Panel
          description="Les réponses OUI/NON aux rappels sont regroupées par date de rendez-vous."
          title="Confirmations rendez-vous"
        >
          {appointmentGroups.length > 0 ? (
            <div className="grid gap-5">
              {appointmentGroups.map((group) => (
                <section className="grid gap-3" key={group.dateKey}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-lg font-black">{group.dateLabel}</h2>
                    <p className="text-sm font-bold text-[var(--muted)]">
                      {group.items.length} réponse
                      {group.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="grid gap-3">
                    {group.items.map((item) => (
                      <AppointmentResponseCard item={item} key={item.id} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Les réponses OUI/NON aux rappels apparaîtront ici."
              title="Aucune réponse de confirmation de rendez-vous reçue."
            />
          )}
          <Link
            className="mt-4 inline-flex text-sm font-black text-[var(--primary)]"
            href="/dashboard/appointments"
          >
            Voir les rendez-vous
          </Link>
        </Panel>
      ) : (
        <Panel
          description="Chaque annulation garde sa propre liste de réponses. Un OUI ne confirme jamais automatiquement un client."
          title="Alertes créneaux libres"
        >
          <OpeningResponsesFiltersForm
            filteredCount={filteredOpeningGroups.length}
            filters={openingFilters}
            services={services.map((service) => ({
              id: service.id,
              name: service.name
            }))}
            totalCount={openingGroups.length}
          />
          {filteredOpeningGroups.length > 0 ? (
            <div className="grid gap-5">
              {filteredOpeningGroups.map((group) => (
                <section
                  className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                  key={group.openingId}
                >
                  <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">
                          {group.openingTitle}
                        </h2>
                        <StatusBadge>{group.openingStatus}</StatusBadge>
                      </div>
                      <p className="mt-2 text-sm font-bold text-[var(--muted)]">
                        {formatDateTime(group.startTime)}
                        {group.endTime ? ` - ${formatTime(group.endTime)}` : ""}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[var(--muted)]">
                        {group.serviceName ?? "Service non précisé"}
                        {group.offerLabel ? ` - ${group.offerLabel}` : ""}
                      </p>
                    </div>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--line)] bg-white px-4 text-sm font-black text-[var(--foreground)]"
                      href={`/dashboard/cancellations/${group.openingId}`}
                    >
                      Voir / valider cette annulation
                    </Link>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-black text-[var(--muted)] sm:grid-cols-4">
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.responseCount} réponses
                    </span>
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.positiveCount} positifs
                    </span>
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.noReplyCount} sans réponse
                    </span>
                    <span className="rounded-full bg-white px-3 py-2">
                      {group.sentCount} SMS envoyés
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {group.customers.map((customer) => (
                      <article
                        className="rounded-2xl border border-[var(--line)] bg-white p-4"
                        key={customer.offerId}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="font-black">
                              {customer.customerName}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {customer.customerPhone || "Telephone inconnu"}
                            </p>
                          </div>
                          <StatusBadge>
                            {formatOpeningReplyStatus(customer)}
                          </StatusBadge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-black text-[var(--muted)]">
                          {customer.responseRank ? (
                            <span className="rounded-full bg-[#f4faf7] px-2 py-1">
                              Rang #{customer.responseRank}
                            </span>
                          ) : null}
                          <span className="rounded-full bg-[#f4faf7] px-2 py-1">
                            Offre: {customer.offerStatus}
                          </span>
                          {customer.replyClassification ===
                            "waitlist_positive" &&
                          customer.offerStatus !== "selected" ? (
                            <span className="rounded-full bg-[#fff9eb] px-2 py-1 text-[#74510f]">
                              En attente de validation manuelle
                            </span>
                          ) : null}
                        </div>
                        {customer.lastInboundBody ?? customer.responseText ? (
                          <p className="mt-3 rounded-xl border border-[var(--line)] bg-[#fbfaf7] p-3 text-sm leading-6">
                            {customer.lastInboundBody ?? customer.responseText}
                          </p>
                        ) : null}
                        {customer.lastInboundReceivedAt ??
                        customer.respondedAt ? (
                          <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                            Recu:{" "}
                            {formatDateTime(
                              customer.lastInboundReceivedAt ??
                                customer.respondedAt
                            )}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid gap-3">
              <EmptyState
                description={
                  openingGroups.length > 0
                    ? "Essayez une recherche plus large ou réinitialisez les filtres."
                    : "Créez une nouvelle annulation pour envoyer une alerte SMS aux clients admissibles."
                }
                title={
                  openingGroups.length > 0
                    ? "Aucun créneau ne correspond à ces filtres."
                    : "Aucune alerte de créneau libre pour le moment."
                }
              />
              {openingGroups.length > 0 ? (
                <Link
                  className="justify-self-center rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-black text-[var(--foreground)]"
                  href={buildOpeningResponsesResetHref()}
                >
                  Réinitialiser
                </Link>
              ) : null}
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
