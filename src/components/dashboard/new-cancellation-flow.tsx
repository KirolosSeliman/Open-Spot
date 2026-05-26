"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type {
  DashboardBusiness,
  DashboardClient,
  DashboardService
} from "@/lib/dashboard/types";
import {
  countSmsCharacters,
  estimateSmsSegments,
  generateCancellationSms
} from "@/lib/dashboard/message-generation";

const segmentOptions = [
  "Toute la liste d'attente",
  "Clients intéressés par ce service",
  "Clients disponibles aujourd'hui",
  "Clients VIP",
  "Sélection manuelle"
];

export function NewCancellationFlow({
  business,
  clients,
  services
}: {
  business: DashboardBusiness;
  clients: DashboardClient[];
  services: DashboardService[];
}) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [date, setDate] = useState("2026-05-26");
  const [time, setTime] = useState("14:30");
  const [duration, setDuration] = useState("45");
  const [price, setPrice] = useState("55");
  const [employee, setEmployee] = useState("Amélie");
  const [notes, setNotes] = useState("");
  const [segment, setSegment] = useState(segmentOptions[1]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState<string | null>(null);
  const selectedService = services.find((service) => service.id === serviceId);

  const automaticMessage = useMemo(
    () =>
      generateCancellationSms({
        locale: business.mainLanguage,
        businessName: business.name,
        appointmentDate: date,
        appointmentTime: time,
        serviceName: selectedService?.name ?? "service",
        estimatedPrice: `${price} $`,
        employeeName: employee
      }),
    [business.mainLanguage, business.name, date, employee, price, selectedService?.name, time]
  );
  const message = customMessage ?? automaticMessage;

  const eligibleClients = clients.filter(
    (client) =>
      client.smsConsent === "consenti" &&
      client.status === "Actif" &&
      (segment !== "Clients VIP" || client.vip)
  );
  const count = countSmsCharacters(message);
  const segments = estimateSmsSegments(message);

  function resetMessage() {
    setCustomMessage(null);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <section className="rounded-2xl border border-[var(--line)] bg-white/88 p-5 shadow-sm">
        <h2 className="text-lg font-black">Détails du créneau annulé</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">
            Service
            <select
              className="min-h-11 rounded-xl border border-[var(--line)] bg-white px-3"
              onChange={(event) => setServiceId(event.target.value)}
              value={serviceId}
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Date
            <input
              className="min-h-11 rounded-xl border border-[var(--line)] px-3"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Heure
            <input
              className="min-h-11 rounded-xl border border-[var(--line)] px-3"
              onChange={(event) => setTime(event.target.value)}
              type="time"
              value={time}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Durée
            <input
              className="min-h-11 rounded-xl border border-[var(--line)] px-3"
              onChange={(event) => setDuration(event.target.value)}
              type="number"
              value={duration}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Prix estimé
            <input
              className="min-h-11 rounded-xl border border-[var(--line)] px-3"
              onChange={(event) => setPrice(event.target.value)}
              type="number"
              value={price}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Employé
            <input
              className="min-h-11 rounded-xl border border-[var(--line)] px-3"
              onChange={(event) => setEmployee(event.target.value)}
              value={employee}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold sm:col-span-2">
            Notes internes
            <textarea
              className="min-h-24 rounded-xl border border-[var(--line)] px-3 py-2"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Contexte utile pour l'équipe"
              value={notes}
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/88 p-5 shadow-sm">
        <h2 className="text-lg font-black">Sélection des clients</h2>
        <div className="mt-4 grid gap-2">
          {segmentOptions.map((option) => (
            <button
              className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition ${
                segment === option
                  ? "border-[var(--primary)] bg-[#edf8f3] text-[var(--primary-strong)]"
                  : "border-[var(--line)] bg-white text-[var(--foreground)]"
              }`}
              key={option}
              onClick={() => setSegment(option)}
              type="button"
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/88 p-5 shadow-sm xl:col-span-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black">Clients sélectionnés</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Les contacts désabonnés ou sans consentement SMS sont exclus.
            </p>
          </div>
          <span className="rounded-full bg-[#edf8f3] px-3 py-1 text-sm font-black text-[var(--primary-strong)]">
            {eligibleClients.length} admissibles
          </span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {eligibleClients.map((client) => (
            <article
              className="rounded-2xl border border-[var(--line)] bg-[#fbfaf7] p-4"
              key={client.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{client.name}</p>
                  <p className="text-sm text-[var(--muted)]">{client.phone}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-black">
                  {client.preferredLanguage.toUpperCase()}
                </span>
              </div>
              <p className="mt-3 text-sm text-[var(--muted)]">
                {client.interestedServices.join(", ")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
                <span className="rounded-full bg-white px-2 py-1">SMS prêt</span>
                <span className="rounded-full bg-white px-2 py-1">
                  Consentement {client.smsConsent}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white/88 p-5 shadow-sm xl:col-span-2">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-lg font-black">Message SMS automatique</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
              Le message est généré avec le commerce, le service, la date,
              l&apos;heure, le prix et la langue. Vous pouvez l&apos;éditer avant envoi.
            </p>
            <textarea
              className="mt-4 min-h-44 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm leading-6"
              onChange={(event) => {
                setCustomMessage(event.target.value);
              }}
              value={message}
            />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-[var(--muted)]">
              <span>{count} caractères</span>
              <span>{segments} segment SMS estimé</span>
              {count > 320 ? (
                <span className="rounded-full bg-[#fff1de] px-2 py-1 text-[#8a4b11]">
                  Message long : vérifiez le coût avant l&apos;envoi.
                </span>
              ) : null}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => setConfirmOpen(true)} type="button">
                Préparer l&apos;envoi
              </Button>
              <Button onClick={resetMessage} type="button" variant="secondary">
                Réinitialiser le message automatique
              </Button>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[#f6f7f2] p-5">
            <p className="text-sm font-black">Aperçu client</p>
            <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm">
              <p className="text-sm leading-6">{message}</p>
            </div>
            <p className="mt-4 rounded-2xl border border-[#d9e6e1] bg-white p-3 text-sm font-bold text-[var(--primary-strong)]">
              Aucun client ne sera confirmé automatiquement. Vous choisissez
              manuellement après les réponses.
            </p>
          </div>
        </div>
      </section>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(20,38,46,0.24)] p-4">
          <div className="max-w-lg rounded-3xl border border-[var(--line)] bg-white p-6 shadow-2xl">
            <h2 className="text-xl font-black">Confirmer l&apos;envoi de l&apos;alerte ?</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Cette interface prépare l&apos;alerte pour {eligibleClients.length}{" "}
              clients admissibles. Aucun SMS réel n&apos;est envoyé sans provider
              configuré, et aucun rendez-vous n&apos;est confirmé automatiquement.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={() => setConfirmOpen(false)} type="button">
                J&apos;ai compris
              </Button>
              <Button
                onClick={() => setConfirmOpen(false)}
                type="button"
                variant="secondary"
              >
                Retour modifier
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
