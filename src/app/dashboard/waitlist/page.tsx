import Link from "next/link";

import {
  DashboardPageHeader,
  EmptyState,
  Panel,
  StatusBadge
} from "@/components/dashboard/dashboard-ui";
import { dashboardBusiness, dashboardClients, dashboardServices } from "@/lib/dashboard/mock-data";

export default function WaitlistPage() {
  const waitlistMembers = dashboardClients.filter(
    (client) => client.smsConsent === "consenti" && client.status === "Actif"
  );

  return (
    <div className="grid gap-6">
      <DashboardPageHeader
        action={
          <div className="flex flex-wrap gap-2">
            {["Add person", "Import contacts", "Copy signup link"].map((label) => (
              <button
                className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-black"
                key={label}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        }
        description="Filtrez la liste d'attente par service, langue et disponibilité avant d'envoyer une alerte."
        title="Liste d'attente"
      />
      <div className="grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <Panel title="Filtres">
          <div className="grid gap-3">
            <label className="grid gap-2 text-sm font-bold">
              Service
              <select className="min-h-11 rounded-xl border border-[var(--line)] px-3">
                {dashboardServices.map((service) => (
                  <option key={service.id}>{service.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Langue
              <select className="min-h-11 rounded-xl border border-[var(--line)] px-3">
                <option>Français</option>
                <option>English</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-bold">
              Disponibilité
              <select className="min-h-11 rounded-xl border border-[var(--line)] px-3">
                <option>Disponible aujourd&apos;hui</option>
                <option>Soirs seulement</option>
                <option>À vérifier</option>
              </select>
            </label>
          </div>
          <div className="mt-5 rounded-2xl border border-dashed border-[var(--line)] bg-[#fbfaf7] p-5 text-center">
            <p className="font-black">QR code public</p>
            <div className="mx-auto mt-4 grid size-28 place-items-center rounded-2xl bg-white text-xs font-black text-[var(--muted)]">
              QR
            </div>
            <Link
              className="mt-4 inline-flex rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-black text-white"
              href="/b/demo-salon/waitlist"
            >
              Formulaire d&apos;inscription
            </Link>
          </div>
        </Panel>
        <Panel title={`Membres admissibles · ${dashboardBusiness.name}`}>
          {waitlistMembers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {waitlistMembers.map((client) => (
                <article
                  className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
                  key={client.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black">{client.name}</p>
                      <p className="text-sm text-[var(--muted)]">{client.phone}</p>
                    </div>
                    <StatusBadge>{client.preferredLanguage.toUpperCase()}</StatusBadge>
                  </div>
                  <p className="mt-3 text-sm text-[var(--muted)]">
                    {client.interestedServices.join(", ")}
                  </p>
                  <p className="mt-2 text-xs font-bold text-[var(--muted)]">
                    {client.availability}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Les personnes inscrites avec consentement SMS apparaîtront ici avec leurs services d'intérêt."
              title="Aucune personne sur la liste d'attente."
            />
          )}
        </Panel>
      </div>
    </div>
  );
}
